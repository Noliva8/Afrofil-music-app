const { Schema, model } = require('mongoose');

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
  playlist: {
    type: Schema.Types.ObjectId,
    ref: 'Playlist'
  },
  album: {
    type: Schema.Types.ObjectId,
    ref: 'Album'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment = model('Comment', commentSchema);

module.exports = Comment;
