

import mongoose from 'mongoose';

const fingerprintSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song', 
    required: true
  },

  audioHash: [{
    hash: Number,
    time: Number
  }],
  
  structureHash: String,
  similarityFingerprint: String,
  beats: [Number],
  chromaPeaks: [[Number]],
  harmonicFingerprint: [Number],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
fingerprintSchema.index({ song: 1 });
fingerprintSchema.index({ 'audioHash.hash': 1 });

const Fingerprint = mongoose.model('Fingerprint', fingerprintSchema);
export default Fingerprint;