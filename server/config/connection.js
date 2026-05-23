import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Connect to MongoDB without deprecated options
   await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
