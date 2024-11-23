
import { Schema, model } from 'mongoose';

const recommendedSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
     },

  recommended_songs: { type: Schema.Types.ObjectId,
   ref: 'Song',
    required: true
     },

  algorithm: {
    type: String,
    enum: [
     'basedOnLikes',
     'basedOnPlayCounts', 
     'trending',
      'newReleases'
      ],
    required: true,
  },

   createdAt: {
    type: Date,
    default: Date.now
  }
});

const Recommended = model('Recommended', recommendedSchema);

export default Recommended;
