
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const artistSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
   artistAka: {
    type: String,
    required: true,
    trim: true
  },
  email: {
  type: String,
  required: true,
  unique: true,
  match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ 
},

  password: {
  type: String,
  required: true,
  match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ 
},
  confirmed: {
      type: Boolean,
      default: false
    },

    selectedPlan: {
      type: Boolean,
      default: false
    },

    plan: {
  type: String,
  enum: ['Free Plan', 'Premium Plan', 'Pro Plan'],
  default: 'Free Plan', 
},

role: {
type: String,
  enum: ['artist', 'admin'],
  default: 'artist'
},

 genre:{
   type: [String],
 },

  bio: {
    type: String,
    maxlength: 500 
  },
  country: { type: String }, 

  languages: { type: [String]},

  mood: { type: [String] },
  
  category: {type: String},

  profileImage: {  
    type: String, 
  },

  coverImage: {  
    type: String, 
  },
  
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],

  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});


artistSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

artistSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const Artist = model('Artist', artistSchema);

export default Artist;