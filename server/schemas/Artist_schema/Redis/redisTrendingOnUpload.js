import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";

import {Song} from "../../../models/Artist/index_artist.js"
import { trendIndexZSet } from "./keys.js";
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
      console.log(`📈 Added ${songId} to trending (had space)`);
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
        console.log(`🔄 Replaced oldest 1000-scored song ${oldestSongId} with new song ${songId}`);
      } else {
        // All songs have > 1000 score - new song doesn't enter trending
        console.log(`❌ ${songId} not added to trending - all songs have > 1000 score`);
      }
    }
    
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
    console.log(`🎵 Found ${songs.length} songs to initialize trending`);
    
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
    console.log(`✅ Updated trending scores in MongoDB for ${songs.length} songs`);
    
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
      console.log(`🚀 Initialized Redis trending set with ${redisCommands.length} most recent songs`);
    }
    
    console.log(`🎯 Trending system initialized!`);
    console.log(`📊 MongoDB: ${songs.length} songs with trending scores`);
    console.log(`🔥 Redis: ${redisCommands.length} songs in trending set`);
    
  } catch (error) {
    console.error('❌ Failed to initialize trending scores:', error);
    throw error;
  }
};