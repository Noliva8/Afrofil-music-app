const { Schema, model } = require('mongoose');

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
    ref: 'Album'
  },
  genre: {
    type: String,
    required: true,
    enum: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical'] // Example genres
  },
  duration: {
    type: Number,
    required: true, // Ensure duration is positive
    min: 0
  },
  playCount: {
    type: Number,
    default: 0
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Song = model('Song', songSchema);

module.exports = Song;

