
import fs from 'fs'
import { pipeline } from 'stream';
import { ApolloError } from 'apollo-server-express';
import util from 'util';
import  { Artist, Album, Song, User, Fingerprint } from '../../models/Artist/index_artist.js';
import dotenv from 'dotenv';
import { AuthenticationError, signArtistToken } from '../../utils/artist_auth.js';
import sendEmail from '../../utils/emailTransportation.js';
import awsS3Utils from '../../utils/awsS3.js';
import { S3Client, PutObjectCommand ,CreateMultipartUploadCommand, HeadObjectCommand, UploadPartCommand, DeleteObjectCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
 import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { processAudio} from '../../utils/AudioIntegrity.js';
import { fileURLToPath } from 'url';
import  { validateAudioFormat } from '../../utils/validateAudioFormat.js'
import cleanupTempFiles from '../../utils/cleanTempFiles.js';
import { extractDuration } from '../../utils/songDuration.js'
import stream from "stream";
import path from 'path';
import crypto from "crypto";
import { createHash } from 'crypto';
const { CreatePresignedUrl, CreatePresignedUrlDownload, CreatePresignedUrlDownloadAudio, CreatePresignedUrlDelete } = awsS3Utils;


import Fingerprinting from '../../utils/DuplicateAndCopyrights/fingerPrinting.js'
import isCoverOrRemix from '../../utils/DuplicateAndCopyrights/coverRemix.js'
import {withFilter } from 'graphql-subscriptions';
import { pubsub } from '../../utils/ pubsub.js'

import generateFingerprint from '../../utils/DuplicateAndCopyrights/fingerPrinting.js';
import preProcessAudio from '../../utils/DuplicateAndCopyrights/preProcessAudio.js';
// import FingerprintModule from '../../utils/factory/generateFingerPrint2.js';
import FingerprintGenerator from '../../utils/factory/generateFingerPrint2.js';
import FingerprintMatcher from '../../utils/factory/fingerprintMatcher.js'
import extractFeatures from '../../utils/DuplicateAndCopyrights/detectChroma.js';
import generateHarmonicFingerprint from '../../utils/Covers/Indicators/harmonicFingerprint.js';
import generateStructureHash from '../../utils/Covers/Indicators/similalityHashGenerator.js';
import generateSimilarityFingerprint from '../../utils/Covers/Indicators/similalityFingerprints.js';
import detectKey from '../../utils/Covers/Indicators/keyGenerator.js';
import tempoDetect from '../../utils/Covers/Indicators/tempoDetection.js';
import { title } from 'process';
// import kMeans from 'kmeans-js';

// import SimHash from 'simhash';




const pipe = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3 = new S3Client({
  region: process.env.JWT_REGION_SONGS_TO_STREAM,
  credentials: {
    accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
    secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
  },
});


function analyzeFingerprints(fingerprint) {
  const deltas = fingerprint.map(fp => fp.deltaTime);
  const avgDelta = deltas.reduce((a,b) => a+b, 0) / deltas.length;
  
  console.log(`Fingerprint Analysis:
  - Total: ${fingerprint.length}
  - Avg Δt: ${avgDelta.toFixed(4)}s
  - Time range: ${fingerprint[0]?.time.toFixed(4)}-${fingerprint.at(-1)?.time.toFixed(4)}s
  `);
}

const SONG_UPLOAD_UPDATE = 'SONG_UPLOAD_UPDATE';
dotenv.config();

const resolvers = {
  Upload: GraphQLUpload,
Query: {


  artistProfile: async (parent, args, context) => {
  try {
    // Debugging: Log the entire artistContext to see what it contains
    console.log('context in artist profile:', context);

    // Check if the artist is authenticated
    if (!context.artist) {
      throw new Error("Unauthorized: You must be logged in to view your profile.");
    }

    // Debugging: Log the artist's ID from the context
    console.log('Artist ID from Context:', context.artist._id);

    // Find the artist's profile using the artist's ID from the context
    const artist = await Artist.findById(context.artist._id)
      .populate("songs")
      .populate('followers');

    // Debugging: Check if the artist was found
    if (!artist) {
      console.error('Artist not found in the database.');
      throw new Error("Artist not found.");
    }

    // Return artist's data
    return artist;
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching artist profile:', error);

    // Throw a general error message for the GraphQL response
    throw new Error("Failed to fetch artist profile.");
  }
},

// Query / Song
// --------------

songsOfArtist: async (parent, args, context) => {

    // Check if the artist is logged in by verifying the context
    if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to fetch your songs.');
    }

    // Use the artist's ID from the context
    const artistId = context.artist._id;

    try {
        // Fetch songs associated with the artist's ID and populate the album details
        const songs = await Song.find({ artist: artistId })
        .populate('album')
        .populate('likedByUsers');

        // Return the list of songs with populated album information
        return songs;
    } catch (error) {
        console.error('Error fetching songs:', error);

        // Throw a general error message for the GraphQL response
        throw new Error("Failed to fetch songs.");
    }
},


songById : async (parent, { songId }, context) => {
  // Ensure that the user (artist) is logged in
  if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to fetch your song.');
  }

  const artistId = context.artist._id;

  try {
    // Query the song by both artistId and songId
    const song = await Song.findOne({
      artistId: artistId,
      songId: songId,
    });

    if (!song) {
      throw new Error('Song not found.');
    }

    // Return the song if found
    return song;
  } catch (error) {
    console.error('Error fetching song:', error);
    // Provide a generic error message for the client
    throw new Error('Failed to fetch song.');
  }
},










albumOfArtist: async (parent, args, context) => {
   if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to fetch your songs.');
    }

     // Use the artist's ID from the context
    const artistId = context.artist._id;

     try {
        // Fetch albums associated with the artist's ID and populate the songs details
        const albums = await Album.find({ artist: artistId  })
        .populate('songs')
        

        // Return the list of albums with populated songs information
        return albums.length > 0 ? albums : [];
    } catch (error) {
        console.error('Error fetching albums:', error);

        // Throw a general error message for the GraphQL response
        throw new Error("Failed to fetch albums.");
    }

},


// trendingSongs: async (context) => {
//       const limit = 20;
//       const userId = context.user?._id?.toString();
//      console.log("check if the context conatain user id:", userId)

//       try {
//         const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//           Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist'),
//           Song.aggregate([
//             { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//             { $sort: { likesCount: -1, createdAt: -1 } },
//             { $limit: limit }
//           ]),
//           Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist'),
//           Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist')
//         ]);

//         const likedIds = topLikesAgg.map(s => s._id);
//         const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist');

//         const merged = [];
//         const seen = new Set();
//         const addUnique = (songs) => {
//           for (const s of songs) {
//             const id = s._id.toString();
//             if (!seen.has(id)) {
//               seen.add(id);
//               merged.push(s);
//               if (merged.length === limit) break;
//             }
//           }
//         };

//         addUnique(topPlays);
//         addUnique(topLikes);
//         addUnique(topDownloads);
//         addUnique(latestSongs);

//         return merged.slice(0, limit);
//       } catch (err) {
//         console.error('❌ Trending songs error:', err);
//         return [];
//       }
//     },



trendingSongs: async () => {
  const limit = 20;

  try {
    const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
      Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist').lean(),
      Song.aggregate([
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likedByUsers', []] } }
          }
        },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: limit }
      ]),
      Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist').lean(),
      Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist').lean()
    ]);

    // Re-fetch full data for top liked songs
    const likedIds = topLikesAgg.map(s => s._id);
    const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist').lean();

    const merged = [];
    const seen = new Set();

    const addUnique = (songs) => {
      for (const s of songs) {
        const id = s._id.toString();
        if (!seen.has(id)) {
          seen.add(id);
          merged.push({
            ...s,
            likesCount: s.likedByUsers?.length || 0, // ✅ add computed like count
          });
          if (merged.length === limit) break;
        }
      }
    };

    addUnique(topPlays);
    addUnique(topLikes);
    addUnique(topDownloads);
    addUnique(latestSongs);

    return merged.slice(0, limit);
  } catch (err) {
    console.error('❌ Trending songs error:', err);
    return [];
  }
},



},



  Mutation: {
createArtist: async (parent, { fullName, artistAka, email, password }) => {
  try {
    // Check if the artist already exists
    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      throw new Error("Artist with this email already exists");
    }

    // Create the new artist
    const newArtist = await Artist.create({
      fullName,
      artistAka,
      email,
      password,
      confirmed: false,
       selectedPlan: false,
      role: 'artist'
    });

    // Generate the token for email verification
    const artistToken = signArtistToken(newArtist);

    // Create the verification link
    const verificationLink = `http://localhost:3001/confirmation/${artistToken}`;

    // Send the response to the user immediately
    // The email sending happens asynchronously in the background
    setTimeout(async () => {
      try {
        // Send the verification email asynchronously
        await sendEmail(
          newArtist.email,
          "Verify Your Email",
          `
            <p>Welcome to AfroFeel, ${newArtist.fullName}!</p>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
          `
        );
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Optionally, log the error or handle retries
      }
    }, 0);

    // Explicitly include the 'confirmed' field in the return object
    return {
      artistToken,
      confirmed: newArtist.confirmed, 
      selectedPlan: newArtist.selectedPlan, 
      email: newArtist.email, 
      fullName: newArtist.fullName,
      artistAka: newArtist.artistAka,
      role: 'artist'
    };
    
  } catch (error) {
    console.error("Failed to create artist:", error);
    throw new Error("Failed to create artist");
  }
},


// resend verfication link
// --------------------
resendVerificationEmail: async (parent, { email }) => {
  try {
    // Find the artist by email
    const artist = await Artist.findOne({ email });
    if (!artist) {
      throw new Error("Artist not found");
    }

    // Check if the email is already verified
    if (artist.confirmed) {
      return { success: false, message: "Email is already verified" };
    }

    // Generate a new token using signToken
    const artistToken = signToken(artist);

    // Construct the verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${artistToken}`;

 console.log(process.env.FRONTEND_URL) ;
  console.log(verificationLink) ;

    // Send the verification email
    await sendEmail(artist.email, "Verify Your Email", `
      <p>Hello, ${artist.fullName}!</p>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
    `);

    return { success: true, message: "Verification email resent successfully" };
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    throw new Error("Failed to resend verification email");
  }
},




verifyEmail: async (parent, { token }) => {
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the artist by ID
    const artist = await Artist.findById(decoded._id);
    if (!artist) {
      throw new Error('Artist not found');
    }

    // Check if the artist is already confirmed
    if (artist.confirmed) {
      return { success: false, message: 'Email is already verified' };
    }

    // Update the `confirmed` field to true
    artist.confirmed = true;
    await artist.save();

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Failed to verify email:', error);

    // Handle different errors based on the error type or message
    if (error.name === 'JsonWebTokenError' || error.message === 'invalid token') {
      return { success: false, message: 'Invalid token. Please request a new verification email.' };
    }
    if (error.message === 'jwt expired') {
      return { success: false, message: 'Verification token has expired. Please request a new one.' };
    }

    // Generic error message
    return { success: false, message: 'An error occurred while verifying your email' };
  }
},


// ------------------------------------------------------------------------------

// addProfileImage
// --------------











getPresignedUrl: async (_, { bucket, key, region }) => {
      try {
        // Generate presigned URL using the utility function
        const url = await CreatePresignedUrl({ bucket, key, region });

        // Return the URL and expiration time
        return {
          url,
          expiration: '3600', // Expiration time in seconds
        };
      } catch (error) {
        console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
      }
    },

   getPresignedUrlDownload: async(_, {bucket, key, region}) =>{
    try{
       const urlToDownload = await CreatePresignedUrlDownload({ bucket, key, region });

        // Return the URL and expiration time
        return {
          urlToDownload,
          expiration: '18000', // Expiration time in seconds
        };

    }catch(error){
console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
    }
   },

getPresignedUrlDownloadAudio: async(_, {bucket, key, region}) => {
  try {
    const urlToDownloadAudio = await CreatePresignedUrlDownloadAudio({ bucket, key, region });

    return {
  url: urlToDownloadAudio,
  expiration: '18000',
};

  } catch (error) {
    console.error('Error in resolver:', error);
    throw new Error('Failed to fetch presigned URL');
  }
},




 getPresignedUrlDelete: async(_, {bucket, key, region}) =>{
    try{
       const urlToDelete = await CreatePresignedUrlDelete({ bucket, key, region });

        // Return the URL and expiration time
        return {
          urlToDelete,
          expiration: '3600', // Expiration time in seconds
        };

    }catch(error){
console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
    }
   },


  

 // Artist Login
   artist_login : async (parent, { email, password }) => {
  try {
    // Step 1: Find the artist by email
    const artist = await Artist.findOne({
      email
    });

    // Step 2: If no artist is found, throw an authentication error
    if (!artist) {
      throw new AuthenticationError('Artist not found.');
    }

    // Step 3: Check if the password is correct
    const correctPw = await artist.isCorrectPassword(password);
    if (!correctPw) {
      throw new AuthenticationError('Incorrect password.');
    }

    // Step 4: Generate a JWT token for the artist
    const artistToken = signArtistToken(artist);

    // Step 5: Return the token and artist object
    return { artistToken, artist };
    
  } catch (error) {
    console.error("Login failed:", error);
  }
},





// Select plan
// -----------

selectPlan: async (parent, { artistId, plan }) => {
  try {
    const afroFeelPlans = ['Free Plan', 'Premium Plan', 'Pro Plan'];

    // Validate the plan type
    if (!afroFeelPlans.includes(plan)) {
      throw new Error('Invalid plan type selected.');
    }

    // Update the artist's plan in the database
    const artist = await Artist.findByIdAndUpdate(
      artistId,
      {
        selectedPlan: true,
        plan: plan,
      },
      { new: true }
    );

    if (!artist) {
      throw new Error('Artist not found.');
    }

    return artist;
  } catch (error) {
    console.error('Selecting plan failed:', error);
    throw new GraphQLError('Selecting plan failed.', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
},


updateArtistProfile: async (
  parent,
  { artistId, bio, country, languages, genre, mood, profileImage, coverImage },
  context
) => {
  try {
    // Check if the artist is authenticated through the context
    if (!context.artist) {
      throw new Error('Unauthorized: You must be logged in to update your profile.');
    }

    console.log('Context:', context);
    console.log('Artist ID from Context:', context.artist._id);
    console.log('Update Payload:', { bio, country, languages, genre, mood, profileImage, coverImage });

    // Create an object to hold the fields to update
    const updateFields = {};
    if (bio) updateFields.bio = bio;
    if (country) updateFields.country = country;
    if (languages) updateFields.languages = languages;
    if (genre) updateFields.genre = genre;
    if (mood) updateFields.mood = mood;
    if (profileImage) updateFields.profileImage = profileImage;
    if (coverImage) updateFields.coverImage = coverImage;

    // Update the artist's profile using the provided details
    const newArtist = await Artist.findOneAndUpdate(
      { _id: context.artist._id }, // Find the artist by their unique ID
      updateFields, // Use the dynamically created updateFields object
      { new: true } // Return the updated document
    );

    if (!newArtist) {
      throw new Error('Artist not found or update failed.');
    }

    return newArtist; // Return the updated artist profile
  } catch (error) {
    // Handle any errors that occur during the update
    console.error('Error updating artist profile:', error);
    throw new Error('Failed to update artist profile: ' + error.message);
  }
},

addBio: async (parent, { bio }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { bio },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


addCountry: async (parent, { country }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { country },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


    addLanguages: async (parent, { languages }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { languages },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },

    addGenre: async (parent, { genre }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { genre },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


removeGenre: async (_, { genre }, context) => {
      try {
        const artistId = context.artist._id; // Get the user ID from the context

        // Fetch the artist profile from the database
        const artist = await Artist.findById(artistId);
        if (!artist) {
          throw new Error("Artist not found");
        }

        // Remove the specified genres from the artist's genre list
        artist.genre = artist.genre.filter((g) => !genre.includes(g));

        // Save the updated artist profile
        await artist.save();

        return {
          _id: artist._id,
          genre: artist.genre,
        };
      } catch (error) {
        console.error("Error removing genre:", error);
        throw new Error("Failed to remove genre");
      }
    },



    addMood: async (parent, { mood }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { mood },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },





 addCategory: async (parent, { category }, context) => {
  // Check if the artist is logged in
  if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to update your profile.');
  }

  // Validate category input to ensure it is one of the allowed options
  const validCategories = ['gospel', 'secular', 'mixed'];
  if (!validCategories.includes(category.toLowerCase())) {
    throw new Error('Invalid category. Please choose between "gospel", "secular", or "mixed".');
  }

  // Attempt to update the artist's profile with the chosen category
  try {
    const updatedArtist = await Artist.findOneAndUpdate(
      { _id: context.artist._id },
      { category },
      { new: true }  // Ensures the returned object is the updated one
    );

    // If no artist is found or update fails
    if (!updatedArtist) {
      throw new Error('Artist not found or update failed.');
    }

    // Return the updated artist
    return updatedArtist;
  } catch (error) {
    // If there's an error with the database operation
    throw new Error('Something went wrong while updating the category: ' + error.message);
  }
},



addProfileImage: async (parent , {profileImage}, context) =>{
  try{
if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to update your profile.');
  }

 


const updatedArtist = await Artist.findOneAndUpdate(
  {_id: context.artist._id},
  { profileImage},
  { new: true } 
  );

    // If no artist is found or update fails
    if (!updatedArtist) {
      throw new Error('Artist not found or update failed.');
    }

    // Return the updated artist
    return updatedArtist;

  }catch(error)
  {
    throw new Error('Something went wrong while updating the profile image: ' + error.message);

  }
},

// CREATE SONG
// -------------



updateSong: async (parent, { 
  songId, 
  title, 
  featuringArtist, 
  album, 
  trackNumber, 
  genre, 
  mood,
  subMoods,
  producer, 
  composer, 
  label, 
  releaseDate, 
  lyrics, 
  artwork
},  context) => {
  try {
    if (!context.artist) {
      throw new Error("Unauthorized: You must be logged in to update a song.");
    }
    const updatedSong = await Song.findByIdAndUpdate(songId, {
      title,
      featuringArtist,
      album, 
      trackNumber,
      genre,
      mood,
  subMoods,
      producer,
      composer,
      label,
  
      releaseDate,
      lyrics,
      artwork
    }, { new: true });
console.log("✅ Updated song document:", updatedSong);
    return updatedSong;

  } catch (error) {
    console.error("Error updating song:", error);
    throw new Error("Failed to update song.");
  }
},


songUpload: async (parent, { file, tempo, beats, timeSignature }, context) => {
  // Initialize with proper directory setup
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const uploadsDir = path.join(__dirname, "uploads");
  
  console.log('🚀 Starting songUpload resolver');
  console.time('⏱️ Total upload time');
  
  if (!context.artist) {
    throw new Error("Unauthorized: You must be logged in to create a song.");
  }

  const loggedInArtistId = context.artist._id;
  let tempFilePath, processedFilePath;
  let songData;

  // Enhanced cleanup function
  const cleanupFiles = async () => {
    console.log('🧹 Starting cleanup procedure');
    
    const cleanupTasks = [];
    if (tempFilePath) {
      cleanupTasks.push(
        fs.promises.unlink(tempFilePath)
          .then(() => console.log(`✅ Deleted temp file: ${tempFilePath}`))
          .catch(err => console.error(`❌ Error deleting temp file: ${err.message}`))
      );
    }
    if (processedFilePath) {
      cleanupTasks.push(
        fs.promises.unlink(processedFilePath)
          .then(() => console.log(`✅ Deleted processed file: ${processedFilePath}`))
          .catch(err => console.error(`❌ Error deleting processed file: ${err.message}`))
      );
    }
    
    await Promise.all(cleanupTasks);
  };

  const updateProgress = async (step, status, message, percent, isComplete = false) => {
    await pubsub.publish('SONG_UPLOAD_UPDATE', {
      songUploadProgress: {
        artistId: loggedInArtistId,
        step,
        status,
        message,
        percent,
        isComplete
      }
    });
    console.log(`📢 Progress: ${step} (${percent}%) - ${status}`);
  };

  

  try {
    // ===== INITIALIZATION =====
    await updateProgress('INITIATED', 'IN_PROGRESS', 'Starting upload process...', 5);

    // ===== FILE UPLOAD HANDLING =====
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const { createReadStream, filename } = await file;
    if (!createReadStream || !filename) {
      throw new Error("Invalid file input.");
    }

    const sanitizedFilename = filename.replace(/[^\w.-]/g, '_');
    tempFilePath = path.join(uploadsDir, `${Date.now()}_${sanitizedFilename}`);

    // Save uploaded file
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempFilePath);
      const readStream = createReadStream();
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      readStream.pipe(writeStream);
    });

    // Verify file
    const stats = fs.statSync(tempFilePath);
    if (stats.size === 0) throw new Error("Uploaded file is empty");

    // ===== DUPLICATE CHECK =====
    await updateProgress('CHECKING_DUPLICATES', 'IN_PROGRESS', 'Checking for duplicate songs...', 25);

    const fingerprint = await FingerprintGenerator(fs.createReadStream(tempFilePath));
    const matchingResults = await FingerprintMatcher.findMatches(fingerprint, loggedInArtistId, { minMatches: 5 });

    if (matchingResults.finalDecision) {
      const { status } = matchingResults.finalDecision;
      const publishStatus = status === 'artist_duplicate' ? 'DUPLICATE' : 
                          status === 'copyright_issue' ? 'COPYRIGHT_ISSUE' : 
                          status.toUpperCase();

      await updateProgress('CHECKING_DUPLICATES', publishStatus, matchingResults.finalDecision.message, 30);
      await updateProgress('COMPLETED', publishStatus, matchingResults.finalDecision.message, 100, true);
      
      await cleanupFiles();
      return {
        status: publishStatus,
        ...matchingResults.finalDecision,
        _id: "BLOCKED",
        title: matchingResults.finalDecision.title || 'Untitled',
      };
    }

    // ===== AUDIO PROCESSING =====
    await updateProgress('PROCESSING', 'IN_PROGRESS', 'Analyzing audio features...', 40);

    const [resultFromTempoDetect, duration, features] = await Promise.all([
      tempoDetect(tempFilePath),
      extractDuration(tempFilePath),
      extractFeatures(tempFilePath)
    ]);

    // Process chroma features with proper normalization
    const allChroma = features.map(feature => {
      if (!feature.chroma) return Array(12).fill(0);
      const chroma = feature.chroma.map(Number);
      const norm = Math.sqrt(chroma.reduce((sum, x) => sum + x * x, 0));
      return norm > 0 ? chroma.map(x => x / norm) : chroma;
    });

    // Process MFCC features with proper normalization
    const allMfcc = features.map(feature => {
      if (!feature.mfcc) return Array(13).fill(0);
      const mfcc = feature.mfcc.map(Number);
      const norm = Math.sqrt(mfcc.reduce((sum, x) => sum + x * x, 0));
      return norm > 0 ? mfcc.map(x => x / norm) : mfcc;
    });

    // Generate structure hash
    const hash = generateStructureHash({ allMfcc, allChroma, tempo, beats });
    
    // Detect musical key
    const { key, mode } = await detectKey(allChroma);
    
    // Generate harmonic fingerprint
    const harmonicFingerprint = await generateHarmonicFingerprint(allChroma, beats);
    const normalizedHarmonic = harmonicFingerprint.map(v => v / Math.max(...harmonicFingerprint));

    // Get chroma peaks (top 2 peaks per frame)
    const chromaPeaks = allChroma.map(chroma => {
      return chroma
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 2)
        .map(entry => entry.idx);
    });

    // ===== FILE PROCESSING =====
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Preparing final files...', 70);

    processedFilePath = path.join(uploadsDir, `${fingerprint[0].hash}_${path.basename(filename)}`);
    await processAudio(tempFilePath, processedFilePath);

    // ===== S3 UPLOAD =====
    const fileKey = `for-streaming/${fingerprint[0].hash}_${path.basename(filename)}`;
    const originalSongKey = `original_songs/${fingerprint[0].hash}_${path.basename(filename)}`;

    await Promise.all([
      s3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME_STREAMING,
        Key: fileKey,
        Body: fs.createReadStream(processedFilePath),
        ContentType: "audio/mpeg"
      })),
      s3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME_ORIGINAL_SONGS,
        Key: originalSongKey,
        Body: fs.createReadStream(tempFilePath),
        ContentType: "audio/mpeg"
      }))
    ]);

    // ===== DATABASE RECORDS =====
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Creating database record...', 90);

const album = await Album.findOne({ artist: loggedInArtistId });
    songData = await Song.create({
      title: path.basename(filename, path.extname(filename)),
      album: album,
      artist: loggedInArtistId,
      audioFileUrl: `https://${process.env.BUCKET_NAME_ORIGINAL_SONGS}.s3.amazonaws.com/${originalSongKey}`,
      streamAudioFileUrl: `https://${process.env.BUCKET_NAME_STREAMING}.s3.amazonaws.com/${fileKey}`,
      timeSignature,
      key,
      mode,
      duration,
      tempo: resultFromTempoDetect,
      beats,
      releaseDate: Date.now()
    });

    await Fingerprint.create({
      song: songData._id,
      audioHash: fingerprint,
      structureHash: hash,
      chromaPeaks,
      harmonicFingerprint: normalizedHarmonic,
      beats
    });

    // Final steps with proper sequencing
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Finalizing upload...', 95);
    await new Promise(resolve => setTimeout(resolve, 200)); // Ensure progress update is processed
    await cleanupFiles();
    await updateProgress('COMPLETED', 'SUCCESS', 'Upload completed successfully!', 100, true);

    console.timeEnd('⏱️ Total upload time');
    return {
      status: 'SUCCESS',
      _id: songData._id,
      title: songData.title
    };

  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    // Cleanup in case of error
    try {
      if (songData?._id) await Song.deleteOne({ _id: songData._id });
      await cleanupFiles();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    await updateProgress('FAILED', 'FAILED', error.message, 100, true);
    
    return {
      status: 'FAILED',
      _id: songData?._id || `FAILED-${Date.now()}`,
      title: songData?.title || 'Untitled',
      message: error.message
    };
  }
},



// ====================
addLyrics:  async (parent, {songId, lyrics}, context) => {

try{

   if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }
 const updatedSong = await Song.findByIdAndUpdate(songId, {
      lyrics,
      
    }, { new: true });

    return updatedSong;

}catch(error){
console.error("Error updating song:", error);
    throw new Error("Failed to add lyrics.");
}

},

addArtwork:  async (parent, {songId, artwork}, context) => {

try{

   if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }
 const updatedSong = await Song.findByIdAndUpdate(songId, {
      artwork,
    }, { new: true });

    return updatedSong;

}catch(error){
console.error("Error updating song:", error);
    throw new Error("Failed to add artwork.");
}

},



toggleVisibility: async (_, { songId, visibility }, context) => {
  try {
    // 1. Ensure the artist is authenticated
    if (!context.artist) {
      throw new Error("Unauthorized: You are not logged in.");
    }

    // 2. Validate visibility value
    if (!["public", "private"].includes(visibility)) {
      throw new Error("Invalid visibility value. Must be 'public' or 'private'.");
    }

    // 3. Update the song visibility
    const updatedSong = await Song.findOneAndUpdate(
      { _id: songId, artist: context.artist._id }, // Optional: ensure artist owns the song
      { visibility },
      { new: true }
    );

    // 4. Check if song was found and updated
    if (!updatedSong) {
      throw new Error("Song not found or you are not authorized to update it.");
    }

    return updatedSong;

  } catch (error) {
    console.error("Failed to toggle the visibility:", error);
    throw new Error("Failed to toggle the visibility.");
  }
},


deleteSong: async (parent, { songId }, context) => {
  if (!context.artist) {
    throw new Error("Unauthorized");
  }

  const deleted = await Song.findByIdAndDelete(songId);
  if (!deleted) {
    throw new Error("Song not found");
  }

  return deleted;
},




// ========================




createAlbum: async (parent, { title }, context) => {
  try {
    if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }

    const artistId = context.artist._id;

    // Check if the artist already has an album
    const existingAlbum = await Album.findOne({ artist: artistId });

    if (!existingAlbum) {
      // Create default album if none exist
      const defaultAlbum = await Album.create({
        title: "Unknown",
        artist: artistId, 
      });

      return defaultAlbum;
    }

    return existingAlbum; 
  } catch (error) {
    console.error("Failed to create a default album:", error);
    throw new Error("Failed to create an album.");
  }
},


createCustomAlbum: async (parent, { title, releaseDate, albumCoverImage }, context) => {
  try {
    // Ensure the artist is authenticated
    if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }

    const artistId = context.artist._id;

    // Validate title
    if (!title) {
      throw new Error("Album title is required.");
    }

    // Check if the album with the same title already exists for the artist
    const existingAlbum = await Album.findOne({ title, artist: artistId });
    if (existingAlbum) {
      throw new Error("An album with this title already exists.");
    }

    // Create new album
    const customAlbum = await Album.create({
      title,
      artist: artistId,
      releaseDate: releaseDate || new Date().toISOString(), // Set current date if no release date is provided
      albumCoverImage: albumCoverImage || "", // Handle default if no cover image is provided
      createdAt: new Date().toISOString(), // Automatically set created date
    });

    // Return the created album
    return customAlbum;

  } catch (error) {
    console.error("Failed to create a custom album:", error);
    throw new Error(error.message || "Failed to create custom album.");
  }
},


 

updateAlbum: async (parent, { albumId, songId, albumCoverImage }, context) => {
  try {
    if (!context.artist) {
      throw new Error("Unauthorized: You are not logged in.");
    }

    const artistId = context.artist._id;

    // Prepare update object dynamically
    let updateFields = {};
    if (songId) updateFields.$addToSet = { songs: songId }; 
    if (albumCoverImage) updateFields.albumCoverImage = albumCoverImage; 

    // Ensure there is something to update
    if (Object.keys(updateFields).length === 0) {
      throw new Error("No update fields provided.");
    }

    // Find and update the album
    const updatedAlbum = await Album.findOneAndUpdate(
      { _id: albumId, artist: artistId }, 
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedAlbum) {
      throw new Error("Album not found or unauthorized.");
    }

    return updatedAlbum;
  } catch (error) {
    console.error("Failed to update album:", error);
    throw new Error("Update failed.");
  }
},


  // ----------------------------------------------------------------------

    // Update user (username or password)
    updateUser: async (parent, { userId, username, password }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId }, // Find user by ID
          { ...(username && { username }), ...(password && { password }) }, // Update only the fields provided
          { new: true } // Return the updated user
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        return updatedUser;
      } catch (error) {
        console.error("Failed to update username or password:", error);
        throw new Error("Failed to update user.");
      }
    },

    // Delete user
    deleteUser: async (parent, { userId }) => {
      try {
        const deletedUser = await User.findOneAndDelete({ _id: userId });
        if (!deletedUser) {
          throw new Error("User not found");
        }
        return "User deleted successfully";
      } catch (error) {
        console.error("Failed to delete user:", error);
        throw new Error("Failed to delete user.");
      }
    },





  },



 Subscription: {
    songUploadProgress: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator([SONG_UPLOAD_UPDATE]),
        (payload, variables, context) => {
          // The magic happens here - we're using the artist from the WS context
          if (!context.artist) {
            console.error('No artist in context');
            return false;
          }
          return true; // All authenticated artists get their own updates
        }
      )
    }
  },


  Song: {
    likesCount: (parent) => {
      return parent.likedByUsers?.length || 0;
    },
  },





  };


export default resolvers;
