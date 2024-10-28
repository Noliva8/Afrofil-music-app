const { Schema, model } = require('mongoose');
const crypto = require('crypto'); // Require crypto for hashing

const songSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  album: {
    type: Schema.Types.ObjectId,
    ref: 'Album',
    default: 'Unknown'
  },
  genre: {
    type: Schema.Types.ObjectId,
    ref: 'Genre',
    default: 'Unknown'
  },
  duration: {
    type: Number,
    required: true, 
    min: 0
  },
  playCount: {
    type: Number,
    default: 0,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true, 
    validate: {
      validator: function(v) {
        return v <= Date.now(); 
      },
      message: 'Release date cannot be in the future.'
    }
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  likedByUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  trendingScore: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  recommendedFor: [{
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    algorithm: {
      type: String, 
      enum: ['basedOnLikes', 'basedOnPlayCounts', 'trending', 'newReleases']
    }
  }],
  audioFilePath: {
    type: String,
    required: true
  },
  audioHash: { 
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to check for duplicates
songSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('audioHash')) { // Only check for new or modified entries
    const existingSong = await this.constructor.findOne({ audioHash: this.audioHash });
    if (existingSong) {
      return next(new Error('This song has already been uploaded.'));
    }
  }
  next();
});

// Add indexes for frequently queried fields
songSchema.index({ title: 1 });
songSchema.index({ artist: 1 }); // Corrected the field name to 'artist'
songSchema.index({ genre: 1 });
songSchema.index({ releaseDate: -1 });
songSchema.index({ trendingScore: -1 });

const Song = model('Song', songSchema);

module.exports = Song;
