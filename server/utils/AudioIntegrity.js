import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH || "ffmpeg");
import fs from 'fs/promises';

// Function to process audio while maintaining quality
const processAudio = async (inputFilePath, outputFilePath) => {
  try {
    const metadata = await getAudioMetadata(inputFilePath);
    const { format, bitrate, channels } = metadata;

    // Convert bitrate from string to number
    const bitrateNum = parseInt(bitrate, 10);

    // Check if the file is already optimized
    const isMP3 = format.includes('mp3');
    const isStereo = channels === 2;
    const isOptimalBitrate = bitrateNum >= 128000 && bitrateNum <= 192000;

    if (isMP3 && isStereo && isOptimalBitrate) {
      await fs.copyFile(inputFilePath, outputFilePath);
      console.log('File is already optimized. Copying...');
      return outputFilePath;
    }

    console.log('Processing audio...');

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputFilePath)
        .audioFilters([
          'loudnorm=I=-12:TP=-1.5:LRA=11', // More natural normalization (-12 LUFS)
          !isStereo ? 'pan=stereo|c0=c0|c1=c0' : null, // Convert mono to stereo
          'silenceremove=start_threshold=-50dB', // Remove silence at the start and end
        ].filter(Boolean))
        .audioBitrate('128k') // Reduced bitrate to reduce file size
        .audioCodec('libmp3lame') // Use the libmp3lame codec (standard for MP3 encoding)
        .on('end', () => {
          console.log('Audio processing completed:', outputFilePath);
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          console.error('FFmpeg processing error:', err.message);
          reject(err);
        })
        .save(outputFilePath);
    });
  } catch (error) {
    console.error('Audio processing failed:', error);
    throw error;
  }
};

// Function to get audio metadata
const getAudioMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve({
        format: data.format.format_name,
        bitrate: data.format.bit_rate, // Ensuring we get bit_rate as a string
        channels: data.streams[0].channels,
      });
    });
  });
};

export { processAudio };
