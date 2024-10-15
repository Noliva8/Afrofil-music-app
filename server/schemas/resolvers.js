const { User, Song, Album, Artist, Genre, Playlist, Comment } = require('../models');

const resolvers = {
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












    matchups: async (parent, { _id }) => {
      const params = _id ? { _id } : {};
      return Matchup.find(params);
    },

  },




  Mutation: {
    createUser: async (parent, args) => {
      const newUser = await User.create(args);
      return newUser;
    },





    
    createVote: async (parent, { _id, techNum }) => {
      const vote = await Matchup.findOneAndUpdate(
        { _id },
        { $inc: { [`tech${techNum}_votes`]: 1 } },
        { new: true }
      );
      return vote;
    },
  },
};

module.exports = resolvers;
