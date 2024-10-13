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
      .populate('artists') 
      .populate('album')  
      .populate('likedByUsers')
      .populate({
        path: 'recommendedFor',
        populate: {
          path: 'user', 
          select: 'username' 
        }
      });
        
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
    .populate('songs');
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
   .populate('albums');
   return artistData;
  }catch(error){
console.error("Error occurred during altists data fetching:", error);
    throw new Error("Could not fetch altist data");

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
    .populate('song');
    return commentData;
  }catch(error){
 console.error("Error occurred during comments data fetching:", error);
    throw new Error("Could not fetch comments data");
  }
},





    matchups: async (parent, { _id }) => {
      const params = _id ? { _id } : {};
      return Matchup.find(params);
    },

  },












  Mutation: {
    createMatchup: async (parent, args) => {
      const matchup = await Matchup.create(args);
      return matchup;
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
