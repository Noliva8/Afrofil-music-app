
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const artistSchema = new Schema({
  firstname: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  lastname: {
    type: String,
    required: true,
    unique: true,
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

role: {
  type: String,
    required: true,
},

  bio: {
    type: String,
    maxlength: 500 
  },

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