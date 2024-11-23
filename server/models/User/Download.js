import { Schema, model } from 'mongoose';


const downloadSchema = new Schema({
  user: {
     type: Schema.Types.ObjectId, 
     ref: 'User', 
     required: true 
     },
  downloaded_songs: { type: Schema.Types.ObjectId,
   ref: 'Song', 
   required: true
    },

      createdAt: {
    type: Date,
    default: Date.now
  }

  
});

const Download = model('Download', downloadSchema);

export default Download;
