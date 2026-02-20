// import ffmpeg from "fluent-ffmpeg";

import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH || "ffmpeg");

export const extractDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error("Failed to extract duration: " + err.message));
      resolve(metadata.format.duration ? metadata.format.duration.toFixed(2) : "0.00");
    });
  });
};
