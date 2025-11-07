import { Schema, model } from 'mongoose';


const likedSongsSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
     },

  liked_songs: { 
    type: Schema.Types.ObjectId, 
    ref: 'Song',
    required: true 
     },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const LikedSongs = model('LikedSongs', likedSongsSchema);

export default LikedSongs;




