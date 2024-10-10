const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
  type: String,
  required: true,
  unique: true,
  match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ 
},

  password: {
  type: String,
  required: true,
  match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ 
},

  likedSongs: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Song' 
  }],
  playlists: [{
    type: Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  searchHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Song'
  }],
  playCounts: [{
    song: { 
      type: Schema.Types.ObjectId,
      ref: 'Song'
    },
    count: { type: Number, default: 0 }
  }],
  downloads: [{
    song: {
      type: Schema.Types.ObjectId,
      ref: 'Song'
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recommendedSongs: [{
    song: {  // Changed to singular 'song' for clarity
      type: Schema.Types.ObjectId, 
      ref: 'Song' 
    },
    algorithm: {
      type: String, 
      enum: ['basedOnLikes', 'basedOnPlayCounts', 'trending', 'newReleases']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = model('User', userSchema);

module.exports = User;
