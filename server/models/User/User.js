import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new Schema({
  username: {
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

following: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});



userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};



const User = model('User', userSchema);

export default User;

