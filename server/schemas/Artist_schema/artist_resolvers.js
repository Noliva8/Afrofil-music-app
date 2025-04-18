
import fs from 'fs'
import { pipeline } from 'stream';
import util from 'util';
import  { Artist, Album, Song, User } from '../../models/Artist/index_artist.js';
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
const { CreatePresignedUrl, CreatePresignedUrlDownload, CreatePresignedUrlDelete } = awsS3Utils;

import Fingerprinting from '../../utils/DuplicateAndCopyrights/fingerPrinting.js'

import findPotentialCovers from '../../utils/DuplicateAndCopyrights/coverRemix.js'

import generateFingerprint from '../../utils/DuplicateAndCopyrights/fingerPrinting.js';
import preProcessAudio from '../../utils/DuplicateAndCopyrights/preProcessAudio.js';
// import FingerprintModule from '../../utils/factory/generateFingerPrint2.js';

import FingerprintGenerator from '../../utils/factory/generateFingerPrint2.js';
import postProcessFingerprints from '../../utils/factory/postProcessing.js';
import FingerprintMatcher from '../../utils/factory/fingerprintMatcher.js'



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
        const songs = await Song.find({ artistId })
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



songHash: async (parent, { audioHash }) => {
  try {
    // Query the Song model to find a song by the provided audio hash
    const song = await Song.findOne({ audioHash });

    // If the song is found, return it; otherwise, return null
    if (song) {
      return song;
    } else {
      return null;  // No song found with the given audio hash
    }
  } catch (error) {
    console.error('Error checking audio hash:', error);
    throw new Error('Failed to check audio hash');
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


createSong: async (
  parent,
  {
    title,
    featuringArtist,
    albumId,
    trackNumber,
    genre,
    producer,
    composer,
    label,
    duration,
    releaseDate,
    lyrics,
    artwork, 
    audioFileUrl, 
    audioHash 
  },
  context
) => {
  try {
    // Ensure the user is logged in
    if (!context.artist) {
      throw new Error("Unauthorized: You must be logged in to create a song.");
    }

    const loggedInArtistId = context.artist._id;

    // Validate required fields
    if (!title || !audioFileUrl || !audioHash) {
      throw new Error("Title and audio file URL are required.");
    }

    // Prevent duplicate uploads
    const existingSong = await Song.findOne({ audioHash });
    if (existingSong) {
      throw new Error("Duplicate upload detected. This song already exists.");
    }

    // Verify album exists (if provided)
    if (albumId) {
      const albumExists = await Album.findById(albumId);
      if (!albumExists) {
        throw new Error("Invalid album ID: The specified album does not exist.");
      }
    }

    // Save song metadata in the database
    const song = await Song.create({
      title,
      artist: loggedInArtistId,
      featuringArtist,
      album: albumId,
      genre,
      duration,
      trackNumber,
      producer,
      composer,
      label,
      releaseDate,
      lyrics,
      artwork, 
      audioFileUrl, 
      audioHash, 
    });

    return song;
  } catch (error) {
    console.error("Failed to create song:", error);
    throw new Error(`Failed to create song: ${error.message}`);
  }
},


updateSong: async (parent, { 
  songId, 
  title, 
  featuringArtist, 
  album, 
  trackNumber, 
  genre, 
  producer, 
  composer, 
  label, 
 
  releaseDate, 
  lyrics, 
  artwork, 
  audioFileUrl, 
  streamAudioFileUrl 
}) => {
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
      producer,
      composer,
      label,
  
      releaseDate,
      lyrics,
      artwork,
      audioFileUrl,
      streamAudioFileUrl
    }, { new: true });

    return updatedSong;
  } catch (error) {
    console.error("Error updating song:", error);
    throw new Error("Failed to update song.");
  }
},


songUpload : async (parent, { file }, context) => {
  if (!context.artist) {
    throw new Error("Unauthorized: You must be logged in to create a song.");
  }

  const loggedInArtistId = context.artist._id;
  let tempFilePath, processedFilePath;

  try {
    // 1. File upload handling
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const { createReadStream, filename } = await file;
    if (!createReadStream || !filename) {
      throw new Error("Invalid file input.");
    }

    // Sanitize filename and create temp path
    const sanitizedFilename = filename.replace(/[^\w.-]/g, '_');
    tempFilePath = path.join(uploadsDir, `${Date.now()}_${sanitizedFilename}`);
    
    // Save the uploaded file
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempFilePath);
      const readStream = createReadStream();
      
      readStream.on('error', error => {
        writeStream.destroy();
        reject(new Error(`File upload failed: ${error.message}`));
      });
      
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      
      readStream.pipe(writeStream);
    });

    // Verify file
    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Failed to save uploaded file");
    }

    // 2. Generate fingerprints
    const inputStream = fs.createReadStream(tempFilePath);
    const fingerprint = await FingerprintGenerator(inputStream);
    // console.log('Generated Fingerprints:', fingerprint);

    // 3. Compare the fingerprints against the database
    const matchingResults = await FingerprintMatcher.findMatches(fingerprint, loggedInArtistId, { minMatches: 5 });

    console.log('Matching results:', matchingResults);

    // 4. Check the result from the matcher
    if (matchingResults.finalDecision && matchingResults.finalDecision.status === 'artist_duplicate') {
      return {
        status: 'DUPLICATE',
        message: matchingResults.finalDecision.message,
        action: matchingResults.finalDecision.action,
        duplicateSongId: matchingResults.finalDecision.duplicateSongId
      };
    }


if (
  matchingResults.finalDecision &&
  matchingResults.finalDecision.status === 'copyright_issue'
) {


  const matchingSong = matchingResults.finalDecision.matchingSongs?.[0];

  if (!matchingSong) {
    throw new Error("Matching song not found during copyright check.");
  }

// console.log('Matching songs:', matchingResults.finalDecision.matchingSongs);

  // Fetch original artist's info
  const matchingSongId = matchingResults.finalDecision.matchingSongs?.[0]?.songId;
if (!matchingSongId) throw new Error("Matching song ID not found");

const originalSong = await Song.findById(matchingSongId).populate('artist', 'name email');
console.log("Fetched originalSong with artist:", originalSong);

if (!originalSong?.artist?.email) {
  throw new Error("Original artist info is missing or incomplete");
}

const originalArtistId =  originalSong?.artist?._id;

const originalArtistData = await Artist.findById(originalArtistId);

const originalArtistAka = originalArtistData.artistAka;
console.log(originalArtistAka)

console.log(`verify this: ${originalSong}`)

// Notify the original artist (in background)
const notifyOriginalArtist = sendEmail(
  originalSong.artist.email,
  "Copyright Alert: Someone Tried Uploading Your Song",
  `
    Hello ${originalArtistAka || 'artist'},

    Heads up! Someone just attempted to upload a song that closely matches the one you previously uploaded: "${originalSong.title}".

    This upload was blocked by our system to protect your rights.

    If you want to take further action or review the event, please log in to your dashboard.

    Thanks for using our platform to protect your work.
  `
);

const currentArtistEmail = context.artist.email;

// Notify the current artist (in background)
const notifyCurrentArtist = currentArtistEmail && sendEmail(
  currentArtistEmail,
  "Upload Blocked: Copyright Issue Detected",
  `
    Hello,

    Unfortunately, your recent attempt to upload a song titled "${originalSong.title}" has been blocked because it closely matches an existing song on the platform.

    This upload has been flagged as a copyright issue, and the original artist has been notified.

    If you believe this is a mistake or would like to resolve the issue, please contact support or review your submission in your dashboard.

    Thanks for using our platform!
  `
);

// Run the email notifications in parallel
await Promise.all([notifyOriginalArtist, notifyCurrentArtist]);


// Notify both parties with the result
return {
  status: 'COPYRIGHT_ISSUE',
  message: matchingResults.finalDecision.message,
  action: matchingResults.finalDecision.action,
  options: matchingResults.finalDecision.options,
  matchingSongs: matchingResults.finalDecision.matchingSongs
};

}


    // 5. Extract audio duration
    const duration = await extractDuration(tempFilePath);

    // 6. Process and upload to S3
    processedFilePath = path.join(uploadsDir, `${fingerprint[0]?.hash}_${path.basename(filename)}`);

    await processAudio(tempFilePath, processedFilePath);

    const fileKey = `uploads/${fingerprint[0]?.hash}/${path.basename(processedFilePath)}`;
    
    const uploadResult = await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME_STREAMING,
      Key: fileKey,
      Body: fs.createReadStream(processedFilePath),
      ContentType: "audio/mpeg",
      Metadata: {
        'fingerprint-count': String(fingerprint.length),
        'duration': String(duration)
      }
    }));


// upload original song for back up
// ------------------------------

// 7. Upload the original song for backup
const originalSongKey = `original_songs/${fingerprint[0]?.hash}_${path.basename(filename)}`;

const originalSongUploadResult = await s3.send(new PutObjectCommand({
  Bucket: process.env.BUCKET_NAME_ORIGINAL_SONGS,
  Key: originalSongKey,
  Body: fs.createReadStream(tempFilePath),
  ContentType: "audio/mpeg"
}));


// Get the URL of the original song uploaded to the backup bucket
const originalSongUrl = `https://${process.env.BUCKET_NAME_ORIGINAL_SONGS}.s3.amazonaws.com/${originalSongKey}`;




    // console.log(`File uploaded to S3 with ETag: ${uploadResult.ETag}`);

    // 7. Create database record
    const album = await Album.findOne({ artist: loggedInArtistId });

    const newSong = await Song.create({
      title: path.basename(filename, path.extname(filename)),
      artist: loggedInArtistId,
      album: album?._id,
      audioFileUrl: originalSongUrl,
      streamAudioFileUrl: `https://${process.env.BUCKET_NAME_STREAMING}.s3.amazonaws.com/${fileKey}`,
      audioHash: fingerprint,
      duration,
      releaseDate: new Date()
    });

    return {
      status: 'SUCCESS',
      song: await Song.findById(newSong._id)
        .populate('artist', 'name')
        .populate('album', 'title'),
      fingerprints: {
        count: fingerprint.length,
        firstSample: fingerprint[0],
        lastSample: fingerprint[fingerprint.length - 1]
      }
    };

  } catch (error) {
    console.error("Upload process failed:", error);
    throw new Error(`Song upload failed: ${error.message}`);
  } finally {
    // Cleanup temporary files
    const cleanup = async (filePath) => {
      try {
        if (filePath && fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log(`Cleaned up temporary file: ${filePath}`);
        }
      } catch (cleanupError) {
        console.error(`Error cleaning up ${filePath}:`, cleanupError);
      }
    };

    await cleanup(tempFilePath);
    await cleanup(processedFilePath);
  }
},








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





  }













  };


export default resolvers;
