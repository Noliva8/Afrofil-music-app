const { Schema, model } = require('mongoose');

const artistSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  bio: {
    type: String
  },
  songs: [{
    type: Schema.Types.ObjectId,
    ref: 'Song'
  }],
  albums: [{
    type: Schema.Types.ObjectId,
    ref: 'Album'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Artist = model('Artist', artistSchema);

module.exports = Artist;
