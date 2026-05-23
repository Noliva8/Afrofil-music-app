
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import your models properly
import '../models/Artist/index_artist.js'; // This should register the Artist model
import '../models/Artist/Album.js'; // This should register the Album model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testMongoDB() {
  try {
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afrofeel';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    
    // Get models from mongoose (they should be registered by the imports above)
    const Artist = mongoose.model('Artist');
    const Album = mongoose.model('Album');
    
    // Test basic queries
    const artistCount = await Artist.countDocuments();
    
    const albumCount = await Album.countDocuments();
    
    // Test fetching some data
    if (artistCount > 0) {
      const sampleArtist = await Artist.findOne().populate('songs albums').lean();
    }
    
    if (albumCount > 0) {
      const sampleAlbum = await Album.findOne().populate('artist songs').lean();
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMongoDB();