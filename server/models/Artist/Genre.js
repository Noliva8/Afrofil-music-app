
import { Schema, model } from 'mongoose';

const genreSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
    
  },
  songs: [{
    type: Schema.Types.ObjectId,
    ref: 'Song'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Genre = model('Genre', genreSchema);

export default Genre;