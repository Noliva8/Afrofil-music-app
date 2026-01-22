import crypto from "crypto";
import { Song } from "../models/User/user_index.js";
import { getRedis } from "../utils/AdEngine/redis/redisClient.js";

const TIME_PROFILES = {
  morning: { label: "Morning Energy", energy: 0.8, tempo: "fast", mood: "positive" },
  afternoon: { label: "Afternoon Flow", energy: 0.65, tempo: "medium", mood: "balanced" },
  evening: { label: "Evening Chill", energy: 0.45, tempo: "slow", mood: "calm" },
  night: { label: "Night Wind Down", energy: 0.3, tempo: "slow", mood: "relaxed" },
};

const determineTimeSlice = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

const buildFeatureVector = (energy, tempo, mood) => [energy, tempo, mood];

const scoreTrack = (song, profile) => {
  const tempoScores = { fast: 1, medium: 0.6, varied: 0.7, slow: 0.3 };
  const moodScores = { positive: 1, balanced: 0.7, calm: 0.5, relaxed: 0.4 };

  const energy = profile.energy ?? 0.5;
  const tempoWeight = tempoScores[profile.tempo] ?? 0.5;
  const moodWeight = moodScores[profile.mood] ?? 0.5;

  const score = (energy * 0.6 + tempoWeight * 0.25 + moodWeight * 0.15) / 1;
  return Number(score.toFixed(3));
};

const normalizeString = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const computeUserContextMatch = (song, context) => {
  if (!context) return 0;

  let matchScore = 0;
  const normalizedMoods = ensureArray(song.mood).map(normalizeString).filter(Boolean);
  const normalizedSubMoods = ensureArray(song.subMoods).map(normalizeString).filter(Boolean);
  const normalizedGenres = ensureArray(song.genre)
    .map((genre) => (typeof genre === "object" ? genre?.name : genre))
    .map(normalizeString)
    .filter(Boolean);

  const contextMoods = (context.moods ?? []).map(normalizeString).filter(Boolean);
  const contextSubMoods = (context.subMoods ?? []).map(normalizeString).filter(Boolean);
  const contextGenres = (context.genres ?? []).map(normalizeString).filter(Boolean);

  const hasMoodOverlap = normalizedMoods.some((m) => contextMoods.includes(m));
  const hasSubMoodOverlap = normalizedSubMoods.some((m) => contextSubMoods.includes(m));
  const hasGenreOverlap = normalizedGenres.some((g) => contextGenres.includes(g));

  if (hasMoodOverlap) matchScore += 0.25;
  if (hasSubMoodOverlap) matchScore += 0.15;
  if (hasGenreOverlap) matchScore += 0.25;

  const tempoValue = Number(song.tempo);
  if (context.tempoRange && !Number.isNaN(tempoValue)) {
    const { min, max } = context.tempoRange;
    if (typeof min === "number" && typeof max === "number" && tempoValue >= min && tempoValue <= max) {
      matchScore += 0.2;
    }
  }

  if (context.key && song.key && normalizeString(song.key) === normalizeString(context.key)) {
    matchScore += 0.1;
  }

  if (typeof context.mode === "number" && typeof song.mode === "number" && song.mode === context.mode) {
    matchScore += 0.1;
  }

  return Number(Math.min(matchScore, 1).toFixed(3));
};

const getTrackArtwork = (song) =>
  song.artwork || song.cover || song.albumCoverImage || song.album?.albumCoverImage || null;

const formatDurationLabel = (seconds) => {
  const totalSeconds = Number(seconds) || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

const normalizeGenre = (genre) => {
  if (!genre) return null;
  if (typeof genre === "string") return genre;
  if (genre?.name) return genre.name;
  return null;
};

const hashContext = (context) => {
  if (!context) return "global";
  return crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 16);
};

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour





// export const buildDailyMix = async ({ overrideTime, limit = 24, userContext } = {}) => {
//   const profileKey = overrideTime || determineTimeSlice();
//   const profile = TIME_PROFILES[profileKey] ?? TIME_PROFILES.morning;
//   const cacheKey = `home:daily-mix:${profileKey}:${hashContext(userContext)}`;
  
//   let redisClient = null;
  
//   // Try cache first
//   if (!overrideTime) {
//     try {
//       redisClient = await getRedis();
//       const cached = await redisClient.get(cacheKey);
//       if (cached) {
//         console.log('Returning cached daily mix');
//         const parsed = JSON.parse(cached);
//         parsed.generatedAt = parsed.generatedAt ? new Date(parsed.generatedAt) : new Date();
//         return parsed;
//       }
//     } catch (err) {
//       redisClient = null;
//       console.warn("Daily mix cache miss:", err?.message);
//     }
//   }

//   console.time('buildDailyMix');
  
//   try {
//     // OPTIMIZED QUERY: Use aggregation pipeline for efficient filtering & sorting
//     const aggregationPipeline = [
//       // Stage 1: Filter by playCount to reduce dataset (optimization)
//       {
//         $match: {
//           playCount: { $gt: 0 } // Only songs that have been played
//         }
//       },
      
//       // Stage 2: Add a computed score for sorting
//       {
//         $addFields: {
//           // Create a sort score combining playCount and recency
//           sortScore: {
//             $add: [
//               { $divide: ["$playCount", 1000] }, // Normalize playCount
//               { 
//                 $divide: [
//                   { $subtract: [new Date(), "$createdAt"] },
//                   1000 * 60 * 60 * 24 * 30 // Age in months
//                 ]
//               }
//             ]
//           }
//         }
//       },
      
//       // Stage 3: Sort by computed score
//       {
//         $sort: { sortScore: -1 }
//       },
      
//       // Stage 4: Limit before populating (CRITICAL for performance)
//       {
//         $limit: limit * 3 // Get more songs to filter later
//       },
      
//       // Stage 5: Populate artist
//       {
//         $lookup: {
//           from: "artists", // Make sure this matches your collection name
//           localField: "artist",
//           foreignField: "_id",
//           as: "artistData"
//         }
//       },
      
//       // Stage 6: Unwind artist (handle single artist per song)
//       {
//         $unwind: {
//           path: "$artistData",
//           preserveNullAndEmptyArrays: true
//         }
//       },
      
//       // Stage 7: Project only needed fields
//       {
//         $project: {
//           _id: 1,
//           title: 1,
//           playCount: 1,
//           createdAt: 1,
//           mood: 1,
//           subMoods: 1,
//           genre: 1,
//           tempo: 1,
//           key: 1,
//           mode: 1,
//           durationSeconds: 1,
//           duration: 1,
//           audioUrl: 1,
//           streamAudioFileUrl: 1,
//           label: 1,
//           artwork: 1,
//           cover: 1,
//           albumCoverImage: 1,
//           albumTitle: 1,
//           artistId: "$artist",
//           artistName: 1,
//           artistProfileImage: 1,
//           "artistData.artistAka": 1,
//           "artistData.profileImage": 1,
//           "artistData.country": 1,
//           "album._id": 1,
//           "album.title": 1,
//           "album.albumCoverImage": 1
//         }
//       }
//     ];

//     const songs = await Song.aggregate(aggregationPipeline);
//     console.timeLog('buildDailyMix', `Fetched ${songs.length} songs`);
    
//     // If no songs with playCount > 0, fall back to recent songs
//     if (!songs.length) {
//       console.log('No songs with playCount > 0, fetching recent songs');
//       const recentSongs = await Song.find({})
//         .sort({ createdAt: -1 })
//         .limit(limit * 2)
//         .populate('artist', 'artistAka profileImage country')
//         .populate('album', 'title albumCoverImage')
//         .lean()
//         .exec();
      
//       songs.push(...recentSongs);
//     }

//     console.timeLog('buildDailyMix', 'Starting track processing');
    
//     // Process and score tracks
//     const tracks = songs
//       .map((song) => {
//         try {
//           const baseScore = scoreTrack(song, profile);
//           const playScore = Math.min((song.playCount ?? 0) / 100000, 1);
//           const contextScore = computeUserContextMatch(song, userContext);
//           const finalScore = Number(((baseScore + playScore + contextScore) / 3).toFixed(3));

//           const moodList = ensureArray(song.mood);
//           const subMoodList = ensureArray(song.subMoods);
//           const genreList = ensureArray(song.genre).map(normalizeGenre).filter(Boolean);
//           const durationSeconds = Number(song.durationSeconds ?? song.duration ?? 0);
          
//           // Handle artist data from aggregation or population
//           const artistData = song.artistData || song.artist;
//           const artistName = artistData?.artistAka || song.artistName || "Afrofeel";
//           const artistId = song.artistId || song.artist?._id || null;
//           const albumData = song.album || {};
//           const albumId = albumData._id || null;
          
//           const albumPayload = albumId
//             ? {
//                 _id: albumId,
//                 title: albumData.title || song.albumTitle || "Single",
//                 albumCoverImage: albumData.albumCoverImage || song.albumCoverImage || null,
//               }
//             : null;
            
//           const artistPayload = {
//             _id: artistId,
//             artistAka: artistName,
//             profileImage: artistData?.profileImage || song.artistProfileImage || null,
//             country: artistData?.country || null,
//           };

//           const streamAudioFileUrl =
//             song.streamAudioFileUrl || song.audioUrl || song.audioFileUrl || song.streamUrl || null;

//           return {
//             _id: song._id,
//             id: String(song._id),
//             songId: song._id,
//             title: song.title || "Untitled",
//             artist: artistName,
//             artistName,
//             artistId,
//             artistProfile: artistPayload,
//             albumId,
//             album: albumPayload,
//             genre: genreList,
//             mood: moodList,
//             subMoods: subMoodList,
//             score: finalScore,
//             artwork: getTrackArtwork(song),
//             energy: profile.energy,
//             tempo: song.tempo || profile.tempo,
//             key: song.key || null,
//             mode: typeof song.mode === "number" ? song.mode : null,
//             plays: Number(song.playCount ?? song.plays ?? 0),
//             duration: formatDurationLabel(durationSeconds),
//             durationSeconds,
//             streamAudioFileUrl,
//             audioUrl: song.audioUrl || null,
//             label: song.label || null,
//           };
//         } catch (error) {
//           console.error('Error processing song:', song._id, error.message);
//           return null;
//         }
//       })
//       .filter(track => track !== null && track.score > 0) // Filter out null and low scores
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit); // Final limit

//     console.timeLog('buildDailyMix', 'Track processing complete');

//     const payload = {
//       profileKey,
//       profileLabel: profile.label,
//       profile,
//       tracks,
//       generatedAt: new Date(),
//       userContext: userContext ?? null,
//     };

//     // Cache the result
//     if (redisClient) {
//       try {
//         await redisClient.set(cacheKey, JSON.stringify(payload), { EX: CACHE_TTL_SECONDS });
//         console.log('Daily mix cached successfully');
//       } catch (err) {
//         console.warn("Failed to cache daily mix:", err?.message);
//       }
//     }

//     console.timeEnd('buildDailyMix');
//     return payload;
    
//   } catch (error) {
//     console.error('Error building daily mix:', error);
//     console.timeEnd('buildDailyMix');
    
//     // Return fallback response instead of throwing
//     return {
//       profileKey,
//       profileLabel: profile.label,
//       profile,
//       tracks: [],
//       generatedAt: new Date(),
//       userContext: userContext ?? null,
//       error: false,
//       message: "Unable to generate mix at this time"
//     };
//   }
// };


export const buildDailyMix = async ({ overrideTime, limit = 24, userContext } = {}) => {
  console.log('🚀 START buildDailyMix');
  const profileKey = overrideTime || determineTimeSlice();
  const profile = TIME_PROFILES[profileKey] ?? TIME_PROFILES.morning;
  console.log(`📊 Profile: ${profileKey} (${profile.label})`);
  
  const cacheKey = `home:daily-mix:${profileKey}:${hashContext(userContext)}`;
  
  let redisClient = null;
  
  // Try cache first
  if (!overrideTime) {
    try {
      redisClient = await getRedis();
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('✅ Returning cached daily mix');
        const parsed = JSON.parse(cached);
        parsed.generatedAt = parsed.generatedAt ? new Date(parsed.generatedAt) : new Date();
        return parsed;
      }
    } catch (err) {
      redisClient = null;
      console.warn("⚠️ Daily mix cache miss:", err?.message);
    }
  }

  console.time('buildDailyMix');
  
  try {
    // FIRST: Check what's available
    console.time('dbCheck');
    const totalSongs = await Song.countDocuments();
    const songsWithPlays = await Song.countDocuments({ playCount: { $gt: 0 } });
    console.timeEnd('dbCheck');
    
    console.log('📊 Database stats:', {
      totalSongs,
      songsWithPlays,
      hasPlays: songsWithPlays > 0
    });
    
    let songs = [];
    
    if (songsWithPlays > 0) {
      // Try SIMPLER aggregation first
      console.time('aggregation');
      try {
        const aggregationPipeline = [
          // Match songs with plays
          {
            $match: {
              playCount: { $gt: 0 }
            }
          },
          // Sort by playCount (simple and fast)
          {
            $sort: { playCount: -1 }
          },
          // Limit results
          {
            $limit: limit * 3
          },
          // Lookup artist - CHECK COLLECTION NAME
          {
            $lookup: {
              from: "artists", // Try "Artist" or "artist" if this fails
              localField: "artist",
              foreignField: "_id",
              as: "artistData"
            }
          },
          // Unwind artist (optional)
          {
            $unwind: {
              path: "$artistData",
              preserveNullAndEmptyArrays: true
            }
          }
        ];
        
        songs = await Song.aggregate(aggregationPipeline);
        console.timeEnd('aggregation');
        console.log(`✅ Aggregation returned ${songs.length} songs`);
        
      } catch (aggError) {
        console.error('❌ Aggregation failed:', aggError.message);
        console.log('🔄 Falling back to simple find query...');
        
        // Fallback to simple query
        songs = await Song.find({ playCount: { $gt: 0 } })
          .sort({ playCount: -1 })
          .limit(limit * 3)
          .populate('artist', 'artistAka profileImage country')
          .lean();
      }
    }
    
    // If still no songs, get recent songs
    if (!songs.length) {
      console.log('⚠️ No popular songs, fetching recent songs');
      console.time('recentSongs');
      songs = await Song.find({})
        .sort({ createdAt: -1 })
        .limit(limit * 2)
        .populate('artist', 'artistAka profileImage country')
        .lean();
      console.timeEnd('recentSongs');
    }
    
    console.log(`🎯 Total songs fetched: ${songs.length}`);
    
    if (!songs.length) {
      console.log('❌ NO SONGS IN DATABASE!');
      console.timeEnd('buildDailyMix');
      return {
        profileKey,
        profileLabel: profile.label,
        profile,
        tracks: [],
        generatedAt: new Date(),
        userContext: userContext ?? null,
        error: false,
        message: "No songs available in the database"
      };
    }

    console.time('processing');
    console.log('🔄 Processing songs...');
    
    // Process and score tracks
    const tracks = songs
      .map((song) => {
        try {
          // Ensure song has basic data
          if (!song || !song._id) {
            console.warn('⚠️ Invalid song data:', song);
            return null;
          }
          
          const baseScore = scoreTrack(song, profile);
          const playScore = Math.min((song.playCount ?? 0) / 100000, 1);
          const contextScore = computeUserContextMatch(song, userContext);
          const finalScore = Number(((baseScore + playScore + contextScore) / 3).toFixed(3));

          const moodList = ensureArray(song.mood);
          const subMoodList = ensureArray(song.subMoods);
          const genreList = ensureArray(song.genre).map(normalizeGenre).filter(Boolean);
          const durationSeconds = Number(song.durationSeconds ?? song.duration ?? 0);
          
          // Handle artist data - check both aggregation and populate formats
          let artistData = song.artistData || song.artist;
          const artistName = artistData?.artistAka || 
                            artistData?.name || 
                            song.artistName || 
                            "Afrofeel Artist";
          
          const artistId = song.artist?._id || 
                          song.artistId || 
                          artistData?._id || 
                          null;
          
          // Handle album data
          let albumData = song.album || {};
          const albumId = albumData._id || null;
          
          const albumPayload = albumId ? {
            _id: albumId,
            title: albumData.title || song.albumTitle || "Single",
            albumCoverImage: albumData.albumCoverImage || 
                           song.albumCoverImage || 
                           null,
          } : null;
          
          const artistPayload = {
            _id: artistId,
            artistAka: artistName,
            profileImage: artistData?.profileImage || 
                         song.artistProfileImage || 
                         null,
            country: artistData?.country || null,
          };

          const streamAudioFileUrl = song.streamAudioFileUrl || 
                                    song.audioUrl || 
                                    song.audioFileUrl || 
                                    song.streamUrl || 
                                    null;

          return {
            _id: song._id,
            id: String(song._id),
            songId: song._id,
            title: song.title || "Untitled Track",
            artist: artistName,
            artistName,
            artistId,
            artistProfile: artistPayload,
            albumId,
            album: albumPayload,
            genre: genreList,
            mood: moodList,
            subMoods: subMoodList,
            score: finalScore,
            artwork: getTrackArtwork(song),
            energy: profile.energy,
            tempo: song.tempo || profile.tempo,
            key: song.key || null,
            mode: typeof song.mode === "number" ? song.mode : null,
            plays: Number(song.playCount ?? song.plays ?? 0),
            duration: formatDurationLabel(durationSeconds),
            durationSeconds,
            streamAudioFileUrl,
            audioUrl: song.audioUrl || null,
            label: song.label || null,
          };
        } catch (error) {
          console.error('❌ Error processing song:', song?._id, error.message);
          return null;
        }
      })
      .filter(track => {
        // Filter criteria
        if (!track) return false;
        if (track.score <= 0) return false;
        if (!track.title || track.title === "Untitled Track") return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.timeEnd('processing');
    console.log(`✅ Processed ${tracks.length} tracks`);

    // Add fallback if no tracks
    if (!tracks.length) {
      console.log('⚠️ No valid tracks after processing, adding fallback');
      tracks.push({
        _id: 'fallback-1',
        id: 'fallback-1',
        songId: 'fallback-1',
        title: 'Welcome to Afrofeel',
        artist: 'Afrofeel',
        artistName: 'Afrofeel',
        artistId: null,
        artistProfile: null,
        albumId: null,
        album: null,
        genre: ['afrobeats'],
        mood: ['happy'],
        subMoods: [],
        score: 0.9,
        artwork: null,
        energy: profile.energy,
        tempo: profile.tempo,
        key: null,
        mode: null,
        plays: 100,
        duration: '3:45',
        durationSeconds: 225,
        streamAudioFileUrl: null,
        audioUrl: null,
        label: 'Afrofeel'
      });
    }

    const payload = {
      profileKey,
      profileLabel: profile.label,
      profile,
      tracks,
      generatedAt: new Date(),
      userContext: userContext ?? null,
    };

    // Cache the result
    if (redisClient && tracks.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(payload), { EX: CACHE_TTL_SECONDS });
        console.log('💾 Daily mix cached successfully');
      } catch (err) {
        console.warn("⚠️ Failed to cache daily mix:", err?.message);
      }
    }

    console.timeEnd('buildDailyMix');
    console.log(`🎉 SUCCESS: Returning mix with ${tracks.length} tracks`);
    
    return payload;
    
  } catch (error) {
    console.error('💥 CRITICAL Error in buildDailyMix:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.timeEnd('buildDailyMix');
    
    // Return minimal valid response
    return {
      profileKey,
      profileLabel: profile.label,
      profile,
      tracks: [{
        _id: 'error-fallback',
        title: 'Daily Mix Unavailable',
        artist: 'System',
        score: 0.5,
        duration: '0:00',
        plays: 0
      }],
      generatedAt: new Date(),
      userContext: userContext ?? null,
      error: false,
      message: "Mix service is temporarily unavailable"
    };
  }
};