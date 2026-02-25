import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";

import FingerprintGenerator from "../utils/factory/generateFingerPrint2.js";
import FingerprintMatcher from "../utils/factory/fingerprintMatcher.js";
import tempoDetect from "../utils/Covers/Indicators/tempoDetection.js";
import { extractDuration } from "../utils/songDuration.js";

import Fingerprint from "../models/Artist/Fingeprints.js";

const PROCESSING_REGION = process.env.PROCESSING_REGION || "us-east-2";
const STREAMING_BUCKET = process.env.STREAMING_BUCKET;
if (!STREAMING_BUCKET) throw new Error("Missing STREAMING_BUCKET");

const s3 = new S3Client({ region: PROCESSING_REGION });

async function downloadS3ToFile({ bucket, key, outPath }) {
  const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!resp.Body) throw new Error("S3 GetObject returned empty Body");
  await pipeline(resp.Body, fs.createWriteStream(outPath));
}

async function uploadFileToS3({ bucket, key, filePath, contentType = "audio/mpeg" }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
    })
  );
}

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {}
}

function makeTempPath(prefix, key, ext = "") {
  const base = path.basename(key).replace(/[^\w.\-]+/g, "_");
  return path.join(os.tmpdir(), `${prefix}-${Date.now()}-${base}${ext}`);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));

    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg failed (code=${code}): ${stderr.slice(-2000)}`));
    });
  });
}

async function transcodeRegularMp3(inputPath, outputPath) {
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-b:a",
    "128k",
    "-codec:a",
    "libmp3lame",
    outputPath,
  ]);
}

async function transcodePremiumMp3(inputPath, outputPath) {
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-b:a",
    "320k",
    "-codec:a",
    "libmp3lame",
    outputPath,
  ]);
}

export async function processOriginalSong(songDoc, s3Info) {
  const { bucket, key } = s3Info;

  const artistId = songDoc.artist?.toString?.() || String(songDoc.artist);
  const songId = songDoc._id?.toString?.() || String(songDoc._id);

  const tempOriginalPath = makeTempPath("orig", key);
  const tempRegularPath = makeTempPath("regular", key, ".mp3");
  const tempPremiumPath = makeTempPath("premium", key, ".mp3");

  // ✅ Your required prefixes
  const regularKey = `regular/${songId}.mp3`;
  const premiumKey = `premium/${songId}.mp3`;

  try {
    // 1) Download original to /tmp
    await downloadS3ToFile({ bucket, key, outPath: tempOriginalPath });

    const stats = await fs.promises.stat(tempOriginalPath);
    if (!stats || stats.size === 0) throw new Error("Downloaded file is empty");

    // 2) Fingerprint
    const fingerprint = await FingerprintGenerator(
      fs.createReadStream(tempOriginalPath, { highWaterMark: 64 * 1024 })
    );

    // 3) Duplicate / copyright check
    const matchingResults = await FingerprintMatcher.findMatches(fingerprint, artistId, {
      minMatches: 5,
    });

    if (matchingResults?.finalDecision) {
      const { status, message } = matchingResults.finalDecision;

      const publishStatus =
        status === "artist_duplicate"
          ? "DUPLICATE"
          : status === "copyright_issue"
          ? "COPYRIGHT_ISSUE"
          : String(status || "BLOCKED").toUpperCase();

      return {
        processingOutcome: "BLOCKED",
        publishStatus,
        processingMessage: message || "Blocked by fingerprint checks",
      };
    }

    // 4) Save fingerprint model, reference in Song
    const fpDoc = await Fingerprint.create({
      artist: artistId,
      song: songId,
      fingerprint,
    });

    // 5) Tempo + Duration
    const [tempoResult, duration] = await Promise.all([
      tempoDetect(tempOriginalPath),
      extractDuration(tempOriginalPath),
    ]);

    const bpm = tempoResult?.tempo ?? tempoResult?.bpm ?? null;

    // 6) Transcode both versions
    await transcodeRegularMp3(tempOriginalPath, tempRegularPath);
    await transcodePremiumMp3(tempOriginalPath, tempPremiumPath);

    // 7) Upload to S3 under your two paths
    await uploadFileToS3({
      bucket: STREAMING_BUCKET,
      key: regularKey,
      filePath: tempRegularPath,
      contentType: "audio/mpeg",
    });

    await uploadFileToS3({
      bucket: STREAMING_BUCKET,
      key: premiumKey,
      filePath: tempPremiumPath,
      contentType: "audio/mpeg",
    });

    // 8) Return DB-safe updates
    return {
      processingOutcome: "PROCESSED",
      fingerprintRef: fpDoc._id,
      bpm,
      duration,
      streamingBucket: STREAMING_BUCKET,
      regularKey,
      premiumKey,
    };
  } finally {
    await Promise.allSettled([
      safeUnlink(tempOriginalPath),
      safeUnlink(tempRegularPath),
      safeUnlink(tempPremiumPath),
    ]);
  }
}