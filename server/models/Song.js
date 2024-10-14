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
  type: Schema.Types.ObjectId,
  ref: 'Genre',
  
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for frequently queried fields
songSchema.index({ title: 1 }); // Index for song title searches
songSchema.index({ artists: 1 }); // Index for artist-based searches
songSchema.index({ genre: 1 }); // Index for genre-based filters
songSchema.index({ releaseDate: -1 }); // Index for sorting by release date (newest first)
songSchema.index({ trendingScore: -1 }); // Index for sorting by trending songs

const Song = model('Song', songSchema);

module.exports = Song;
