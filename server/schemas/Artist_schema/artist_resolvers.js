
import  { Artist, Album, Song, Genre, User } from '../../models/Artist/index_artist.js';
import { Upload } from "@aws-sdk/lib-storage";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import mime from "mime";
import dotenv from 'dotenv';
import { AuthenticationError, signToken } from '../../utils/artist_auth.js';


dotenv.config()

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

// Creating Artist
// ----------------

createArtist: async (parent, { firstname, lastname, artistAka, email, password, role }) => {
  try{

    const newArtist = await Artist.create({ firstname, lastname, artistAka, email, password, role });

    const token = signToken( newArtist );

    return { token, newArtist }

  } catch(error){
 console.error("Failed to create artist:", error);
        throw new Error("Failed to create artist");
  }
},
// ------------------------------------------------------------------------------

 // Artist Login
   artist_login : async (parent, { firstname, lastname, email, password }) => {
  try {
    // Step 1: Find the artist by email, firstname, and lastname
    const artist = await Artist.findOne({
      email,
      firstname,
      lastname,
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
