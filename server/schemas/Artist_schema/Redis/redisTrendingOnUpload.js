import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";

import {Song} from "../../../models/Artist/index_artist.js"
import { trendIndexZSet, TRENDING_SONGS_CACHE_KEY } from "./keys.js";
import { INITIAL_RECENCY_SCORE } from "./keys.js";
import { TRENDING_SLOTS } from "./keys.js";






export const addSongToTrendingOnUpload = async (songId) => {
  const client = await getRedis();
  
  try {
    const currentCount = await client.zCard(trendIndexZSet);
    
    if (currentCount < TRENDING_SLOTS) {
      // Trending has space - add directly
      await client.zAdd(trendIndexZSet, {
        score: INITIAL_RECENCY_SCORE,
        value: songId.toString()
      });
    } else {
      // Trending is full - check if there are any songs with exactly 1000 score
      const allTrendingSongs = await client.zRange(trendIndexZSet, 0, -1, {
        WITHSCORES: true
      });
      
      // Find songs with exactly 1000 score
      const songsWith1000 = [];
      for (let i = 0; i < allTrendingSongs.length; i += 2) {
        if (parseFloat(allTrendingSongs[i + 1]) === INITIAL_RECENCY_SCORE) {
          songsWith1000.push(allTrendingSongs[i]);
        }
      }
      
      if (songsWith1000.length > 0) {
        // There are songs with 1000 score - remove the oldest one
        let oldestSongId = songsWith1000[0];
        let oldestTime = await getSongCreatedAt(oldestSongId);
        
        for (let i = 1; i < songsWith1000.length; i++) {
          const currentTime = await getSongCreatedAt(songsWith1000[i]);
          if (currentTime < oldestTime) {
            oldestTime = currentTime;
            oldestSongId = songsWith1000[i];
          }
        }
        
        await client.zRem(trendIndexZSet, oldestSongId);
        await client.zAdd(trendIndexZSet, {
          score: INITIAL_RECENCY_SCORE,
          value: songId.toString()
        });
      } else {
        // All songs have > 1000 score - new song doesn't enter trending
      }
    }
    await client.del(TRENDING_SONGS_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to add song to trending on upload:', error);
  }
};




// 


export const initializeAllTrendingScores = async () => {
  try {
    const client = await getRedis();
    
    // Clear existing trending set
    await client.del(trendIndexZSet);
    
    // Get all songs from MongoDB
    const songs = await Song.find({}).select('_id createdAt').lean();
    
    // Update MongoDB with trending scores
    const bulkOperations = songs.map(song => ({
      updateOne: {
        filter: { _id: song._id },
        update: { 
          $set: { trendingScore: INITIAL_RECENCY_SCORE } 
        }
      }
    }));
    
    await Song.bulkWrite(bulkOperations);
    
    // Add to Redis trending set (limited to 20 most recent)
    const sortedSongs = songs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Most recent first
      .slice(0, TRENDING_SLOTS); // Take only top 20 most recent
    
    const redisCommands = sortedSongs.map(song => ({
      score: INITIAL_RECENCY_SCORE,
      value: song._id.toString()
    }));
    
    if (redisCommands.length > 0) {
      await client.zAdd(trendIndexZSet, redisCommands);
    }
    
    
  } catch (error) {
    console.error('❌ Failed to initialize trending scores:', error);
    throw error;
  }
};
