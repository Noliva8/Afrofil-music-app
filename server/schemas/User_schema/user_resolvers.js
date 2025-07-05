
import { User, Playlist, Comment,  LikedSongs, SearchHistory, PlayCount , Recommended, Download, Artist, Song, Album } from '../../models/User/user_index.js';
import { signUserToken, AuthenticationError} from '../../utils/user_auth.js';


const resolvers = {

  Query: {

   users: async () => {
  try {
    const userData = await User.find({});
    return userData;
  } catch (error) {
    console.error("Error occurred during user data fetching:", error);
    throw new Error("Could not fetch user data");
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
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------

// PART 2: SINGLE QUERY

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

    // --------------------------------------------------------------------------

userById: async (parent, { userId }) => {
  try {
    const user = await User.findById({_id: userId})
      .populate('following');
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
},

// -----------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------



// Treding Songs
// ------------

trendingSongs: async () => {

  console.log('trending songs is called')
  const limit = 20;

  try {
    // Fetch all song sets in parallel
    const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
      Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist'),

      Song.aggregate([
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ["$likedByUsers", []] } }
          }
        },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: limit }
      ]),

      Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist'),

      Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist')
    ]);

    // Populate artists for topLikesAgg results
    const likedIds = topLikesAgg.map(song => song._id);
    const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist');

    // Merge them uniquely
    const merged = [];
    const seen = new Set();

    const addUnique = (songs) => {
      for (const song of songs) {
        const id = song._id.toString();
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(song);
          if (merged.length === limit) break;
        }
      }
    };
console.log("Top Plays:", topPlays.length);
console.log("Top Likes (agg):", topLikesAgg.length);
console.log("Top Downloads:", topDownloads.length);
console.log("Latest Songs:", latestSongs.length);

    addUnique(topPlays);
    addUnique(topLikes);
    addUnique(topDownloads);
    addUnique(latestSongs);

    return merged.slice(0, limit);
  } catch (error) {
    console.error("❌ Trending songs fetch error:", error);
    return [];
  }
},



// 
// ---------------------------------------------------------------------------------------




// -------------------------------------------------------------------------------------------




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
  // Input validation
  if (!username || !email || !password) {
    throw new Error("All fields are required.");
  }

  try {
    const newUser = await User.create({ username, email, password, role: 'user' });
    const userToken = signUserToken(newUser);
    return { userToken, newUser }; 

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

        const userToken = signUserToken(user);
        return { userToken, user };
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

    incrementPlayCount: async (parent, { songId }, { user, PlayCount }) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in!');
  }
  try {
    
    let playCount = await PlayCount.findOne({ userId: user.id, songId });

    if (playCount) {
      // Increment the count if the document exists
      playCount.count += 1;
      await playCount.save();
    } else {
      // Create a new PlayCount document if it doesn't exist
      playCount = new PlayCount({
        userId: user.id,
        songId,
        count: 1,
      });
      await playCount.save();
    }
    return playCount;
  } catch (error) {
    console.error('Failed to increase the count:', error);
    throw new Error('Failed to increase the count.');
  }
},


addDownload: async (parent, { songId }, { user, Download }) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in!');
  }

  try {
    // Check if the download record already exists
    const existingDownload = await Download.findOne({ userId: user.id, songId });

    if (existingDownload) {
      throw new Error('This song has already been downloaded by the user.');
    }

    // Create a new download record
    const download = new Download({
      userId: user.id,
      songId,
    });

    await download.save();

    return download;
  } catch (error) {
    console.error('Failed to add download:', error);
    throw new Error('Failed to add download.');
  }
},


addLikedSong: async (parent, { userId, songId }, { LikedSongs }) => {
  try {
    // Check if the song is already liked by the user
    const existingLikedSong = await LikedSongs.findOne({ userId, songId });

    if (existingLikedSong) {
      throw new Error('This song is already liked by the user.');
    }

    // Add the liked song
    const likedSong = new LikedSongs({
      userId,
      songId,
    });

    await likedSong.save();

    return likedSong;
  } catch (error) {
    console.error('Failed to like the song:', error);
    throw new Error('Failed to like the song.');
  }
},


searched_Songs: async (parent, { songId }, { user, SearchHistory }) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in!');
  }

  try {
    // Create a new search history record
    const searchHistory = new SearchHistory({
      user: user.id, // Use the authenticated user's ID
      searched_songs: songId,
    });

    // Save to the database
    await searchHistory.save();

    return searchHistory;
  } catch (error) {
    console.error('Failed to record search history:', error);
    throw new Error('Failed to record search history.');
  }
},

recommended_songs: async (parent, { userId, algorithm }, { User, Song, Recommended }) => {
  try {
    // Step 1: Validate the algorithm input
    const validAlgorithms = ['basedOnLikes', 'basedOnPlayCounts', 'trending', 'newReleases'];
    if (!validAlgorithms.includes(algorithm)) {
      throw new Error('Invalid algorithm provided.');
    }

    // Step 2: Fetch the list of songs based on the algorithm
    let songsToRecommend;
    
    switch (algorithm) {
      case 'basedOnLikes':
        // Recommend songs with the highest number of likes
        songsToRecommend = await Song.find().sort({ likes: -1 }).limit(5); // Top 5 songs
        break;
      case 'basedOnPlayCounts':
        // Recommend songs with the highest play counts
        songsToRecommend = await Song.find().sort({ playCount: -1 }).limit(5); // Top 5 songs
        break;
      case 'trending':
        // Recommend songs based on recent popularity or interactions
        songsToRecommend = await Song.find().sort({ updatedAt: -1 }).limit(5); // Top 5 recent songs
        break;
      case 'newReleases':
        // Recommend recently released songs
        songsToRecommend = await Song.find().sort({ releaseDate: -1 }).limit(5); // Top 5 new releases
        break;
      default:
        throw new Error('Invalid algorithm specified.');
    }

    // Step 3: Create recommendations for each song
    const recommendations = await Promise.all(
      songsToRecommend.map(async (song) => {
        const recommendation = new Recommended({
          user: userId,
          recommended_songs: song._id,
          algorithm,
        });
        
        await recommendation.save();
        return recommendation;
      })
    );

    // Step 4: Return the recommendations
    return {
      message: "Recommendations generated successfully!",
      recommendations, 
    };
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    throw new Error('Failed to generate recommendations.');
  }
},


  createPlaylist : async (parent, { title, description, songs }, { Playlist, User, Song, currentUser }) => {
  try {
   
    if (!currentUser) {
      throw new Error('Authentication required. Please log in to create a playlist.');
    }

    
    const user = await User.findById(currentUser._id);
    if (!user) {
      throw new Error('User not found.');
    }

    // Validate that all songs exist
    const validSongs = await Song.find({ '_id': { $in: songs } });
    if (validSongs.length !== songs.length) {
      throw new Error('One or more songs do not exist.');
    }

    // Create the playlist
    const playlist = new Playlist({
      title,
      description,
      songs,
      createdBy: currentUser._id  // Use the authenticated user's ID
    });

    // Save the playlist to the database
    await playlist.save();

    return playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw new Error(error.message || 'Failed to create playlist.');
  }
},


  }

  };


export default resolvers;
