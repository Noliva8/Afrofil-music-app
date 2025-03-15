import mongoose, { Schema, model } from 'mongoose';

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

  featuringArtist: {
    type: [String]
  },

  album: {
    type: Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },

  trackNumber: {
    type: Number
  },

  genre: {
    type: String
  },

  producer: {
    type: [String],
  },

  composer: {
    type: [String]
  },

  label: {
    type: String
  },

  duration: {
    type: Number,
    required: true,
    min: 0
  },

  playCount: {
    type: Number,
    default: 0,
   
  },

  releaseDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v <= Date.now();
      },
      message: 'Release date cannot be in the future.'
    }
  },

  lyrics: {
    type: String
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

  audioFileUrl: {
    type: String,
  },

   streamAudioFileUrl: {
    type: String,
  },



  artwork: {
    type: String,
  },

  audioHash: {
    type: String,
    
    
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});



// Add indexes for frequently queried fields
songSchema.index({ title: 1 });
songSchema.index({ artist: 1 }); 
songSchema.index({ genre: 1 });
songSchema.index({ releaseDate: -1 });
songSchema.index({ trendingScore: -1 });

const Song = model('Song', songSchema);

export default Song;
