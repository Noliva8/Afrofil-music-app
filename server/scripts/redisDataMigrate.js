// scripts/migrateToRedis.js
import { getRedis } from "../utils/AdEngine/redis/redisClient.js";
import { artistCreateRedis } from "../schemas/Artist_schema/Redis/artistCreateRedis.js";
import { albumCreateRedis } from "../schemas/Artist_schema/Redis/albumCreateRedis.js";
import {Artist, Album,Song} from "../models/Artist/index_artist.js",

import { withTimeout } from "../schemas/Artist_schema/Redis/songCreateRedis.js";
import { createSongIndex } from "../schemas/Artist_schema/Redis/songCreateRedis.js";
import { createSongRedis } from "../schemas/Artist_schema/Redis/songCreateRedis.js";

class DataMigrator {
  constructor() {
    this.redis = null;
    this.batchSize = 100; // Process in batches to avoid memory issues
    this.stats = {
      artists: { total: 0, migrated: 0, errors: 0 },
      albums: { total: 0, migrated: 0, errors: 0 },
      songs: { total: 0, migrated: 0, errors: 0 }
    };
  }

  async initialize() {
    try {
      this.redis = await getRedis();
      console.log('✅ Redis client initialized');
      
      // Test connection
      await this.redis.ping();
      console.log('✅ Redis connection successful');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      return false;
    }
  }

  async migrateArtists() {
    console.log('\n🎤 Starting artist migration...');
    
    try {
      // Count total artists
      this.stats.artists.total = await Artist.countDocuments();
      console.log(`📊 Total artists to migrate: ${this.stats.artists.total}`);

      if (this.stats.artists.total === 0) {
        console.log('ℹ️ No artists found to migrate');
        return;
      }

      // Process in batches
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const artists = await Artist.find()
          .skip(skip)
          .limit(this.batchSize)
          .populate('songs', '_id title')
          .populate('albums', '_id title')
          .populate('followers', '_id username')
          .lean();

        if (artists.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`🔄 Processing artists batch ${skip / this.batchSize + 1}...`);

        // Migrate artists in parallel with limited concurrency
        const migrationPromises = artists.map(async (artist) => {
          try {
            await artistCreateRedis(artist, { updateExisting: true });
            this.stats.artists.migrated++;
            return { success: true, artistId: artist._id };
          } catch (error) {
            this.stats.artists.errors++;
            console.error(`❌ Failed to migrate artist ${artist._id}:`, error.message);
            return { success: false, artistId: artist._id, error: error.message };
          }
        });

        // Process with limited concurrency to avoid overwhelming Redis
        const results = await this.processWithConcurrency(migrationPromises, 10);
        
        // Log batch progress
        const batchSuccess = results.filter(r => r.success).length;
        const batchErrors = results.filter(r => !r.success).length;
        console.log(`✅ Batch completed: ${batchSuccess} success, ${batchErrors} errors`);

        skip += this.batchSize;
        
        // Small delay between batches to avoid overwhelming the system
        if (hasMore) {
          await this.delay(100);
        }
      }

      console.log(`🎉 Artist migration completed: ${this.stats.artists.migrated} migrated, ${this.stats.artists.errors} errors`);

    } catch (error) {
      console.error('❌ Artist migration failed:', error);
    }
  }

  async migrateAlbums() {
    console.log('\n💿 Starting album migration...');
    
    try {
      // Count total albums
      this.stats.albums.total = await Album.countDocuments();
      console.log(`📊 Total albums to migrate: ${this.stats.albums.total}`);

      if (this.stats.albums.total === 0) {
        console.log('ℹ️ No albums found to migrate');
        return;
      }

      // Process in batches
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const albums = await Album.find()
          .skip(skip)
          .limit(this.batchSize)
          .populate('artist', 'artistAka profileImage')
          .populate('songs', '_id title duration')
          .lean();

        if (albums.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`🔄 Processing albums batch ${skip / this.batchSize + 1}...`);

        // Migrate albums in parallel
        const migrationPromises = albums.map(async (album) => {
          try {
            await albumCreateRedis(album, { updateExisting: true });
            this.stats.albums.migrated++;
            return { success: true, albumId: album._id };
          } catch (error) {
            this.stats.albums.errors++;
            console.error(`❌ Failed to migrate album ${album._id}:`, error.message);
            return { success: false, albumId: album._id, error: error.message };
          }
        });

        const results = await this.processWithConcurrency(migrationPromises, 10);
        
        const batchSuccess = results.filter(r => r.success).length;
        const batchErrors = results.filter(r => !r.success).length;
        console.log(`✅ Batch completed: ${batchSuccess} success, ${batchErrors} errors`);

        skip += this.batchSize;
        
        if (hasMore) {
          await this.delay(100);
        }
      }

      console.log(`🎉 Album migration completed: ${this.stats.albums.migrated} migrated, ${this.stats.albums.errors} errors`);

    } catch (error) {
      console.error('❌ Album migration failed:', error);
    }
  }

  async migrateSongs() {
    console.log('\n🎵 Starting song migration...');
    
    try {
      // Count total songs
      this.stats.songs.total = await Song.countDocuments();
      console.log(`📊 Total songs to migrate: ${this.stats.songs.total}`);

      if (this.stats.songs.total === 0) {
        console.log('ℹ️ No songs found to migrate');
        return;
      }

      // Process in batches
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const songs = await Song.find()
          .skip(skip)
          .limit(this.batchSize)
          .populate('artist', 'artistAka country')
          .populate('album', 'title')
          .lean();

        if (songs.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`🔄 Processing songs batch ${skip / this.batchSize + 1}...`);

        // Migrate songs in parallel (using your existing songCreateRedis function)
        const migrationPromises = songs.map(async (song) => {
          try {
            // Assuming you have a songCreateRedis function similar to artist/album
            await songCreateRedis(song, { updateExisting: true });
            this.stats.songs.migrated++;
            return { success: true, songId: song._id };
          } catch (error) {
            this.stats.songs.errors++;
            console.error(`❌ Failed to migrate song ${song._id}:`, error.message);
            return { success: false, songId: song._id, error: error.message };
          }
        });

        const results = await this.processWithConcurrency(migrationPromises, 10);
        
        const batchSuccess = results.filter(r => r.success).length;
        const batchErrors = results.filter(r => !r.success).length;
        console.log(`✅ Batch completed: ${batchSuccess} success, ${batchErrors} errors`);

        skip += this.batchSize;
        
        if (hasMore) {
          await this.delay(100);
        }
      }

      console.log(`🎉 Song migration completed: ${this.stats.songs.migrated} migrated, ${this.stats.songs.errors} errors`);

    } catch (error) {
      console.error('❌ Song migration failed:', error);
    }
  }

  // Helper function to process promises with concurrency control
  async processWithConcurrency(promises, concurrency) {
    const results = [];
    for (let i = 0; i < promises.length; i += concurrency) {
      const batch = promises.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ success: false, error: result.reason.message });
        }
      });
    }
    return results;
  }

  // Helper function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verify migration results
  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    try {
      // Verify artists
      const artistCount = await this.redis.zcard('index:artists:all');
      console.log(`🎤 Artists in Redis: ${artistCount} (MongoDB: ${this.stats.artists.total})`);

      // Verify albums
      const albumCount = await this.redis.zcard('index:albums:all');
      console.log(`💿 Albums in Redis: ${albumCount} (MongoDB: ${this.stats.albums.total})`);

      // Verify songs (if you have song indexes)
      try {
        const songCount = await this.redis.zcard('index:songs:all');
        console.log(`🎵 Songs in Redis: ${songCount} (MongoDB: ${this.stats.songs.total})`);
      } catch (error) {
        console.log('🎵 Song index not available yet');
      }

      // Test a few random keys
      const testArtist = await this.redis.keys('artist:*');
      const testAlbum = await this.redis.keys('album:*');
      
      console.log(`🔑 Sample keys - Artists: ${testArtist.length}, Albums: ${testAlbum.length}`);

      if (testArtist.length > 0) {
        const sampleArtist = await this.redis.get(testArtist[0]);
        console.log('✅ Sample artist key is accessible');
      }

      if (testAlbum.length > 0) {
        const sampleAlbum = await this.redis.get(testAlbum[0]);
        console.log('✅ Sample album key is accessible');
      }

    } catch (error) {
      console.error('❌ Verification failed:', error);
    }
  }

  // Clear existing Redis data (optional - use with caution!)
  async clearRedisData() {
    console.log('\n⚠️ Clearing existing Redis data...');
    
    try {
      // Delete all artist and album keys
      const artistKeys = await this.redis.keys('artist:*');
      const albumKeys = await this.redis.keys('album:*');
      const indexKeys = await this.redis.keys('index:*');

      const allKeys = [...artistKeys, ...albumKeys, ...indexKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(allKeys);
        console.log(`🗑️ Cleared ${allKeys.length} Redis keys`);
      } else {
        console.log('ℹ️ No existing keys to clear');
      }
    } catch (error) {
      console.error('❌ Failed to clear Redis data:', error);
    }
  }

  async runMigration(options = {}) {
    const { clearExisting = false, migrateSongs = false } = options;
    
    console.log('🚀 Starting MongoDB to Redis migration...');
    console.log('==========================================');

    if (!await this.initialize()) {
      return;
    }

    if (clearExisting) {
      await this.clearRedisData();
    }

    const startTime = Date.now();

    try {
      // Migrate artists first (they're referenced by albums and songs)
      await this.migrateArtists();
      
      // Then migrate albums
      await this.migrateAlbums();
      
      // Optionally migrate songs
      if (migrateSongs) {
        await this.migrateSongs();
      }

      // Verify the migration
      await this.verifyMigration();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n🎉 Migration completed!');
      console.log('=====================');
      console.log(`⏱️ Total duration: ${duration}s`);
      console.log(`🎤 Artists: ${this.stats.artists.migrated}/${this.stats.artists.total} (${this.stats.artists.errors} errors)`);
      console.log(`💿 Albums: ${this.stats.albums.migrated}/${this.stats.albums.total} (${this.stats.albums.errors} errors)`);
      
      if (migrateSongs) {
        console.log(`🎵 Songs: ${this.stats.songs.migrated}/${this.stats.songs.total} (${this.stats.songs.errors} errors)`);
      }

    } catch (error) {
      console.error('💥 Migration failed:', error);
    } finally {
      if (this.redis) {
        await this.redis.quit();
      }
    }
  }
}

// Export the migrator class
export default DataMigrator;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DataMigrator();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    clearExisting: args.includes('--clear'),
    migrateSongs: args.includes('--songs')
  };

  migrator.runMigration(options).then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}






