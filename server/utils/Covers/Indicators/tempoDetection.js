import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import wav from 'wav-decoder';
import MusicTempo from 'music-tempo';
import path from 'path';

const execAsync = promisify(exec);

// Convert MP3 to WAV using ffmpeg (only if the file is not already a WAV)
async function convertMp3ToWav(inputPath, outputPath) {
  const extension = path.extname(inputPath).toLowerCase();
  
  if (extension === '.wav') {
    console.log('🎵 File is already in WAV format.');
    return false; // No conversion happened
  }

  await execAsync(`ffmpeg -y -i "${inputPath}" "${outputPath}"`);
  return true; // Conversion happened
}

// Detect BPM
async function detectBPM(wavPath) {
  const buffer = await fs.readFile(wavPath);
  const decoded = await wav.decode(buffer);

  let audioData = [];
  const channels = decoded.channelData;
  const numberOfChannels = channels.length;

  if (numberOfChannels === 2) {
    const [ch1, ch2] = channels;
    for (let i = 0; i < ch1.length; i++) {
      audioData[i] = (ch1[i] + ch2[i]) / 2;
    }
  } else {
    audioData = channels[0];
  }

  const tempo = new MusicTempo(audioData);
  return Math.round(tempo.tempo);
}

// Main function


export default async function tempoDetect(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const isOriginalWav = extension === '.wav';
  const wavPath = isOriginalWav ? filePath : filePath.replace(/\.[^/.]+$/, '.wav');

  // Convert only if not WAV
  if (!isOriginalWav) {
    await convertMp3ToWav(filePath, wavPath);
  } else {
    console.log('🎵 File is already in WAV format.');
  }

  // Detect BPM
  let bpm = await detectBPM(wavPath);
  if (bpm > 150) bpm = bpm / 2;
  if (bpm < 60) bpm = bpm * 2;

  console.log('🎧 Detected BPM:', bpm);

  // Clean up only the temp WAV if one was created
  if (!isOriginalWav) {
    try {
      await fs.unlink(wavPath);
      console.log(`🧹 Deleted temp WAV: ${wavPath}`);
    } catch (err) {
      console.warn(`⚠️ Error deleting temp WAV: ${wavPath}`, err);
    }
  }

  return bpm;
}
