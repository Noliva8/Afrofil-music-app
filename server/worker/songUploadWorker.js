import "dotenv/config";
import mongoose from "mongoose";
import fetch from "node-fetch";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import {Song} from '../models/Artist/index_artist.js'
import { processOriginalSong } from "./processOriginalSong.js";
import { getRedis } from "../utils/AdEngine/redis/redisClient.js";




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
  WORKER_NOTIFICATION_TOKEN,
  SERVER_URL,
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
      songUploadStatus: "COMPLETED",
      ...updates,
      processingFinishedAt: new Date(),
    },
  });
}

function buildS3Url(bucket, key) {
  if (!bucket || !key) return null;
  return `https://${bucket}.s3.amazonaws.com/${encodeURI(key)}`;
}

const notificationEndpoint = SERVER_URL
  ? `${SERVER_URL.replace(/\/$/, "")}/graphql`
  : undefined;

async function sendUploadProgressNotification({
  artistId,
  songId,
  status,
  step,
  message,
  percent,
  isComplete,
}) {
  if (!artistId || !songId || !status || !step) return;
  if (!notificationEndpoint) return;

  const payload = {
    query: `
      mutation NotifySongUploadProgress(
        $artistId: ID!
        $songId: ID!
        $status: UploadStatus!
        $step: UploadStep!
        $message: String
        $percent: Float
        $isComplete: Boolean
      ) {
        notifySongUploadProgress(
          artistId: $artistId
          songId: $songId
          status: $status
          step: $step
          message: $message
          percent: $percent
          isComplete: $isComplete
        ) {
          step
          status
        }
      }
    `,
    variables: {
      artistId,
      songId,
      status,
      step,
      message,
      percent,
      isComplete,
    },
  };

  try {
    const response = await fetch(notificationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WORKER_NOTIFICATION_TOKEN
          ? { Authorization: `Bearer ${WORKER_NOTIFICATION_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        "[worker] Upload notification failed with status",
        response.status,
        await response.text()
      );
    }
  } catch (err) {
    console.error("[worker] Upload notification error:", err);
  }
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
    const artistIdStr = song.artist?.toString?.() || String(song.artist);

    if (result?.processingOutcome === "BLOCKED") {
      if (result.publishStatus === "DUPLICATE") {
        await Song.findByIdAndDelete(song._id);
        console.log(`[worker] Removed duplicate songId=${song._id}`);
        await sendUploadProgressNotification({
          artistId: artistIdStr,
          songId: song._id.toString(),
          status: "DUPLICATE",
          step: "CHECKING_DUPLICATES",
          message: result.processingMessage,
          percent: 100,
          isComplete: true,
        });
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
      await sendUploadProgressNotification({
        artistId: artistIdStr,
        songId: song._id.toString(),
        status: "COMPLETED",
        step: "FINALIZING",
        percent: 100,
        isComplete: true,
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
