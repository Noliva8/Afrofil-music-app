import { Ad } from "../../../models/Advertizer/index_advertizer.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Ffmpeg from "fluent-ffmpeg";
import { extractDuration } from "../../../utils/songDuration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Constants
const CONFIG = {
  s3: {
    region: process.env.JWT_REGION_SONGS_TO_STREAM,
    credentials: {
      accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
      secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
    }
  },

  buckets: {
    streaming: process.env.BUCKET_NAME_AD_STREAMING,
    fallback: process.env.BUCKET_NAME_AD_FALLBACK,
    original: process.env.BUCKET_NAME_AD_ORIGINAL
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    maxDuration: 60 // 60 seconds max for ads
  },
  audio: {
    opusBitrate: "96k",
    aacBitrate: "128k"
  }
};

// Initialize S3 clients
const [s3Streaming, s3Fallback, s3Original] = [
  new S3Client(CONFIG.s3),
  new S3Client(CONFIG.s3),
  new S3Client(CONFIG.s3)
];

// Supported MIME types
const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg", "audio/wav", "audio/aac", "audio/mp4",
  "audio/x-m4a", "audio/flac", "audio/ogg", "audio/opus", "audio/webm"
]);

// Helper functions
const sanitizeFilename = (name) => 
  name.normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .toLowerCase();

const generateS3Url = (bucket, key) => 
  process.env.CDN_BASE_URL 
    ? `${process.env.CDN_BASE_URL}/${key}`
    : `https://${bucket}.s3.${CONFIG.s3.region}.amazonaws.com/${key}`;

const validateAd = (ad, advertiserId) => {
  if (!ad) throw new Error("Ad not found");
  if (!ad.isPaid) throw new Error("Ad is not paid");
  if (String(ad.advertiserId) !== String(advertiserId)) throw new Error("Forbidden: not your ad");
  if (ad.adType !== "audio") throw new Error("This endpoint accepts audio ads only");
};

export default async function audioAdUpload(_parent, { adId, file }, context) {
  // Authentication
  const advertizer = context.advertizer || context?.req?.advertizer;
  if (!advertizer) throw new Error("Could not authenticate advertiser");

  // Temporary file paths
  let tempFiles = {
    original: "",
    streaming: "",
    fallback: ""
  };

  try {
    // Validate ad exists and belongs to advertiser
    const ad = await Ad.findById(adId);
    validateAd(ad, advertizer._id);

    // Process file upload
    const { createReadStream, filename, mimetype } = await file;
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimetype)) {
      throw new Error(`Unsupported file format: ${mimetype}`);
    }

    // Create temp directory
    const tmpDir = path.join(__dirname, "temp_uploads");
    await fsp.mkdir(tmpDir, { recursive: true });

    // Generate unique filenames
    const timestamp = Date.now();
    const fileBase = `${adId}-${timestamp}-${sanitizeFilename(filename)}`;
    
    tempFiles.original = path.join(tmpDir, `orig_${fileBase}`);
    tempFiles.streaming = path.join(tmpDir, `stream_${fileBase}.opus`);
    tempFiles.fallback = path.join(tmpDir, `fallback_${fileBase}.m4a`);

    // Stream file to disk with size validation
    await streamFileWithLimit(
      createReadStream(),
      tempFiles.original,
      CONFIG.limits.fileSize
    );

    // Extract audio duration
    const durationSeconds = await extractDuration(tempFiles.original);
    if (durationSeconds > CONFIG.limits.maxDuration) {
      throw new Error(`Audio exceeds maximum duration of ${CONFIG.limits.maxDuration} seconds`);
    }

    // Transcode audio files in parallel
    await Promise.all([
      transcodeToOpus(tempFiles.original, tempFiles.streaming, CONFIG.audio.opusBitrate),
      transcodeToAac(tempFiles.original, tempFiles.fallback, CONFIG.audio.aacBitrate)
    ]);

    // Prepare S3 uploads
    const s3Uploads = [
      uploadToS3(
        s3Streaming,
        CONFIG.buckets.streaming,
        `ads/${adId}/audio/streaming/${timestamp}.opus`,
        tempFiles.streaming,
        "audio/opus"
      ),
      uploadToS3(
        s3Fallback,
        CONFIG.buckets.fallback,
        `ads/${adId}/audio/fallback/${timestamp}.m4a`,
        tempFiles.fallback,
        "audio/mp4"
      ),
      uploadToS3(
        s3Original,
        CONFIG.buckets.original,
        `ads/${adId}/audio/original/${timestamp}${path.extname(filename)}`,
        tempFiles.original,
        mimetype
      )
    ];

    // Execute all uploads in parallel
    await Promise.all(s3Uploads);

    // Generate public URLs
    const urls = {
      original: generateS3Url(
        CONFIG.buckets.original,
        `ads/${adId}/audio/original/${timestamp}${path.extname(filename)}`
      ),
      streaming: generateS3Url(
        CONFIG.buckets.streaming,
        `ads/${adId}/audio/streaming/${timestamp}.opus`
      ),
      fallback: generateS3Url(
        CONFIG.buckets.fallback,
        `ads/${adId}/audio/fallback/${timestamp}.m4a`
      )
    };

    // Update ad document
    const updatedAd = await Ad.findByIdAndUpdate(
      adId,
      {
        $set: {
          masterAudionAdUrl: urls.original,
          streamingAudioAdUrl: urls.streaming,
          streamingFallBackAudioUrl: urls.fallback,
          audioFormat: mimetype,
          audioDurationMs: Math.round(durationSeconds * 1000),
          isApproved: false,
          status: "waiting_for_approval",
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedAd) throw new Error("Failed to update ad document");
    return updatedAd;

  } catch (error) {
    console.error("Audio upload error:", error);
    throw new Error(`Audio upload failed: ${error.message}`);
  } finally {
    // Cleanup temporary files
    await cleanupFiles(tempFiles);
  }
}

// Helper Functions

async function streamFileWithLimit(stream, filePath, maxBytes) {
  return new Promise((resolve, reject) => {
    let bytesReceived = 0;
    const writeStream = fs.createWriteStream(filePath);
    
    stream.on("data", (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        stream.destroy();
        writeStream.destroy();
        reject(new Error(`File exceeds size limit of ${maxBytes / (1024 * 1024)}MB`));
      }
    });

    stream.pipe(writeStream)
      .on("finish", resolve)
      .on("error", reject);
  });
}

function transcodeToOpus(inputPath, outputPath, bitrate) {
  return new Promise((resolve, reject) => {
    Ffmpeg(inputPath)
      .audioCodec("libopus")
      .audioBitrate(bitrate)
      .outputOptions(["-application", "audio", "-ar", "48000"])
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

function transcodeToAac(inputPath, outputPath, bitrate) {
  return new Promise((resolve, reject) => {
    Ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate(bitrate)
      .format("mp4")
      .outputOptions(["-movflags", "faststart"])
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

async function uploadToS3(client, bucket, key, filePath, contentType) {
  const fileStream = fs.createReadStream(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: contentType
    })
  );
}

async function cleanupFiles(files) {
  await Promise.all(
    Object.values(files)
      .filter(filePath => filePath && fs.existsSync(filePath))
      .map(filePath => fsp.unlink(filePath))
  );
}