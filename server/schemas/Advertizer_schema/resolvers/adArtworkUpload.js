// resolvers/ads/uploadArtwork.js
import { GraphQLError } from "graphql";
import { Ad } from "../../../models/Advertizer/index_advertizer.js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";

// ---------- Config ----------
const CONFIG = {
  s3: {
    region: process.env.JWT_REGION_SONGS_TO_STREAM,
     credentials: {
      accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
      secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
    }
  },
  bucket: process.env.BUCKET_NAME_AD_ARTWORK,      // <-- required
  fallbackKey: "system/fallback-artwork.webp",
  width: 1200,
  height: 1200,
  webpQuality: 82,
  cacheControl: "public, max-age=31536000, immutable",
};

const s3 = new S3Client(CONFIG.s3);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const gqlErr = (msg, code = "BAD_REQUEST") =>
  new GraphQLError(msg, { extensions: { code } });

const urlFor = (key) =>
  process.env.CDN_BASE_URL
    ? `${process.env.CDN_BASE_URL}/${key}`
    : `https://${CONFIG.bucket}.s3.${CONFIG.s3.region}.amazonaws.com/${key}`;

// ---------- Ensure fallback exists (no in-memory cache) ----------
async function ensureFallbackImage() {
  if (!CONFIG.bucket) throw gqlErr("Missing BUCKET_NAME_AD_ARTWORK env");

  try {
    await s3.send(new HeadObjectCommand({ Bucket: CONFIG.bucket, Key: CONFIG.fallbackKey }));
    return urlFor(CONFIG.fallbackKey);
  } catch (e) {
    const notFound =
      e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound" || e?.Code === "NotFound";
    if (!notFound) throw e;

    // Generate a simple default banner once
    const svg = `
      <svg width="${CONFIG.width}" height="${CONFIG.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" font-weight="700"
              fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
          ADVERTISEMENT
        </text>
      </svg>
    `;
    const body = await sharp(Buffer.from(svg))
      .webp({ quality: CONFIG.webpQuality })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: CONFIG.bucket,
      Key: CONFIG.fallbackKey,
      Body: body,
      ContentType: "image/webp",
      CacheControl: CONFIG.cacheControl,
    }));

    return urlFor(CONFIG.fallbackKey);
  }
}

// ---------- Process + upload user image (no size cap) ----------
async function processAndUploadImage(adId, file) {
  const upload = await file; // GraphQL Upload promise
  if (!upload) throw gqlErr("No file received");

  const { createReadStream, mimetype } = upload;
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw gqlErr(`Unsupported image type: ${mimetype}. Use JPG, PNG, or WEBP.`);
  }

  // Read stream to buffer
  const chunks = [];
  for await (const chunk of createReadStream()) chunks.push(chunk);
  const input = Buffer.concat(chunks);

  // Normalize → 1200×1200 WEBP
  const processed = await sharp(input)
    .rotate()
    .resize(CONFIG.width, CONFIG.height, { fit: "cover", position: "center" })
    .webp({ quality: CONFIG.webpQuality })
    .toBuffer();

  // Build key and upload
  const ts = Date.now();
  const hash = crypto.createHash("md5").update(input).digest("hex");
  const key = `artwork/${adId}/${ts}-${hash}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: CONFIG.bucket,
    Key: key,
    Body: processed,
    ContentType: "image/webp",
    CacheControl: CONFIG.cacheControl,
  }));

  return urlFor(key);
}

// ---------- Resolver ----------
export default async function uploadArtwork(_parent, { adId, file }, context) {
  const advertiser = context.advertizer || context?.req?.advertizer;
  if (!advertiser) throw gqlErr("Could not authenticate advertizer", "UNAUTHENTICATED");
  if (!CONFIG.bucket) throw gqlErr("Missing BUCKET_NAME_AD_ARTWORK env");

  const ad = await Ad.findById(adId);
  if (!ad) throw gqlErr("Ad not found", "NOT_FOUND");
  if (!ad.isPaid) throw gqlErr("Ad is not paid", "FORBIDDEN");
  if (String(ad.advertiserId) !== String(advertiser._id)) throw gqlErr("Forbidden", "FORBIDDEN");

  try {
    const artworkUrl = file
      ? await processAndUploadImage(adId, file)
      : await ensureFallbackImage();

    ad.adArtWorkUrl = artworkUrl;
    ad.isApproved = false;

    ad.updatedAt = new Date();
    await ad.save();

    return ad;
  } catch (e) {
    console.error("Artwork upload failed:", e);
    throw gqlErr(e?.message || "Failed to process artwork");
  }
}
