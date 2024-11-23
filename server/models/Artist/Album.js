

import { Schema, model } from 'mongoose';

const albumSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: [{
   type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }],

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
    ref: 'Song',
     required: true, 
  }],
  
  genre: {
  type: Schema.Types.ObjectId,
  ref: 'Genre'
},
  albumCoverImage: {
    type: String, 
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Album = model('Album', albumSchema);


export default Album;
