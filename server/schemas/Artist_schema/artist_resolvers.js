
import  { Artist, Album, Song, User } from '../../models/Artist/index_artist.js';
import { Upload } from "@aws-sdk/lib-storage";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import mime from "mime";
import dotenv from 'dotenv';
import { AuthenticationError, signArtistToken } from '../../utils/artist_auth.js';
import sendEmail from '../../utils/emailTransportation.js';

dotenv.config();

import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

 const s3Client = new S3Client({
  region: process.env.REGION,
 });

// Check if the uploaded image is a valid format using FFmpeg
function checkImageFormat(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on('end', () => resolve(true))  // Resolve if the image is valid
      .on('error', (err) => reject(`Error processing image: ${err.message}`)) 
      .output('-'); 
  });
}


const resolvers = {
 Upload: GraphQLUpload,
  Query: {



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


addProfileImage: async (parent, { artistId, profileImage }) => {
  try{

    const artist = await Artist.findById(artistId);
console.log(artist);

    if (!artist) {
       throw new AuthenticationError('You must create the artist first!');

    };
   
    
const name = artist.artistAka;
    
 const MAX_FILE_SIZE = 5 * 1024 * 1024; 

 const getFileSize = async (createReadStream) => {
  return new Promise((resolve, reject) => {
    let size = 0;

    const stream = createReadStream();
    stream.on('data', (chunk) => {
      size += chunk.length;
    });

    stream.on('end', () => {
      resolve(size);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
};

const { createReadStream, filename } = await profileImage;
 if (!filename) {
      throw new Error("No file uploaded.");
    }

// Extract the MIME type based on the file extension using the mime package
    const fileExtension = filename.split('.').pop().toLowerCase();
    const mimeType = mime.getType(fileExtension);

    // Validate the file type using the MIME type
    if (!mimeType || !['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
      throw new Error("Invalid file type. Only JPEG, PNG, or GIF images are allowed.");
    }

    // Check the file size
    const fileSize = await getFileSize(createReadStream);
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
    }


      // Prepare the S3 upload parameters
    const params = {
      Bucket: process.env.BUCKET_NAME, 
      Key: `plofile-image/${name}/${filename}`,
      Body: createReadStream(),
      ContentType: mimeType,
    };


    const upload = new Upload({
      client: s3Client,
      params: params,
      partSize: 5 * 1024 * 1024, 
      leavePartsOnError: false,
    });

    // Perform the upload
    const uploadResult = await upload.done();

    // Check if upload was successful
    if (!uploadResult || !uploadResult.$metadata || uploadResult.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to upload profile picture");
    }

    // Generate the file's URL
    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${name}/${filename}`;


     // Create the artist in your database (assuming Sequelize or another ORM)
    const updatedArtist = await Artist.findByIdAndUpdate(
      artistId,
      { profileImage: fileUrl },
      { new: true }
    );
    // Return the created artist object
    return updatedArtist;

  }catch(error){
 console.error("Failed to add profile image:", error);
        throw new Error("Failed to add profile image");
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
    const token = signToken(artist);

    // Step 5: Return the token and artist object
    return { token, artist };
    
  } catch (error) {
    console.error("Login failed:", error);
    throw new AuthenticationError('Login failed.');
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
