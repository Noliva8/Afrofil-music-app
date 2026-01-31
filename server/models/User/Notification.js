import { Schema, model } from 'mongoose';



const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  bookingId: { type: Schema.Types.ObjectId, ref: 'BookArtist', required: true, index: true },

  messageId: { type: Schema.Types.ObjectId, ref: 'Message',  index: true },

  type: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    required: true,
  },

  message: { type: String },

  isArtistRead: { type: Boolean, default: false },
  isChatEnabled: { type: Boolean, default: false },
  isNotificationSeen: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });

const UserNotification = model('UserNotification', notificationSchema);

export default UserNotification;
