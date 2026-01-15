import { Song, Artist, Album } from '../../../models/Artist/index_artist.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { ARTIST_SONGS } from '../Redis/keys.js';

// import { CreatePresignedUrlDownload, CreatePresignedUrlDownloadAudio } from '../../../utils/awsS3.js';

import { getPresignedUrlDownload } from '../../../utils/cloudFrontUrl.js';


// export const getArtistSongs = async (_, { artistId }, context) => {
//   console.log('getArtistSongs called', { artistId, hasUser: !!context?.user });
//   const userId = context?.user?._id || null;
//   const key = ARTIST_SONGS(artistId);
//   const client = await getRedis();

//   let songs = [];

//   try {
//     // 1. Try to get top 20 songs from Redis sorted set (by playCount)
//     const songIds = await client.zRange(key, 0, 19, { REV: true }); // Get top 20 descending
    
//     if (songIds && songIds.length > 0) {
//       // Found songs in Redis cache
//       console.log(`Cache hit for artist ${artistId}: ${songIds.length} songs`);
      
//       // Fetch songs from database with correct population
//       songs = await Song.find({
//         _id: { $in: songIds },
//         visibility: 'public',
//         artist: artistId
//       })
//       .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
//       .populate('album', 'title albumCoverImage releaseDate')
//       .lean();

//       // Sort songs in the same order as Redis results
//       const songMap = new Map(songs.map(song => [song._id.toString(), song]));
//       songs = songIds
//         .map(id => songMap.get(id))
//         .filter(song => song);
//     }

//     // 2. If Redis cache miss or empty, fallback to database
//     if (songs.length === 0) {
//       console.log(`Cache miss for artist ${artistId}, querying database...`);
      
//       // Fetch top 20 songs from database by playCount
//       songs = await Song.find({
//         artist: artistId,
//         visibility: 'public'
//       })
//       .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
//       .populate('album', 'title albumCoverImage releaseDate')
//       .select('-copyrightSettings -monetization')
//       .sort({ playCount: -1, releaseDate: -1 })
//       .limit(20)
//       .lean();

//       // Cache the results in Redis for 1 hour
//       if (songs.length > 0) {
//         const pipeline = client.multi();
        
//         // Add each song to sorted set with playCount as score
//         songs.forEach(song => {
//           pipeline.zAdd(key, { 
//             score: song.playCount || 0, 
//             value: song._id.toString() 
//           });
//         });
        
//         // Set expiration for 1 hour (3600 seconds)
//         pipeline.expire(key, 3600);
        
//         await pipeline.exec();
//         console.log(`Cached ${songs.length} songs for artist ${artistId} with 1h expiration`);
//       }
//     }

//     // Add user-specific data (likedByMe)
//     if (songs.length > 0) {
//       // Check which songs are liked by the current user (optional for guests)
//       let likedSongIds = new Set();
//       if (userId) {
//         const userLikes = await Song.find({
//           _id: { $in: songs.map(s => s._id) },
//           likedByUsers: userId
//         })
//         .select('_id')
//         .lean();
//         likedSongIds = new Set(userLikes.map(like => like._id.toString()));
//       }
      
//       // Transform songs
//       songs = songs.map(song => ({
//         id: song._id,
//         title: song.title,
//         genre: song.genre,
//         mood: song.mood || [],
//         subMoods: song.subMoods || [],
//         producer: song.producer || [],
//         composer: song.composer || [],
//         label: song.label,
//         duration: song.duration,
//         releaseDate: song.releaseDate,
//         lyrics: song.lyrics,
//         playCount: song.playCount || 0,
//         downloadCount: song.downloadCount || 0,
//         likesCount: song.likedByUsers?.length || 0,
//         shareCount: song.shareCount || 0,
//         likedByMe: userId ? likedSongIds.has(song._id.toString()) : false,
//         tags: song.tags || [],
//         audioFileUrl: song.audioFileUrl,
//         streamAudioFileUrl: song.streamAudioFileUrl,
//         artwork: song.artwork,
//         tempo: song.tempo,
//         key: song.key,
//         keyConfidence: song.keyConfidence,
//         mode: song.mode,
//         timeSignature: song.timeSignature,
//         beats: song.beats || [],
//         featuringArtist: song.featuringArtist || [],
//         trackNumber: song.trackNumber,
//         createdAt: song.createdAt,
//         trendingScore: song.trendingScore || 0,
//         lastPlayedAt: song.lastPlayedAt,
        
//         // Populated artist
//         artist: song.artist ? {
//           id: song.artist._id,
//           fullName: song.artist.fullName,
//           artistAka: song.artist.artistAka,
//           profileImage: song.artist.profileImage,
//           coverImage: song.artist.coverImage,
//           country: song.artist.country,
//           genre: song.artist.genre || [],
//           bio: song.artist.bio,
//         } : null,
        
//         // Populated album
//         album: song.album ? {
//           id: song.album._id,
//           title: song.album.title,
//           albumCoverImage: song.album.albumCoverImage,
//           releaseDate: song.album.releaseDate,
//           createdAt: song.album.createdAt
//         } : null,
        
//         __typename: 'Song'
//       }));
//     }

//     return songs;

//   } catch (error) {
//     console.error('Error in getArtistSongs:', error);
    
//     // Last resort: try without Redis
//     try {
//       const songs = await Song.find({
//         artist: artistId,
//         visibility: 'public'
//       })
//       .populate('artist', 'fullName artistAka profileImage')
//       .populate('album', 'title albumCoverImage')
//       .sort({ playCount: -1 })
//       .limit(20)
//       .lean();

//       return songs.map(song => ({
//         ...song,
//         id: song._id,
//         likedByMe: song.likedByUsers?.includes(userId) || false,
//         likesCount: song.likedByUsers?.length || 0
//       }));
//     } catch (fallbackError) {
//       console.error('Fallback also failed:', fallbackError);
//       throw new Error('Failed to fetch songs. Please try again later.');
//     }
//   }
// };




// export const getArtistSongs = async (_, { artistId }, context) => {

//   console.log('🎵 ==================== getArtistSongs START ====================');
//   console.log('📥 Input:', { 
//     artistId, 
//     artistIdType: typeof artistId,
//     hasUser: !!context?.user,
//     userId: context?.user?._id || 'no-user',
//     userType: context?.user?.constructor?.name || 'unknown'
//   });
  

//   // Validate artistId
//   if (!artistId) {
//     console.error('❌ artistId is required but was:', artistId);
//     throw new Error('artistId is required');
//   }
  
//   if (typeof artistId !== 'string') {
//     console.error('❌ artistId must be a string, got:', typeof artistId, 'value:', artistId);
//     throw new Error('artistId must be a string');
//   }



// // not needed
//   const userId = context?.user?._id || null;


//   const key = ARTIST_SONGS(artistId);
  
//   let client;
//   try {
//     client = await getRedis();
  
//   } catch (redisError) {
//     console.warn('⚠️ Redis client error, proceeding without cache:', redisError.message);
//     client = null;
//   }



//   let songs = [];

// // not needed
//   const parseBucketKey = (value, defaultBucket = '') => {
//     if (!value) return { bucket: null, key: null };
//     if (value.includes('cloudfront.net')) return { bucket: null, key: null, passthrough: value };
//     if (value.startsWith('s3://')) {
//       const rest = value.slice(5);
//       const i = rest.indexOf('/');
//       return { bucket: rest.slice(0, i), key: rest.slice(i + 1) };
//     }

//     try {
//       const u = new URL(value);
//       if (u.hostname.includes('amazonaws.com')) {
//         const parts = u.hostname.split('.');
//         if (parts[0] !== 's3') {
//           return { bucket: parts[0], key: u.pathname.replace(/^\/+/, '') };
//         }
//         const segs = u.pathname.split('/').filter(Boolean);
//         const [bucket, ...rest] = segs;
//         return { bucket, key: rest.join('/') };
//       }
//     } catch {
//       // not a URL
//     }
//     return { bucket: defaultBucket, key: String(value).replace(/^\/+/, '') };
//   };

//   const mapToCloudFront = async (pointer, { bucket: defaultBucket, region, isAudio = false }) => {
//     if (!pointer) return null;
//     const parsed = parseBucketKey(pointer, defaultBucket);
//     if (parsed.passthrough) return parsed.passthrough;
//     if (!parsed.bucket || !parsed.key) return pointer;
//     try {
//       if (isAudio) {
//         return getPresignedUrlDownload({
//           bucket: parsed.bucket,
//           key: decodeURIComponent(parsed.key),
//           region,
//         });
//       }
//       return getPresignedUrlDownload({
//         bucket: parsed.bucket,
//         key: decodeURIComponent(parsed.key),
//         region,
//       });
//     } catch (err) {
//       console.warn('CF mapping failed, falling back to pointer', err?.message || err);
//       return pointer;
//     }
//   };
// // -------------


//   try {
//     // 1. Try Redis cache
//     if (client) {
    
//       const songIds = await client.zRange(key, 0, 19, { REV: true });
     
      
//       if (songIds && songIds.length > 0) {
      
        
//         const mongoQuery = {
//           _id: { $in: songIds },
//           visibility: 'public',
//           artist: artistId
//         };
//         songs = await Song.find(mongoQuery)
//           .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
//           .populate('album', 'title albumCoverImage releaseDate')
//           .lean();
        
       
        
//         // Sort songs in the same order as Redis results
//         const songMap = new Map(songs.map(song => [song._id.toString(), song]));
//         songs = songIds
//           .map(id => songMap.get(id))
//           .filter(song => song);
        
//         console.log(`📊 After sorting: ${songs.length} songs remain`);
//       } else {
//         console.log('❌ Cache miss for artist', artistId);
//       }
//     }

//     // 2. If Redis cache miss or empty, fallback to database
//     if (songs.length === 0) {
     
      
//       const mongoQuery = {
//         artist: artistId,
//         visibility: 'public'
//       };
//       console.log('📝 Full Mongo query:', JSON.stringify(mongoQuery, null, 2));
      
//       songs = await Song.find(mongoQuery)
//         .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
//         .populate('album', 'title albumCoverImage releaseDate')
//         .select('-copyrightSettings -monetization')
//         .sort({ playCount: -1, releaseDate: -1 })
//         .limit(20)
//         .lean();
      
//       console.log(`📊 Database returned ${songs.length} songs`);
//       console.log('🔍 Sample song:', songs[0] ? {
//         _id: songs[0]._id,
//         title: songs[0].title,
//         artist: songs[0].artist?._id || 'no-artist',
//         visibility: songs[0].visibility
//       } : 'No songs found');

//       // Cache the results in Redis for 1 hour
//       if (client && songs.length > 0) {
//         console.log(`💾 Caching ${songs.length} songs to Redis for 1 hour...`);
//         const pipeline = client.multi();
        
//         songs.forEach((song, index) => {
//           const score = song.playCount || 0;
//           const value = song._id.toString();
//           pipeline.zAdd(key, { score, value });
//           if (index < 3) {
//             console.log(`  ${index + 1}. Adding song ${value} with score ${score}`);
//           }
//         });
        
//         if (songs.length > 3) {
//           console.log(`  ... and ${songs.length - 3} more songs`);
//         }
        
//         pipeline.expire(key, 3600);
        
//         try {
//           await pipeline.exec();
//           console.log(`✅ Successfully cached ${songs.length} songs`);
//         } catch (cacheError) {
//           console.warn('⚠️ Failed to cache songs:', cacheError.message);
//         }
//       }
//     }

//     // 3. Add user-specific data (likedByMe)
//     if (songs.length > 0) {
//       console.log(`👤 Processing user-specific data for ${userId ? 'logged-in user' : 'guest'}`);
      
//       let likedSongIds = new Set();
//       if (userId && songs.length > 0) {
//         console.log(`🔍 Checking likes for user ${userId} across ${songs.length} songs...`);
//         const userLikes = await Song.find({
//           _id: { $in: songs.map(s => s._id) },
//           likedByUsers: userId
//         })
//         .select('_id')
//         .lean();
        
//         likedSongIds = new Set(userLikes.map(like => like._id.toString()));
//         console.log(`❤️ User has liked ${likedSongIds.size} of these songs`);
//       }
      
//       console.log(`🔄 Transforming ${songs.length} songs for GraphQL response...`);
      
//       // Transform songs
//       songs = await Promise.all(songs.map(async (song, index) => {
//         const idStr = song._id ? String(song._id) : (song.id ? String(song.id) : '');
//         const fallbackArtwork =
//           song.artwork ||
//           song.album?.albumCoverImage ||
//           song.artist?.coverImage ||
//           song.artist?.profileImage ||
//           null;

//         const artworkUrl = await mapToCloudFront(song.artwork || fallbackArtwork, {
//           bucket: 'afrofeel-cover-images-for-songs',
//           region: 'us-east-2',
//           isAudio: false,
//         });
//         const audioUrl = await mapToCloudFront(
//           song.streamAudioFileUrl || song.audioFileUrl || song.audioUrl,
//           { bucket: 'afrofeel-songs-streaming', region: 'us-west-2', isAudio: true }
//         );


//         const transformed = {
//           _id: song._id,
//           id: idStr,
//           title: song.title,
//           genre: song.genre,
//           mood: song.mood || [],
//           subMoods: song.subMoods || [],
//           producer: song.producer || [],
//           composer: song.composer || [],
//           label: song.label,
//           duration: song.duration,
//           releaseDate: song.releaseDate,
//           lyrics: song.lyrics,
//           playCount: song.playCount || 0,
//           downloadCount: song.downloadCount || 0,
//           likesCount: song.likedByUsers?.length || 0,
//           shareCount: song.shareCount || 0,
//           likedByMe: userId ? likedSongIds.has(song._id.toString()) : false,
//           tags: song.tags || [],
//           audioFileUrl: audioUrl || song.audioFileUrl,
//           streamAudioFileUrl: audioUrl || song.streamAudioFileUrl,
//           artwork: artworkUrl || fallbackArtwork,
//           artworkPresignedUrl: artworkUrl || song.artworkPresignedUrl || fallbackArtwork,
//           tempo: song.tempo,
//           key: song.key,
//           keyConfidence: song.keyConfidence,
//           mode: song.mode,
//           timeSignature: song.timeSignature,
//           beats: song.beats || [],
//           featuringArtist: song.featuringArtist || [],
//           trackNumber: song.trackNumber,
//           createdAt: song.createdAt,
//           trendingScore: song.trendingScore || 0,
//           lastPlayedAt: song.lastPlayedAt,
          
//           // Populated artist
//           artist: song.artist ? {
//             _id: song.artist._id,
//             id: song.artist._id,
//             fullName: song.artist.fullName,
//             artistAka: song.artist.artistAka,
//             profileImage: song.artist.profileImage,
//             coverImage: song.artist.coverImage,
//             country: song.artist.country,
//             genre: song.artist.genre || [],
//             bio: song.artist.bio,
//           } : null,
          
//           // Populated album
//           album: song.album ? {
//             _id: song.album._id,
//             id: song.album._id,
//             title: song.album.title,
//             albumCoverImage: song.album.albumCoverImage,
//             releaseDate: song.album.releaseDate,
//             createdAt: song.album.createdAt
//           } : null,
          
//           __typename: 'Song'
//         };
        
//         // Log first 2 songs for debugging
//         if (index < 2) {
//           console.log(`📋 Sample transformed song ${index + 1}:`, {
//             id: idStr ? `${idStr.substring(0, 10)}...` : 'none',
//             title: transformed.title,
//             hasArtist: !!transformed.artist,
//             hasAlbum: !!transformed.album,
//             playCount: transformed.playCount
//           });
//         }
        
//         return transformed;
//       }));
//     } else {
//       console.log('📭 No songs found for artist', artistId);
//     }

//     console.log(`✅ Returning ${songs.length} songs for artist ${artistId}`);
//     console.log('🎵 ==================== getArtistSongs END ====================\n');
//     return songs;

//   } catch (error) {
//     console.error('❌ ERROR in getArtistSongs:', error);
//     console.error('🔍 Error details:', {
//       message: error.message,
//       stack: error.stack?.split('\n').slice(0, 3),
//       artistId
//     });
    
//     // Last resort: try without Redis and with minimal fields
//     try {
//       console.log('🔄 Attempting fallback query...');
//       const fallbackSongs = await Song.find({
//         artist: artistId,
//         visibility: 'public'
//       })
//       .populate('artist', 'fullName artistAka profileImage')
//       .populate('album', 'title albumCoverImage')
//       .sort({ playCount: -1 })
//       .limit(20)
//       .lean();

//       console.log(`🔄 Fallback found ${fallbackSongs.length} songs`);
      
//       const result = await Promise.all(fallbackSongs.map(async song => {
//         const idStr = song._id ? String(song._id) : (song.id ? String(song.id) : '');
//         const fallbackArtwork =
//           song.artwork ||
//           song.album?.albumCoverImage ||
//           song.artist?.coverImage ||
//           song.artist?.profileImage ||
//           null;
//         const artworkUrl = await mapToCloudFront(song.artwork || fallbackArtwork, {
//           bucket: 'afrofeel-cover-images-for-songs',
//           region: 'us-east-2',
//           isAudio: false,
//         });
//         const audioUrl = await mapToCloudFront(
//           song.streamAudioFileUrl || song.audioFileUrl || song.audioUrl,
//           { bucket: 'afrofeel-songs-streaming', region: 'us-west-2', isAudio: true }
//         );
//         return {
//           _id: song._id,
//           id: idStr,
//           title: song.title,
//           genre: song.genre,
//           mood: song.mood || [],
//           subMoods: song.subMoods || [],
//           producer: song.producer || [],
//           composer: song.composer || [],
//           label: song.label,
//           duration: song.duration,
//           releaseDate: song.releaseDate,
//           lyrics: song.lyrics,
//           playCount: song.playCount || 0,
//           downloadCount: song.downloadCount || 0,
//           likesCount: song.likedByUsers?.length || 0,
//           shareCount: song.shareCount || 0,
//           likedByMe: song.likedByUsers?.includes(userId) || false,
//           tags: song.tags || [],
//           audioFileUrl: audioUrl || song.audioFileUrl,
//           streamAudioFileUrl: audioUrl || song.streamAudioFileUrl,
//           artwork: artworkUrl || fallbackArtwork,
//           artworkPresignedUrl: artworkUrl || song.artworkPresignedUrl || fallbackArtwork,
//           tempo: song.tempo,
//           key: song.key,
//           keyConfidence: song.keyConfidence,
//           mode: song.mode,
//           timeSignature: song.timeSignature,
//           beats: song.beats || [],
//           featuringArtist: song.featuringArtist || [],
//           trackNumber: song.trackNumber,
//           createdAt: song.createdAt,
//           trendingScore: song.trendingScore || 0,
//           lastPlayedAt: song.lastPlayedAt,
//           artist: song.artist ? {
//             _id: song.artist._id,
//             id: song.artist._id,
//             fullName: song.artist.fullName,
//             artistAka: song.artist.artistAka,
//             profileImage: song.artist.profileImage,
//             coverImage: song.artist.coverImage,
//             country: song.artist.country,
//             genre: song.artist.genre || [],
//             bio: song.artist.bio,
//           } : null,
//           album: song.album ? {
//             _id: song.album._id,
//             id: song.album._id,
//             title: song.album.title,
//             albumCoverImage: song.album.albumCoverImage,
//             releaseDate: song.album.releaseDate,
//             createdAt: song.album.createdAt
//           } : null,
//           __typename: 'Song'
//         };
//       }));
      
//       console.log('✅ Fallback succeeded, returning songs');
//       return result;
//     } catch (fallbackError) {
//       console.error('❌ Fallback also failed:', fallbackError);
//       throw new Error(`Failed to fetch songs for artist ${artistId}. Please try again later.`);
//     }
//   }
// };











export const getArtistSongs = async (_, { artistId }, context) => {
  console.log('🎵 ==================== getArtistSongs START ====================');

  console.log('📥 Input:', { 
    artistId, 
    artistIdType: typeof artistId,
    hasUser: !!context?.user,
    userId: context?.user?._id || 'no-user',
    userType: context?.user?.constructor?.name || 'unknown'
  });



  // Validate artistId
  if (!artistId) {
    console.error('❌ artistId is required but was:', artistId);
    throw new Error('artistId is required');
  }
  
  if (typeof artistId !== 'string') {
    console.error('❌ artistId must be a string, got:', typeof artistId, 'value:', artistId);
    throw new Error('artistId must be a string');
  }


  const userId = context?.user?._id || null;
  const key = ARTIST_SONGS(artistId);
  
  let client;
  try {
    client = await getRedis();
  } catch (redisError) {
    console.warn('⚠️ Redis client error, proceeding without cache:', redisError.message);
    client = null;
  }

  let songs = [];

  try {
    // 1. Try Redis cache
    if (client) {
      const songIds = await client.zRange(key, 0, 19, { REV: true });
      
      if (songIds && songIds.length > 0) {
        console.log(`🎯 Cache hit: Found ${songIds.length} song IDs in Redis`);
        
        const mongoQuery = {
          _id: { $in: songIds },
          visibility: 'public',
          artist: artistId
        };
        
        songs = await Song.find(mongoQuery)
          .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
          .populate('album', 'title albumCoverImage releaseDate')
          .lean();
        
        console.log(`📊 Database returned ${songs.length} songs from cached IDs`);
        
        // Sort songs in the same order as Redis results
        const songMap = new Map(songs.map(song => [song._id.toString(), song]));
        songs = songIds
          .map(id => songMap.get(id))
          .filter(song => song);
        
        console.log(`📊 After sorting: ${songs.length} songs remain`);
      } else {
        console.log('❌ Cache miss for artist', artistId);
      }
    }

    // 2. If Redis cache miss or empty, fallback to database
    if (songs.length === 0) {
      console.log('📝 Fetching songs directly from database...');
      
      const mongoQuery = {
        artist: artistId,
        visibility: 'public'
      };
      
      songs = await Song.find(mongoQuery)
        .populate('artist', 'fullName artistAka profileImage coverImage country genre bio')
        .populate('album', 'title albumCoverImage releaseDate')
        .select('-copyrightSettings -monetization')
        .sort({ playCount: -1, releaseDate: -1 })
        .limit(20)
        .lean();
      
      console.log(`📊 Database returned ${songs.length} songs`);
      
      // Cache the results in Redis for 1 hour
      if (client && songs.length > 0) {
        console.log(`💾 Caching ${songs.length} songs to Redis for 1 hour...`);
        const pipeline = client.multi();
        
        songs.forEach((song, index) => {
          const score = song.playCount || 0;
          const value = song._id.toString();
          pipeline.zAdd(key, { score, value });
          if (index < 3) {
            console.log(`  ${index + 1}. Adding song ${value} with score ${score}`);
          }
        });
        
        if (songs.length > 3) {
          console.log(`  ... and ${songs.length - 3} more songs`);
        }
        
        pipeline.expire(key, 3600);
        
        try {
          await pipeline.exec();
          console.log(`✅ Successfully cached ${songs.length} songs`);
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache songs:', cacheError.message);
        }
      }
    }

    // 3. Add user-specific data (likedByMe) and transform response
    if (songs.length > 0) {
      console.log(`👤 Processing user-specific data for ${userId ? 'logged-in user' : 'guest'}`);
      
      let likedSongIds = new Set();
      if (userId && songs.length > 0) {
        console.log(`🔍 Checking likes for user ${userId} across ${songs.length} songs...`);
        const userLikes = await Song.find({
          _id: { $in: songs.map(s => s._id) },
          likedByUsers: userId
        })
        .select('_id')
        .lean();
        
        likedSongIds = new Set(userLikes.map(like => like._id.toString()));
        console.log(`❤️ User has liked ${likedSongIds.size} of these songs`);
      }
      
      console.log(`🔄 Transforming ${songs.length} songs for GraphQL response...`);
      
      // Transform songs - RETURNING RAW DATA WITHOUT URL MAPPING
      songs = songs.map((song, index) => {
        const idStr = song._id ? String(song._id) : (song.id ? String(song.id) : '');
        
        // Get fallback artwork from various sources
        const fallbackArtwork =
          song.artwork ||
          song.album?.albumCoverImage ||
          song.artist?.coverImage ||
          song.artist?.profileImage ||
          null;

        const transformed = {
          _id: song._id,
          id: idStr,
          title: song.title,
          genre: song.genre,
          mood: song.mood || [],
          subMoods: song.subMoods || [],
          producer: song.producer || [],
          composer: song.composer || [],
          label: song.label,
          duration: song.duration,
          releaseDate: song.releaseDate,
          lyrics: song.lyrics,
          playCount: song.playCount || 0,
          downloadCount: song.downloadCount || 0,
          likesCount: song.likedByUsers?.length || 0,
          shareCount: song.shareCount || 0,
          likedByMe: userId ? likedSongIds.has(song._id.toString()) : false,
          tags: song.tags || [],
          
          // RETURN RAW URLS - CLIENT WILL REQUEST PRESIGNED URLS LATER
          audioFileUrl: song.audioFileUrl || song.audioUrl,
          streamAudioFileUrl: song.streamAudioFileUrl ,
          artwork: song.artwork,  // Raw artwork URL/pointer
          
          tempo: song.tempo,
          key: song.key,
          keyConfidence: song.keyConfidence,
          mode: song.mode,
          timeSignature: song.timeSignature,
          beats: song.beats || [],
          featuringArtist: song.featuringArtist || [],
          trackNumber: song.trackNumber,
          createdAt: song.createdAt,
          trendingScore: song.trendingScore || 0,
          lastPlayedAt: song.lastPlayedAt,
          
          // Populated artist - return raw image URLs
          artist: song.artist ? {
            _id: song.artist._id,
            id: song.artist._id,
            fullName: song.artist.fullName,
            artistAka: song.artist.artistAka,
            profileImage: song.artist.profileImage,  // Raw URL
            coverImage: song.artist.coverImage,      // Raw URL
            country: song.artist.country,
            genre: song.artist.genre || [],
            bio: song.artist.bio,
          } : null,
          
          // Populated album - return raw image URLs
          album: song.album ? {
            _id: song.album._id,
            id: song.album._id,
            title: song.album.title,
            albumCoverImage: song.album.albumCoverImage,  // Raw URL
            releaseDate: song.album.releaseDate,
            createdAt: song.album.createdAt
          } : null,
          
          __typename: 'Song'
        };
        
        // Log first 2 songs for debugging
        if (index < 2) {
          console.log(`📋 Sample transformed song ${index + 1}:`, {
            id: idStr ? `${idStr.substring(0, 10)}...` : 'none',
            title: transformed.title,
            hasArtist: !!transformed.artist,
            hasAlbum: !!transformed.album,
            playCount: transformed.playCount,
            artwork: transformed.artwork ? 'Present' : 'Missing',
            audioUrl: transformed.audioFileUrl ? 'Present' : 'Missing'
          });
        }
        
        return transformed;
      });
    } else {
      console.log('📭 No songs found for artist', artistId);
    }

    console.log(`✅ Returning ${songs.length} songs for artist ${artistId}`);
    console.log('🎵 ==================== getArtistSongs END ====================\n');
    return songs;

  } catch (error) {
    console.error('❌ ERROR in getArtistSongs:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      artistId
    });
    
    // Last resort: try without Redis and with minimal fields
    try {
      console.log('🔄 Attempting fallback query...');
      const fallbackSongs = await Song.find({
        artist: artistId,
        visibility: 'public'
      })
      .populate('artist', 'fullName artistAka profileImage')
      .populate('album', 'title albumCoverImage')
      .sort({ playCount: -1 })
      .limit(20)
      .lean();

      console.log(`🔄 Fallback found ${fallbackSongs.length} songs`);
      
      const result = fallbackSongs.map(song => {
        const idStr = song._id ? String(song._id) : (song.id ? String(song.id) : '');
        const fallbackArtwork =
          song.artwork ||
          song.album?.albumCoverImage ||
          song.artist?.coverImage ||
          song.artist?.profileImage ||
          null;
        
        return {
          _id: song._id,
          id: idStr,
          title: song.title,
          genre: song.genre,
          mood: song.mood || [],
          subMoods: song.subMoods || [],
          producer: song.producer || [],
          composer: song.composer || [],
          label: song.label,
          duration: song.duration,
          releaseDate: song.releaseDate,
          lyrics: song.lyrics,
          playCount: song.playCount || 0,
          downloadCount: song.downloadCount || 0,
          likesCount: song.likedByUsers?.length || 0,
          shareCount: song.shareCount || 0,
          likedByMe: song.likedByUsers?.includes(userId) || false,
          tags: song.tags || [],
          audioFileUrl: song.audioFileUrl || song.audioUrl,
          streamAudioFileUrl: song.streamAudioFileUrl || song.audioFileUrl || song.audioUrl,
          artwork: song.artwork || fallbackArtwork,
          tempo: song.tempo,
          key: song.key,
          keyConfidence: song.keyConfidence,
          mode: song.mode,
          timeSignature: song.timeSignature,
          beats: song.beats || [],
          featuringArtist: song.featuringArtist || [],
          trackNumber: song.trackNumber,
          createdAt: song.createdAt,
          trendingScore: song.trendingScore || 0,
          lastPlayedAt: song.lastPlayedAt,
          artist: song.artist ? {
            _id: song.artist._id,
            id: song.artist._id,
            fullName: song.artist.fullName,
            artistAka: song.artist.artistAka,
            profileImage: song.artist.profileImage,
            coverImage: song.artist.coverImage,
            country: song.artist.country,
            genre: song.artist.genre || [],
            bio: song.artist.bio,
          } : null,
          album: song.album ? {
            _id: song.album._id,
            id: song.album._id,
            title: song.album.title,
            albumCoverImage: song.album.albumCoverImage,
            releaseDate: song.album.releaseDate,
            createdAt: song.album.createdAt
          } : null,
          __typename: 'Song'
        };
      });
      
      console.log('✅ Fallback succeeded, returning songs');
      return result;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(`Failed to fetch songs for artist ${artistId}. Please try again later.`);
    }
  }
};