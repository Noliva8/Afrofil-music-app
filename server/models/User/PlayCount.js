import { Schema, model } from 'mongoose';

const playCountSchema = new Schema({
  user: { type: Schema.Types.ObjectId,
   ref: 'User', 
   required: true 
   },

  played_songs: { type: Schema.Types.ObjectId,
   ref: 'Song', 
   required: true
    },

  count: { 
    type: Number,
     default: 0 
     },

       createdAt: {
    type: Date,
    default: Date.now
  }
});

const PlayCount = model('PlayCount', playCountSchema);

export default PlayCount;
