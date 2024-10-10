const { Schema, model } = require('mongoose');

const favoriteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [{
    type: Schema.Types.ObjectId,
    ref: 'Song'
  }],
  albums: [{
    type: Schema.Types.ObjectId,
    ref: 'Album'
  }],
  playlists: [{
    type: Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Favorite = model('Favorite', favoriteSchema);

module.exports = Favorite;
