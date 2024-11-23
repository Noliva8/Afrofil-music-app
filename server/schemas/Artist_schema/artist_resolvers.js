
import  { Artist, Album, Song, Genre } from '../../models/Artist/index_artist.js';

import fs from 'fs';

import { Upload } from "@aws-sdk/lib-storage";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import mime from "mime";
import dotenv from 'dotenv';
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
      .on('error', (err) => reject(`Error processing image: ${err.message}`))  // Reject if there's an error
      .output('-'); // Do not output to a file, just validate
  });
}


const resolvers = {
 Upload: GraphQLUpload,
  Query: {

   users: async () => {
  try {
    const userData = await User.find()
      .populate('likedSongs') 
      .populate('playlists') 
      .populate('searchHistory') 
      .populate({
        path: 'playCounts',
        populate: {
          path: 'song' 
        }
      })
      .populate('downloads') 
      .populate({
        path: 'recommendedSongs', 
        populate: {
          path: 'song' 
        }
      });

    return userData;
  } catch (error) {
    console.error("Error occurred during user data fetching:", error);
    throw new Error("Could not fetch user data");
  }
},


songs: async () => {
  try {
    const songData = await Song.find()
      .populate('artist') 
      .populate('album')  
      .populate('likedByUsers')
      .populate({
        path: 'recommendedFor',
        populate: {
          path: 'user', 
          select: 'username' 
        }
      }).sort({ createdAt: -1 });
       
     return songData;
  } catch (error) {
    console.error("Error occurred during songs data fetching:", error);
    throw new Error("Could not fetch songs data");
  }
},


albums: async () => {
  try{
    const albumData = await Album.find({})
    .populate('artists')
    .populate('songs')
    .sort({ createdAt: -1 });
   
     return albumData;
  }catch(error){
    console.error("Error occurred during albums data fetching:", error);
    throw new Error("Could not fetch albums data");

  }
},


artists:  async () => {
  try{
   const artistData = await Artist.find({})
   .populate('songs')
   .populate('albums')
   .sort({ createdAt: -1 });
   return artistData;
  }catch(error){
console.error("Error occurred during artist data fetching:", error);
    throw new Error("Could not fetch artist data");
  }
},

genres: async () => {
  try {
    const genreData = await Genre.find({}).populate({
      path: 'songs',
      populate: 'album' 
    });

    return genreData;

  } catch (error) {
    console.error("Error occurred during genre data fetching:", error);
    throw new Error("Could not fetch genre data");
  }
},

playlists: async () => {
  try {
    const playlistData = await Playlist.find({})
      .populate('songs') 
      .populate('createdBy'); 

    return playlistData;

  } catch (error) {
    console.error("Error occurred during playlist data fetching:", error);
    throw new Error("Could not fetch playlist data");
  }
},

comments: async () => {
  try{
    const commentData = await Comment.find({})
    .populate('user')
    .populate('song')
    .sort({ createdAt: -1 })
    return commentData;
  }catch(error){
 console.error("Error occurred during comments data fetching:", error);
    throw new Error("Could not fetch comments data");
  }
},


// PART 2: SINGLE QUERY

// QUERY USER BY ID & BY USERNAME

searchUser: async (parent, { username }) => {
  try{
     const user = await User.findOne({ username })
  .select('likedSongs playCounts recommendedSongs') 
  .populate('likedSongs') 
  .populate({
    path: 'recommendedSongs.song', 
    model: 'Song'
  });

    if (!user) {
      throw new Error(`User with username ${username} not found`);
    }
   return user

  }catch(error){
 console.error("Error occurred during user by username data fetching:", error);
    throw new Error("unable to fetch user by his username");
  }
    }, 

userById: async (parent, { userId }) => {
  try {
    const user = await User.findById({_id: userId})
      .populate('likedSongs') 
      .populate('playCounts.song') 
      .populate('downloads.song') 
      .populate('playlists'); 
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
},


song: async (parent, { songId }) => {
  try{

const song = await Song.findById({_id: songId})
.populate('genre')
.populate('album')
.populate('artist')
 if (!song) {
      throw new Error(`song with ID ${songId} not found`);
    }
return song;
  }catch(error){
throw new Error(error.message);
  }
},


searchSong: async (parent, { title, artist }) => {
  try {
    const song = await Song.find({ title, artist })
      .populate('genre')
      .populate('album');

   if (song.length === 0) {
  throw new Error(`Song with title "${title}" by artist "${artist}" not found`);
}
return song;
  } catch (error) {
    throw new Error(error.message);
  }
},


album: async (parent, { albumId }) => {
  try {
    const album = await Album.findById({_id: albumId})
      .populate('songs') 
      .populate('artist') 
      .populate('genre');

    if (!album) {
      throw new Error(`Album with ID ${albumId} not found`);
    }
    return album;
  } catch (error) {
    throw new Error(error.message);
  }
},


searchAlbum: async (parent, { title, artist }) => {
  try {
    const albums = await Album.find({ title, artist })
      .populate('songs') 
      .populate('artist'); 

    if (albums.length === 0) {
      throw new Error(`No albums found with title "${title}" by artist "${artist}"`);
    }
    return albums; // Return an array of albums
  } catch (error) {
    throw new Error(error.message);
  }
},


artist: async (parent, { artistId }) => {
  try {
    const artist = await Artist.findById({_id:artistId})
      .populate('songs'); 

    if (!artist) {
      throw new Error(`Artist with ID ${artistId} not found`);
    }
    return artist;
  } catch (error) {
    throw new Error(error.message);
  }
},

songsByArtist: async (parent, { name }) => {
  try {
    // Fetch songs where the artist's name matches the provided name
    const songs = await Song.find({ artist: name })
      .populate('album')
      .populate('genre');

    if (songs.length === 0) {
      throw new Error(`No songs found for artist "${name}"`);
    }
    return songs; // Return the array of songs
  } catch (error) {
    throw new Error(error.message);
  }
},

genre: async (parent, { genreId }) => {
  try {
    const genre = await Genre.findById({_id:genreId})
      .populate('songs'); 

    if (!genre) {
      throw new Error(`Genre with ID ${genreId} not found`);
    }
    return genre;
  } catch (error) {
    throw new Error(error.message);
  }
},

songsByGenre: async (parent, { name }) => {
  try {
    // Find the genre by name
    const genre = await Genre.findOne({ genre: name }).populate({
      path: 'songs',
      populate: 'artist',
    });

    // Check if the genre was found
    if (!genre) {
      throw new Error(`Genre "${name}" not found`);
    }

    // Return the songs associated with the found genre
    if (genre.songs.length === 0) {
      throw new Error(`No songs found for genre "${name}"`);
    }
    
    return genre.songs; // Return the array of songs
  } catch (error) {
    throw new Error(error.message);
  }
},



playlist: async (parent, { playlistId }) => {
  try {
    const playlist = await Playlist.findById({_id:playlistId})
      .populate('songs')
      .populate('user'); 

    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    return playlist;
  } catch (error) {
    throw new Error(error.message);
  }
},

commentsForSong: async (parent, { songId }) => {
  try {
    const comments = await Comment.find({ song: songId })
      .populate('user'); 

    if (comments.length === 0) {
      throw new Error(`No comments found for song with ID ${songId}`);
    }
    return comments;
  } catch (error) {
    throw new Error(error.message);
  }
},


  },


  Mutation: {
// Create a new user
    createUser: async (parent, { username, email, password }) => {
      try {
        const newUser = await User.create({ username, email, password });
        const token = signToken(newUser);
        return { token, newUser }; // Return both token and newUser
      } catch (error) {
        console.error("Error while trying to create the user:", error);
        throw new Error("Failed to create the user.");
      }
    },

    // Login user
    login: async (parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          throw new AuthenticationError('User not found');
        }

        const correctPw = await user.isCorrectPassword(password);
        if (!correctPw) {
          throw new AuthenticationError('Incorrect password');
        }

        const token = signToken(user);
        return { token, user };
      } catch (error) {
        console.error("Login failed:", error);
        throw new AuthenticationError('Login failed.');
      }
    },

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



// Creating Artist
// ----------------
createArtist: async (parent, { name, bio, coverImage }) => {
  try {

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

    // Validate required inputs
    if (!name || !bio || !coverImage) {
      throw new Error("Missing required fields: name, bio, or coverImage.");
    }

    // Destructure to get the file stream and filename
    const { createReadStream, filename } = await coverImage;

    // Log the filename for debugging
    console.log("File name:", filename);

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
      Key: `cover-image/${name}/${filename}`,
      Body: createReadStream(),
      ContentType: mimeType,
    };

    // Use the Upload class for parallel uploads
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
      throw new Error("Failed to upload file to S3.");
    }

    // Generate the file's URL
    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${name}/${filename}`;

    // Create the artist in your database (assuming Sequelize or another ORM)
    const artist = await Artist.create({
      name,
      bio,
      coverImage: fileUrl, // Store the URL to the image
    });

    // Return the created artist object
    return artist;

  } catch (error) {
    console.error("Error creating artist:", error);
    throw new Error(`Failed to create artist: ${error.message}`);
  }
},





  }













  };


export default resolvers;
