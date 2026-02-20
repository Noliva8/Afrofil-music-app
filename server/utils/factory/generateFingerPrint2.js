

import Codegen from 'stream-audio-fingerprint';
import { spawn } from 'child_process';

// const createDecoder = () => {
//   return spawn('ffmpeg', [
//     '-i', 'pipe:0',
//     '-acodec', 'pcm_s16le',
//     '-ar', 22050,
//     '-ac', 1,
//     '-f', 'wav',
//     '-v', 'fatal',
//     'pipe:1'
//   ], { stdio: ['pipe', 'pipe', process.stderr] });
// };



const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";

const createDecoder = () => {
  return spawn(FFMPEG_BIN, [
    '-i', 'pipe:0',
    '-acodec', 'pcm_s16le',
    '-ar', 22050,
    '-ac', 1,
    '-f', 'wav',
    '-v', 'fatal',
    'pipe:1'
  ], { stdio: ['pipe', 'pipe', process.stderr] });
};




const FingerprintGenerator = async (inputStream) => {
  return new Promise((resolve, reject) => {
    const decoder = createDecoder();
    const fingerprinter = new Codegen();
    const fingerprints = [];

    decoder.stdout.pipe(fingerprinter);

    fingerprinter.on('data', (data) => {
      for (let i = 0; i < data.tcodes.length; i++) {
        fingerprints.push({
          time: data.tcodes[i],
          hash: data.hcodes[i],
        });
      }
    });

    fingerprinter.on('end', () => {
      resolve(fingerprints);
    });

    fingerprinter.on('error', reject);
    decoder.on('error', reject);

    inputStream.pipe(decoder.stdin);
  });
};


export default FingerprintGenerator;