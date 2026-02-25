import "dotenv/config";
import mongoose from "mongoose";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import Song from "../models/Artist/index_artist.js";
import { processOriginalSong } from "./processOriginalSong.js";

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
} = process.env;

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
if (!SQS_QUEUE_URL) throw new Error("Missing SQS_QUEUE_URL");

const sqs = new SQSClient({ region: PROCESSING_REGION });

// =====================
// Utils
// =====================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseS3Event(body) {
  const payload = JSON.parse(body);
  const rec = payload?.Records?.[0];

  if (!rec?.s3?.bucket?.name || !rec?.s3?.object?.key) {
    throw new Error("Invalid S3 event payload (missing bucket/key)");
  }

  const bucket = rec.s3.bucket.name;
  const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, " "));

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

  return Song.findOneAndUpdate(
    {
      bucket,
      s3Key: key,
      songUploadStatus: { $in: ["UPLOADING", "RECEIVED", "FAILED"] },
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
      songUploadStatus: "COMPLETED",
      ...updates,
      processingFinishedAt: new Date(),
    },
  });
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

    if (existing.songUploadStatus === "COMPLETED") {
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
      await markCompleted(song._id, {
        publishStatus: result.publishStatus,
        processingMessage: result.processingMessage,
      });
    } else {
      // PROCESSED
      await markCompleted(song._id, {
        fingerprintRef: result.fingerprintRef,
        bpm: result.bpm,
        duration: result.duration,
        streamingBucket: result.streamingBucket,
        regularKey: result.regularKey,
        premiumKey: result.premiumKey,
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