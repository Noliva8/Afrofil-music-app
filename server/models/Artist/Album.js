

import { Schema, model } from 'mongoose';

const albumSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  artist: {
   type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },

  releaseDate: {
    type: Date,
   
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
     
  }],
  
  albumCoverImage: {
    type: String, 
    
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Album = model('Album', albumSchema);


export default Album;
