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


mood: {
  type: [String],
  enum: [
    "Party",
    "Chill",
    "Gospel",
    "Heartbreak",
    "Traditional",
    "Romantic",
    "Motivational",
    "Cultural"
  ],
  default: [],
},

subMoods: {
  type: [String],
  enum: [
    "Worship",
    "Praise",
    "Traditional Gospel",
    "Club Anthem",
    "Wedding",
    "Breakup",
    "Street",
    "Motivation",
    "Prayer",
    "Rebellion"
  ],
  default: []
},


  producer: [
    {
      name: { type: String },
      role: { type: String, default: "" },
    },
  ],

composer: [
  {
    name: { type: String },
    contribution: { type: String, default: "" },
  }
],

  label: {
    type: String
  },

  duration: {
    type: Number,
    required: true,
    min: 0
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

  

   playCount: {
    type: Number,
    default: 0,
   
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

 monetization: { type: Boolean, default: false },

  copyrightSettings: {
   
    allowRemix: { type: Boolean, default: true },   
    allowCover: { type: Boolean, default: true },  
    allowSampling: { type: Boolean, default: true },
    requireCredit: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    monetization: { type: Boolean, default: false }  
  },

  visibility: {
  type: String,
  enum: ["public", "private"],
  default: "public"
},

  audioFileUrl: {
    type: String,
  },

   streamAudioFileUrl: {
    type: String,
  },

  artwork: {
    type: String,
  },


  tempo: {
    type: Number
  },

  key: {
    type: String
  },

    keyConfidence: {
    type: Number
  },

  mode: {
    type: Number
  },

timeSignature: {
  type: Number
},
  beats: {
    type: [Number]
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});



// Add indexes for frequently queried fields
// Add these indexes to your songSchema (before creating the model)
songSchema.index({ artist: 1, album: 1, genre: 1, tempo: 1 });
songSchema.index({ genre: 1, mood: 1, subMoods: 1, tempo: 1 });
songSchema.index({ mood: 1, subMoods: 1, tempo: 1 });
songSchema.index({ subMoods: 1, tempo: 1 });
songSchema.index({ tempo: 1 });
songSchema.index({ releaseDate: -1, trendingScore: -1 });

// For population performance
songSchema.index({ artist: 1, releaseDate: -1 });

const Song = model('Song', songSchema);


export default Song;
