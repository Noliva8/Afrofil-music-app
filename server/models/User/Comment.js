
import { Schema, model } from 'mongoose';

const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  song: {
    type: Schema.Types.ObjectId,
    ref: 'Song'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment = model('Comment', commentSchema);

export default Comment;
