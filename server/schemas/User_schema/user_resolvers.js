
import {  Album, Artist, } from '../../models/Artist/index_artist.js'
import { User,  Playlist, Comment,} from '../../models/User/user_index.js'
import {   AuthenticationError} from '../../utils/user_auth.js';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import { detectUserLocation } from './OtherResorvers/detectUserLocation.js';
import { createSongRedis, redisTrending } from '../Artist_schema/Redis/songCreateRedis.js';
import { toggleLikeSong } from './OtherResorvers/toggleLikeSong.js';

import {USER_TYPES} from '../../utils/AuthSystem/constant/systemRoles.js'
import {signUserToken } from '../../utils/AuthSystem/tokenUtils.js';
import { addSongRedis } from '../Artist_schema/Redis/addSongRedis.js';
import { songKey } from '../Artist_schema/Redis/keys.js';
import { getRedis } from '../../utils/AdEngine/redis/redisClient.js';
import { Song  } from '../Artist_schema/songResolver.js';




// Helper function to determine if song should be cached
function shouldCacheSong(song) {
  return (
    song.playCount > 100 ||        // Already popular
    song.releaseDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) || // New release
    song.isFeatured ||             // Featured song
    song.artist?.isPopular         // Popular artist
  );
}

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

// trendingSongs: async () => {

//   console.log('trending songs is called')
//   const limit = 20;

//   try {
//     // Fetch all song sets in parallel
//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist').populate('album'),

//       Song.aggregate([
//         {
//           $addFields: {
//             likesCount: { $size: { $ifNull: ["$likedByUsers", []] } }
//           }
//         },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist').populate('album'),

//       Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist').populate('album')
//     ]);

//     // Populate artists for topLikesAgg results
//     const likedIds = topLikesAgg.map(song => song._id);
//     const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist').populate('album');

//     // Merge them uniquely
//     const merged = [];
//     const seen = new Set();

//     const addUnique = (songs) => {
//       for (const song of songs) {
//         const id = song._id.toString();
//         if (!seen.has(id)) {
//           seen.add(id);
//           merged.push(song);
//           if (merged.length === limit) break;
//         }
//       }
//     };
// console.log("Top Plays:", topPlays.length);
// console.log("Top Likes (agg):", topLikesAgg.length);
// console.log("Top Downloads:", topDownloads.length);
// console.log("Latest Songs:", latestSongs.length);

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

   

//     return merged.slice(0, limit);
//   } catch (error) {
//     console.error("❌ Trending songs fetch error:", error);
//     return [];
//   }
// },




// trendingSongs: async () => {
//   const limit = 20;

//   // // 1) Try Redis first
//   // try {
//   //   const fromRedis = await redisTrending(limit);
//   //   if (fromRedis && fromRedis.length) {
//   //     return fromRedis;
//   //   }
//   // } catch (e) {
//   //   console.warn("[trendingSongs] Redis fetch failed, falling back:", e.message);
//   // }

//   // 2) DB fallback
//   try {
//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit)
//         .populate({path: 'artist', select: '-password -email -__v'}).populate({ path: 'album', populate: {
//       path: 'artist',
//       select: ' artistAka profileImage bio country genre languages coverImage' 
//     }}).lean(),



//       Song.aggregate([
//         { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit)
//         .populate('artist').populate('album').lean(),

//       Song.find().sort({ createdAt: -1 }).limit(limit)
//         .populate('artist').populate('album').lean(),
//     ]);





//     // Re-fetch liked with full docs
//     const likedIds = topLikesAgg.map(s => s._id);
//     const topLikes = await Song.find({ _id: { $in: likedIds } })
//       .populate('artist').populate('album').lean();

//     const merged = [];
//     const seen = new Set();

//     const addUnique = (songs) => {
//       for (const s of songs) {
//         const id = s._id.toString();
//         if (seen.has(id)) continue;

//         // ⚠️ Sanitize missing artist/album/title — allow song through
//         const artist = s.artist || null;
//         const album = s.album || null;
//         const albumTitle = album?.title || 'Unknown Album';

//         seen.add(id);
//         merged.push({
//           ...s,
//           artist,
//           album: album ? { ...album, title: albumTitle } : null,
//           likesCount: s.likedByUsers?.length || s.likesCount || 0,
//         });

//         if (merged.length === limit) break;
//       }
//     };

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

//     const result = merged.slice(0, limit);



// console.log('retruned songs:', result)
//     // 3) Best-effort Redis backfill
//     (async () => {
//       try {
//         const r = await getRedis();
//         for (const doc of result) {
//           try {
//             await createSongRedis(doc);
//             if (typeof recomputeTrendingFor === "function") {
//               await recomputeTrendingFor(r, String(doc._id));
//             }
//           } catch (e) {
//             console.warn("[trendingSongs] backfill for", doc._id, "failed:", e.message);
//           }
//         }
//       } catch (e) {
//         console.warn("[trendingSongs] Redis backfill skipped:", e.message);
//       }
//     })();

//     return result;
//   } catch (err) {
//     console.error("❌ Trending songs DB fallback error:", err);
//     return [];
//   }
// },




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


createUser: async (_, { input }) => {
      try {
        const { username, email, password, role = 'REGULAR' } = input;

        // Validate input
        if (!username?.trim() || !email?.trim() || !password) {
          throw new GraphQLError('All fields are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new GraphQLError('Invalid email format', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate password strength
        if (password.length < 8) {
          throw new GraphQLError('Password must be at least 8 characters', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }


        // Normalize role to lowercase
        const normalizedRole = role.toLowerCase(); 

        // Check for existing non-artist user
        const existingUser = await User.findOne({
          email: email.toLowerCase(),
          role: { $ne: 'ARTIST' }
        }).lean();

        if (existingUser) {
          throw new GraphQLError('Email already in use by a regular/premium user', {
            extensions: { code: 'CONFLICT' }
          });
        }

         // Create user
        const newUser = await User.create({
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password,
          role: normalizedRole,
          subscription: {
            status: normalizedRole === 'premium' ? 'active' : 'trialing',
            periodEnd: normalizedRole === 'premium'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : null,
            planId: null
          },
          adLimits: {
            skipsAllowed: 5,
            lastReset: new Date()
          }
        });

           const token = signUserToken(newUser, USER_TYPES.USER);

           const isPremium = normalizedRole === 'premium';



      

        return {
          userToken: token,
          user: {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            isPremium,
            shouldSeeAds: !isPremium,
            canSkipAd: true,
            subscription: newUser.subscription,
            adLimits: newUser.adLimits,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
          }
        };

      } catch (error) {
        console.error('User creation error:', error);

        if (error.code === 11000) {
          throw new GraphQLError('User already exists', {
            extensions: { code: 'CONFLICT' }
          });
        }

        if (error.extensions?.code) {
          throw error;
        }

        throw new GraphQLError('Failed to create user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },



   // LOGIN
    login: async (_, { email, password }) => {
      try {
        if (!email?.trim() || !password) {
          throw new GraphQLError('Email and password are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = await User.findOne({
  email: email.toLowerCase().trim()
}).select('+password'); // Add this!

if (!user) {
  throw new GraphQLError('Invalid credentials', {
    extensions: { code: 'UNAUTHENTICATED' }
  });
}

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  throw new GraphQLError('Invalid credentials', {
    extensions: { code: 'UNAUTHENTICATED' }
  });
}


        const token = signUserToken(user, USER_TYPES.USER);

        const isPremium = user.role === 'premium' &&
          user.subscription?.status === 'active' &&
          (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > new Date());

        return {
          userToken: token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium,
            shouldSeeAds: !isPremium,
            canSkipAd: isPremium || (user.adLimits?.skipsAllowed > 0),
            subscription: user.subscription,
            adLimits: user.adLimits,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        };

      } catch (error) {
        console.error('Login error:', error);

        if (error.extensions?.code) {
          throw error;
        }

        throw new GraphQLError('Login failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
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



    // upgradeUserToPremium
  // ---------------------
  // upgradeCurrentUserToPremium: async (_, __, { user }) => {
  //     if (!user?._id) {
  //       throw new AuthenticationError('You must be logged in to upgrade.');
  //     }

  //     console.log('verify, user:', user)

  //     const now = new Date();
  //     const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));

  //     const updatedUser = await User.findByIdAndUpdate(
  //       user._id,
  //       {
  //         role: 'premium',
  //         subscription: {
  //           status: 'active',
  //           periodEnd: oneMonthLater,
  //           planId: 'manual-test'
  //         }
  //       },
  //       { new: true }
  //     );

  //     return updatedUser;
  //   },





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


// other resolvers

detectUserLocation,
toggleLikeSong,

  },
  Song

  };


export default resolvers;
