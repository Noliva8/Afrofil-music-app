import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  
  // Explicitly store both parties
  artistId: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
    index: true
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Who sent this message?
  senderId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  
  senderType: {
    type: String,
    enum: ['artist', 'user'],
    required: true
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readByArtist: {  // Track read status separately
    type: Boolean,
    default: false
  },
  
  readByUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ bookingId: 1, createdAt: -1 });
messageSchema.index({ bookingId: 1, isRead: 1 });

const Message = model('Message', messageSchema);

export default Message;