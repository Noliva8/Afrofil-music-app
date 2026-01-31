import { Schema, model } from 'mongoose';



const bookArtistSchema = new Schema(
  {
    // Artist being booked
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true
    },

    // User who is making the booking request
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Optional: song(s) that triggered the booking intent
    song: 
      {
        type: Schema.Types.ObjectId,
        ref: 'Song'
      }
    ,

    // Event details
    eventType: {
      type: String,
      enum: [
        'wedding',
        'concerts',
        'club',
        'festival',
        'corporate',
        'private',
        'other'
      ],
      required: true
    },

    eventDate: {
      type: Date,
      required: true
    },

    location: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      venue: { type: String }
    },

    // Budget info
    budgetRange: {
      type: String,
      enum: [
        '500-1000',
        '1000-3000',
        '3000-5000',
        '5000+',
        'flexible'
      ],
      required: true
    },

    // Performance details
    performanceType: {
      type: String,
      enum: ['DJ', 'Live', 'Acoustic', 'Backing-track'],
      default: 'live'
    },

   setLength: {
  type: Number, // minutes
  enum: [30, 60, 90],
},

customSetLength: {
  type: Number, // minutes
},



    // Message from requester
    message: {
      type: String,
      maxlength: 500
    },

    // Booking lifecycle
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined',],
      default: 'pending',
      index: true
    },

    // Artist response
    artistResponse: {
      message: { type: String },
      respondedAt: { type: Date }
    }
,
    isChatEnabled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const BookArtist = model('BookArtist', bookArtistSchema);

export default BookArtist;
