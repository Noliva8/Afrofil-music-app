const { Schema, model } = require('mongoose');

const albumSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
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

  songs: [{
    type: Schema.Types.ObjectId,
    ref: 'Song'
  }],
  
  genre: {
    type: String,
    required: true
  },
  
  coverImage: {
    type: String, // URL to the album cover image
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Album = model('Album', albumSchema);

module.exports = Album;
