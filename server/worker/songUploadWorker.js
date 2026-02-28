import "dotenv/config";
import mongoose from "mongoose";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { Song, Album } from "../models/Artist/index_artist.js";
import { processOriginalSong } from "./processOriginalSong.js";
// import { getRedis } from "../utils/AdEngine/redis/redisClient.js";




// =====================
// ENV
// =====================
const {
  MONGODB_URI,
  PROCESSING_REGION = "us-east-2",
  SQS_QUEUE_URL,
  WORKER_POLL_WAIT_SECONDS = "20",
  WORKER_MAX_MESSAGES = "5",
  WORKER_VISIBILITY_TIMEOUT = "600", // ✅ safer for fingerprint + 2x ffmpeg
  WORKER_SLEEP_EMPTY_MS = "1000",
  BUCKET_NAME_COVER_IMAGE_SONG,
  BUCKET_ALBUM_COVER_IMAGE,
} = process.env;

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
if (!SQS_QUEUE_URL) throw new Error("Missing SQS_QUEUE_URL");

const sqs = new SQSClient({ region: PROCESSING_REGION });
const s3 = new S3Client({ region: PROCESSING_REGION });
const ARTWORK_BUCKET = BUCKET_NAME_COVER_IMAGE_SONG || "afrofeel-cover-images-for-songs";
const ALBUM_COVER_BUCKET = BUCKET_ALBUM_COVER_IMAGE || "afrofeel-album-covers";

// =====================
// Utils
// =====================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseS3TargetFromUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(String(rawUrl));
    const key = parsed.pathname.replace(/^\/+/, "");
    const hostname = parsed.hostname || "";
    const isS3Host = hostname.includes(".s3.");
    const bucket = isS3Host ? hostname.split(".")[0] : null;
    return { bucket, key };
  } catch {
    return null;
  }
}

function getArtworkUrl(songDoc) {
  if (!songDoc) return null;
  if (typeof songDoc.artwork === "string" && songDoc.artwork.trim()) {
    return songDoc.artwork.trim();
  }
  if (songDoc.artwork && typeof songDoc.artwork.url === "string" && songDoc.artwork.url.trim()) {
    return songDoc.artwork.url.trim();
  }
  return null;
}

async function deleteS3ObjectSafe(bucket, key, label = "S3 object") {
  if (!bucket || !key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.warn(`[worker] Failed to delete ${label} ${bucket}/${key}:`, error?.message || error);
  }
}

async function cleanupDuplicateSong(songDoc, s3Info) {
  const albumId = songDoc?.album;
  const albumDoc = albumId ? await Album.findById(albumId).lean() : null;
  const albumCoverUrl = albumDoc?.albumCoverImage ? String(albumDoc.albumCoverImage).trim() : null;
  const artworkUrl = getArtworkUrl(songDoc);

  const originalBucket = s3Info?.bucket || songDoc?.bucket;
  const originalKey = s3Info?.key || songDoc?.s3Key;

  await Song.deleteOne({ _id: songDoc._id });

  const cleanupTasks = [];

  if (originalBucket && originalKey) {
    cleanupTasks.push(deleteS3ObjectSafe(originalBucket, originalKey, "original upload"));
  }

  if (albumCoverUrl) {
    const target = parseS3TargetFromUrl(albumCoverUrl);
    const bucket = target?.bucket || ALBUM_COVER_BUCKET;
    const key = target?.key;
    if (bucket && key) {
      cleanupTasks.push(deleteS3ObjectSafe(bucket, key, "album cover"));
    }
  }

  if (artworkUrl) {
    const target = parseS3TargetFromUrl(artworkUrl);
    const bucket = target?.bucket || ARTWORK_BUCKET;
    const key = target?.key;
    if (bucket && key) {
      cleanupTasks.push(deleteS3ObjectSafe(bucket, key, "artwork"));
    }
  }

  await Promise.allSettled(cleanupTasks);

  if (albumId) {
    const remaining = await Song.countDocuments({ album: albumId });
    if (remaining === 0) {
      await Album.deleteOne({ _id: albumId });
    }
  }
}



function parseS3Event(body) {
  const payload = JSON.parse(body);

  // SNS -> SQS case: S3 event is in payload.Message
  const maybeS3 = payload?.Records ? payload : payload?.Message ? JSON.parse(payload.Message) : null;

  const rec = maybeS3?.Records?.[0];
  if (!rec?.s3?.bucket?.name || rec?.s3?.object?.key == null) {
    throw new Error("Invalid S3 event payload (missing bucket/key)");
  }

  const bucket = rec.s3.bucket.name;

  // S3 key is URL-encoded; '+' can mean space
  const key = decodeURIComponent(String(rec.s3.object.key).replace(/\+/g, " "));

  // Ignore "folder" placeholder events like originalSongUploads/
  if (key.endsWith("/")) {
    return { ignore: true, bucket, key, reason: "folder-key" };
  }

  return {
    bucket,
    key,
    eventName: rec.eventName,
    eventTime: rec.eventTime,
    size: rec.s3.object.size,
    eTag: rec.s3.object.eTag,
  };
}




async function acquireProcessingLock({ bucket, key }) {
  const now = new Date();

  // normalize: your resolver safeName uses underscores
  const keyUnderscored = key.replace(/[^\w.\-\/]+/g, "_");

  return Song.findOneAndUpdate(
    {
      bucket,
      songUploadStatus: { $in: ["UPLOADING", "RECEIVED", "FAILED"] },
      $or: [
        { s3Key: key },
        { s3key: key }, // legacy field
        { s3Key: keyUnderscored },
        { S3key: keyUnderscored },
      ],
    },
    {
      $set: {
        songUploadStatus: "PROCESSING",
        processingStartedAt: now,
        processingError: null,
      },
      $inc: { processingAttempts: 1 },
    },
    { new: true }
  );
}


async function markCompleted(songId, updates = {}) {
  await Song.findByIdAndUpdate(songId, {
    $set: {
      songUploadStatus: "READY",
      ...updates,
      processingFinishedAt: new Date(),
    },
  });
}

function buildS3Url(bucket, key) {
  if (!bucket || !key) return null;
  return `https://${bucket}.s3.amazonaws.com/${encodeURI(key)}`;
}

async function markFailed(songId, error) {
  await Song.findByIdAndUpdate(songId, {
    $set: {
      songUploadStatus: "FAILED",
      processingError: error?.message || String(error),
      processingFinishedAt: new Date(),
    },
  });
}

// =====================
// Core loop
// =====================
async function handleMessage(msg) {
  const receiptHandle = msg.ReceiptHandle;
  if (!receiptHandle) throw new Error("SQS message missing ReceiptHandle");

  const body = msg.Body;
  if (!body) throw new Error("SQS message missing Body");

  const s3Info = parseS3Event(body);
  if (s3Info.ignore) {
  console.log(`[worker] Ignoring ${s3Info.reason} bucket=${s3Info.bucket} key=${s3Info.key}`);
  await sqs.send(new DeleteMessageCommand({ QueueUrl: SQS_QUEUE_URL, ReceiptHandle: receiptHandle }));
  return;
}
  const { bucket, key } = s3Info;

  console.log(`[worker] S3 event: ${s3Info.eventName} bucket=${bucket} key=${key}`);

  // 1) Acquire lock / transition to PROCESSING
  const song = await acquireProcessingLock({ bucket, key });

  if (!song) {
    const existing = await Song.findOne({ bucket, s3Key: key }).select("_id songUploadStatus");

    if (!existing) {
      // let SQS retry
      throw new Error(`Song not found for bucket/key (will retry): ${bucket}/${key}`);
    }

    if (existing.songUploadStatus === "READY") {
      console.log(`[worker] Song already completed, deleting message. songId=${existing._id}`);
      await sqs.send(
        new DeleteMessageCommand({ QueueUrl: SQS_QUEUE_URL, ReceiptHandle: receiptHandle })
      );
      return;
    }

    console.log(
      `[worker] Song not eligible for lock (status=${existing.songUploadStatus}). Deleting message.`
    );
    await sqs.send(
      new DeleteMessageCommand({ QueueUrl: SQS_QUEUE_URL, ReceiptHandle: receiptHandle })
    );
    return;
  }

  // 2) Process
  try {
    const result = await processOriginalSong(song, s3Info);

    // 3) Persist result safely
    if (result?.processingOutcome === "BLOCKED") {
      if (result.publishStatus === "DUPLICATE") {
        try {
          await cleanupDuplicateSong(song, s3Info);
        } catch (error) {
          console.error(`[worker] Duplicate cleanup failed for songId=${song._id}:`, error);
        }
        console.log(`[worker] Removed duplicate songId=${song._id}`);
      } else {
        await markCompleted(song._id, {
          publishStatus: result.publishStatus,
          processingMessage: result.processingMessage,
        });
      }
    } else {
      // PROCESSED
      await markCompleted(song._id, {
        fingerprintRef: result.fingerprintRef,
        bpm: result.bpm,
        tempo: result.tempo ?? result.bpm,
        duration: result.duration,
        streamingBucket: result.streamingBucket,
        regularKey: result.regularKey,
        premiumKey: result.premiumKey,
        streamAudioFileUrl: buildS3Url(result.streamingBucket, result.regularKey),
        premiumStreamAudioFileUrl: buildS3Url(result.streamingBucket, result.premiumKey),
        publishStatus: "OK",
      });
    }

    // 4) Delete message (ack)
    await sqs.send(
      new DeleteMessageCommand({ QueueUrl: SQS_QUEUE_URL, ReceiptHandle: receiptHandle })
    );
    console.log(`[worker] Completed songId=${song._id} and deleted message.`);
  } catch (err) {
    console.error(`[worker] Processing failed for songId=${song._id}:`, err);
    await markFailed(song._id, err);
    throw err; // do NOT delete => retry/DLQ
  }
}

async function pollLoop() {
  while (true) {
    try {
      const cmd = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: Number(WORKER_MAX_MESSAGES),
        WaitTimeSeconds: Number(WORKER_POLL_WAIT_SECONDS),
        VisibilityTimeout: Number(WORKER_VISIBILITY_TIMEOUT),
      });

      const resp = await sqs.send(cmd);
      const messages = resp.Messages || [];

      if (messages.length === 0) {
        await sleep(Number(WORKER_SLEEP_EMPTY_MS));
        continue;
      }

      for (const msg of messages) {
        try {
          await handleMessage(msg);
        } catch (err) {
          console.error("[worker] Message handling error (SQS will retry):", err.message);
        }
      }
    } catch (err) {
      console.error("[worker] Poll error:", err);
      await sleep(2000);
    }
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("[worker] Connected to MongoDB");

  console.log("[worker] Starting poll loop", {
    PROCESSING_REGION,
    SQS_QUEUE_URL,
    WORKER_POLL_WAIT_SECONDS,
    WORKER_MAX_MESSAGES,
    WORKER_VISIBILITY_TIMEOUT,
  });

  await pollLoop();
}

main().catch((e) => {
  console.error("[worker] Fatal error:", e);
  process.exit(1);
});
