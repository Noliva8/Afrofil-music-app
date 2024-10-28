const { User, Song, Album, Artist, Genre, Playlist, Comment } = require('../models');
const { createWriteStream } = require('fs');
const path = require('path');
const { Date, Upload } = require('..utils/scalar'); 
const ffmpeg = require('ffmpeg');
const sharp = require('sharp');
const handleImageUpload = require('../utils/imageUpload');


const resolvers = {
 
  Query: {
  Date, 
  Upload,
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
    }
  },

createArtist: async (parent, { name, bio, coverImage }) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    let coverImagePath = null;

    // Process cover image if provided
    if (coverImage) {
      coverImagePath = await handleImageUpload(coverImage, uploadDir);
    }

    // Create the new artist in the database
    const newArtist = await Artist.create({
      name,
      bio,
      coverImage: coverImagePath
    });

    return newArtist;
  } catch (error) {
    console.error("Error creating artist:", error);
    throw new Error(`Failed to create artist: ${error.message}`);
  }
},

updateArtist: async (parent, { artistId, name, bio, coverImage }) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    const updatedFields = { name, bio };

    // Check if coverImage is provided and handle upload
    if (coverImage) {
      const currentArtist = await Artist.findById({ artistId: _id});
      
      // Delete old cover image if it exists
      if (currentArtist.coverImage) {
        const oldImagePath = path.join(uploadDir, path.basename(currentArtist.coverImage));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Upload new cover image
      const coverImagePath = await handleImageUpload(coverImage, uploadDir, artistId);
      updatedFields.coverImage = coverImagePath;
    }

    // Update the artist in the database
    const updatedArtist = await Artist.findOneAndUpdate(
      { _id: artistId },
      { $set: updatedFields },
      { new: true }
    );
    return updatedArtist;
  } catch (error) {
    console.error("Error updating artist:", error);
    throw new Error(`Failed to update the artist: ${error.message}`);
  }
},


deleteArtist: async (parent, { artistId }) => {
  try {
    // Delete the artist
    const artistData = await Artist.findOneAndDelete({ _id: artistId });
    if (!artistData) {
      throw new Error("Artist not found.");
    }

    // Delete all songs associated with the artist
    const deletedSongs = await Song.deleteMany({ artistId: artistId });

    // Delete all albums associated with the artist
    const deletedAlbums = await Album.deleteMany({ artistId: artistId });

    return {
      message: "Artist, along with associated songs and albums, deleted successfully",
      deletedArtist: artistData,
      deletedSongsCount: deletedSongs.deletedCount,
      deletedAlbumsCount: deletedAlbums.deletedCount
    };
  } catch (error) {
    console.error("Error deleting artist:", error);
    throw new Error(`Failed to delete the artist: ${error.message}`);
  }
},



createSong: async (parent, { title, artistId, albumId, genreId, duration, releaseDate, audioFile }) => {
  try {
    const { createReadStream, filename, mimetype } = await audioFile;

    // Validate the MIME type against allowed types
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'];
    if (!allowedMimeTypes.includes(mimetype)) {
      throw new Error('Invalid file type. Please upload a valid audio file (MP3, WAV, OGG, FLAC).');
    }

    const tempFilePath = path.join(__dirname, '../../uploads', filename);
    const convertedFilePath = path.join(__dirname, '../../uploads', `${path.parse(filename).name}.mp3`);

    // Stream the file to the uploads directory
    await new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(tempFilePath))
        .on('finish', resolve)
        .on('error', reject);
    });

    // Convert the file to MP3 and adjust bitrate using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .toFormat('mp3')
        .audioBitrate('256k')
        .on('end', () => {
          console.log('Conversion finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error converting file:', err);
          reject(new Error('Failed to convert the audio file.'));
        })
        .save(convertedFilePath);
    });

    // Remove the temporary file asynchronously
    await fs.promises.unlink(tempFilePath);

    // Perform database lookups
    const [artist, album, genre] = await Promise.all([
      Artist.findById(artistId),
      albumId ? Album.findById(albumId) : Promise.resolve(null),
      genreId ? Genre.findById(genreId) : Promise.resolve(null)
    ]);

    if (!artist) {
      throw new Error("Artist not found");
    }

    // Create audio hash
    const audioHash = await generateAudioHash(convertedFilePath); // Define this function

    // Create the new song
    const newSong = await Song.create({
      title,
      artist: artist._id, 
      album: album ? album._id : "Unknown", 
      genre: genre ? genre._id : "Unknown", 
      duration,
      releaseDate,
      audioFilePath: convertedFilePath,
      audioHash // Include the hash
    });

    // Return the created song
    return newSong;
  } catch (error) {
    console.error("Error while trying to create the song:", error);
    throw new Error(`Failed to create the song: ${error.message}`);
  }
},

updateSong: async (parent, { songId, title, releaseDate, audioFilePath }) => {
      try {
        let updatedAudioFilePath = null;

        // If a new audio file is provided, handle the upload
        if (audioFilePath) {
          const { createReadStream, filename } = await audioFilePath;

          const tempFilePath = path.join(__dirname, '../../uploads', filename);
          const fileStream = createReadStream();

          // Stream the file to the uploads directory
          await new Promise((resolve, reject) => {
            fileStream
              .pipe(createWriteStream(tempFilePath))
              .on('finish', resolve)
              .on('error', reject);
          });

          // Set the new audio file path
          updatedAudioFilePath = tempFilePath;
        }

        // Update the song details in the database
        const updatedFields = {
          title,
          releaseDate,
        };

        // If there's a new audio file, update the audioFilePath field as well
        if (updatedAudioFilePath) {
          updatedFields.audioFilePath = updatedAudioFilePath;
        }

        const updatedSong = await Song.findOneAndUpdate(
          { _id: songId },
          { $set: updatedFields },
          { new: true } 
        );

        if (!updatedSong) {
          throw new Error('Song not found');
        }

        return updatedSong;
      } catch (error) {
        console.error('Error while trying to update the song:', error);
        throw new Error(`Failed to update the song: ${error.message}`);
      }
    },


deleteSong: async (parent, { songId }) => {
  try {
    // Find the song by ID to get the file path
    const songToDelete = await Song.findById(songId);

    if (!songToDelete) {
      console.log('The song with this ID does not exist');
      return null;
    }

    // Get the path to the audio file
    const audioFilePath = songToDelete.audioFilePath;

    // Remove the song entry from the database
    const deletedSong = await Song.findOneAndDelete({ _id: songId });

    // Remove the file from the file system asynchronously if it exists
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlink(path.resolve(audioFilePath), (err) => {
        if (err) {
          console.error('Failed to delete the audio file:', err);
        } else {
          console.log('Audio file deleted successfully');
        }
      });
    }

    return deletedSong;

  } catch (error) {
    console.error('Error while trying to delete the song:', error);
    throw new Error(`Failed to delete the song: ${error.message}`);
  }
},

createAlbum: async (parent, { title, releaseDate, artistId, songId }) => {
  try {
    // Fetch artist and song data and ensure they exist
    const artistData = await Artist.findById(artistId);
    if (!artistData) {
      throw new Error("Artist not found.");
    }

    const songData = await Song.findById(songId);
    if (!songData) {
      throw new Error("Song not found.");
    }

    // Create the album with valid artist and song references
    const album = await Album.create({
      title,
      releaseDate,
      artistId: artistData._id,
      songs: [songData._id] 
    });

    return album;
  } catch (error) {
    console.error('Error while trying to create the album:', error);
    throw new Error(`Failed to create the album: ${error.message}`);
  }
},

updateAlbum: async (parent, { albumId, title, releaseDate, songId }) => {
  try {
    // Check if the song exists
    const songData = await Song.findById(songId);
    if (!songData) {
      throw new Error("Song not found.");
    }

    // Update the album with the new title, release date, and add the song if provided
    const updatedAlbum = await Album.findOneAndUpdate(
      { _id: albumId },
      {
        $set: { title, releaseDate },
        $addToSet: { songIds: songData._id } 
      },
      { new: true }
    );

    return updatedAlbum;
  } catch (error) {
    console.error('Error while trying to update the album:', error);
    throw new Error(`Failed to update the album: ${error.message}`);
  }
},

deleteAlbum: async (parent, { albumId }) => {
  try {
    // Find and delete the album
    const deletedAlbum = await Album.findOneAndDelete({ _id: albumId });
    if (!deletedAlbum) {
      throw new Error("Album not found.");
    }

    // Update songs associated with the deleted album
    await Song.updateMany(
      { album: albumId },  // Find songs with this album ID
      { $set: { album: null } }  // Set album reference to null
    );

    return deletedAlbum;
  } catch (error) {
    console.error('Error while trying to delete the album:', error);
    throw new Error(`Failed to delete the album: ${error.message}`);
  }
},

createComment: async (parent, { songId, userId, content }) => {
  try {
    // Find the song and user by their IDs
    const song = await Song.findById(songId);
    const user = await User.findById(userId);

    // Check if song and user exist
    if (!song) {
      throw new Error("Song not found.");
    }
    if (!user) {
      throw new Error("User not found.");
    }

    // Create the comment
    const comment = await Comment.create({
      songId: song._id,
      userId: user._id,
      content,
    });

    return comment;

  } catch (error) {
    console.error("Error while trying to create the comment:", error);
    throw new Error(`Failed to create the comment: ${error.message}`);
  }
},

updateComment: async (parent, { commentId, content }) => {
  try {
    // Find the comment by ID and update its content
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId },
      { $set: { content } },
      { new: true } // Return the updated comment
    );

    // Check if the comment exists
    if (!updatedComment) {
      throw new Error("Comment not found.");
    }

    return updatedComment;
  } catch (error) {
    console.error("Error while trying to update the comment:", error);
    throw new Error(`Failed to update the comment: ${error.message}`);
  }
},

deleteComment: async (parent, { commentId }) => {
  try {
    // Find and delete the comment by ID
    const deletedComment = await Comment.findOneAndDelete({ _id: commentId });

    // Check if the comment exists
    if (!deletedComment) {
      throw new Error("Comment not found.");
    }

    return deletedComment;
  } catch (error) {
    console.error("Error while trying to delete the comment:", error);
    throw new Error(`Failed to delete the comment: ${error.message}`);
  }
}

  };


module.exports = resolvers;
