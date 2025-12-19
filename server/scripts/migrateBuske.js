



import { Artist } from '../models/Artist/index_artist.js';

export const updateArtistProfileImageUrlsSimple = async () => {
  try {
    console.log('=== SIMPLE ARTIST PROFILE IMAGE UPDATE ===');
    
    // Find all artists with profile images
    const artists = await Artist.find({ 
      profileImage: { $exists: true, $ne: null } 
    }).select('_id fullName profileImage');
    
    console.log(`Found ${artists.length} artists with profile images`);
    
    let updatedCount = 0;
    const changes = [];
    
    for (const artist of artists) {
      try {
        const oldUrl = artist.profileImage;
        
        // Skip if already has folder or not from the right bucket
        if (!oldUrl.includes('afrofeel-profile-picture') || oldUrl.includes('/profile-picture/')) {
          continue;
        }
        
        // Simple string replacement
        const newUrl = oldUrl.replace(
          'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/',
          'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/profile-picture/'
        );
        
        // Skip if no change
        if (newUrl === oldUrl) {
          continue;
        }
        
        // Use updateOne to avoid validation issues
        await Artist.updateOne(
          { _id: artist._id },
          { $set: { profileImage: newUrl } }
        );
        
        updatedCount++;
        changes.push({
          artist: artist.fullName,
          old: oldUrl,
          new: newUrl
        });
        
        console.log(`Updated: ${artist.fullName}`);
        console.log(`  FROM: ${oldUrl}`);
        console.log(`  TO:   ${newUrl}\n`);
        
      } catch (error) {
        console.error(`Error for ${artist.fullName}:`, error.message);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} artists successfully!`);
    
    // Verify
    const updatedArtists = await Artist.find({ 
      profileImage: { $regex: '/profile-picture/', $options: 'i' } 
    }).select('fullName profileImage');
    
    console.log('\n=== VERIFICATION ===');
    console.log(`Artists with /profile-picture/ folder: ${updatedArtists.length}`);
    
    updatedArtists.forEach(artist => {
      console.log(`\n${artist.fullName}:`);
      console.log(`  ${artist.profileImage.substring(0, 80)}...`);
    });
    
    return {
      success: true,
      updated: updatedCount,
      changes: changes
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Even simpler - direct update
export const updateSingleArtistProfileImage = async () => {
  try {
    console.log('Updating noliva profile image...');
    
    const artist = await Artist.findOne({ fullName: 'noliva' });
    
    if (!artist) {
      console.log('Artist not found');
      return { success: false, error: 'Artist not found' };
    }
    
    const oldUrl = artist.profileImage;
    console.log('Current URL:', oldUrl);
    
    // Simple string manipulation
    const newUrl = oldUrl.replace(
      'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/',
      'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/profile-picture/'
    );
    
    console.log('New URL:', newUrl);
    
    // Direct update without validation
    await Artist.updateOne(
      { _id: artist._id },
      { $set: { profileImage: newUrl } }
    );
    
    console.log('✅ Updated successfully!');
    
    // Verify
    const updated = await Artist.findById(artist._id).select('profileImage');
    console.log('Verified URL:', updated.profileImage);
    
    return { success: true, oldUrl, newUrl };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};

// Run this!
export const fixAllArtistProfileImages = async () => {
  console.log('=== FIXING ALL ARTIST PROFILE IMAGES ===\n');
  
  // Just update directly for all artists
  const result = await Artist.updateMany(
    {
      profileImage: {
        $regex: 'afrofeel-profile-picture\\.s3\\.us-west-2\\.amazonaws\\.com/(?!profile-picture/)',
        $options: 'i'
      }
    },
    [
      {
        $set: {
          profileImage: {
            $replaceOne: {
              input: "$profileImage",
              find: "afrofeel-profile-picture.s3.us-west-2.amazonaws.com/",
              replacement: "afrofeel-profile-picture.s3.us-west-2.amazonaws.com/profile-picture/"
            }
          }
        }
      }
    ]
  );
  
  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);
  
  // Show results
  const artists = await Artist.find({}).select('fullName profileImage').limit(5);
  console.log('\n=== SAMPLE RESULTS ===');
  artists.forEach(artist => {
    console.log(`${artist.fullName}: ${artist.profileImage.substring(0, 80)}...`);
  });
  
  return result;
};







// // Preview function
// export const previewAddCoverImagesFolder = async () => {
//   console.log('=== PREVIEW: Adding /cover-images/ folder ===');
  
//   const songs = await Song.find({ 
//     artwork: { 
//       $regex: 'afrofeel-cover-images-for-songs',
//       $not: { $regex: '/cover-images/', $options: 'i' }
//     } 
//   }).limit(10);
  
//   console.log(`Will update ${songs.length} songs (showing first 10):\n`);
  
//   songs.forEach((song, i) => {
//     const oldUrl = song.artwork;
    
//     try {
//       const url = new URL(oldUrl);
//       const currentPath = decodeURIComponent(url.pathname.substring(1));
//       const filename = currentPath.split('?')[0];
//       const newUrl = `https://${url.hostname}/cover-images/${filename}`;
      
//       console.log(`${i + 1}. ${song.title || song._id}`);
//       console.log(`   FROM: ${oldUrl.substring(0, 80)}...`);
//       console.log(`   TO:   ${newUrl.substring(0, 80)}...`);
//       console.log('');
//     } catch (e) {
//       console.log(`${i + 1}. Could not parse: ${oldUrl.substring(0, 80)}...\n`);
//     }
//   });
  
//   console.log('To apply: run addCoverImagesFolderToSongs()');
// };
// // Quick test function to preview changes
// export const previewSongArtworkChanges = async () => {
//   console.log('=== PREVIEW CHANGES (Dry Run) ===');
  
//   const songs = await Song.find({ 
//     artwork: { 
//       $regex: '/cover-images/', 
//       $options: 'i' 
//     } 
//   }).limit(10);
  
//   console.log(`Will update ${songs.length} songs (showing first 10):\n`);
  
//   songs.forEach((song, i) => {
//     const oldUrl = song.artwork;
//     const newUrl = oldUrl.replace(/\/cover-images\//g, '/').replace(/\/\//g, '/');
    
//     console.log(`${i + 1}. ${song.title || song._id}`);
//     console.log(`   FROM: ${oldUrl.substring(0, 80)}...`);
//     console.log(`   TO:   ${newUrl.substring(0, 80)}...`);
//     console.log('');
//   });
  
//   console.log('To apply changes, run: updateSongArtworkUrls()');
// };

// // API endpoint wrapper
// export const runSongArtworkMigration = async (req, res) => {
//   try {
//     console.log('API: Starting song artwork migration...');
//     const result = await updateSongArtworkUrls();
    
//     if (result.success) {
//       res.json({
//         message: 'Migration completed successfully',
//         ...result
//       });
//     } else {
//       res.status(500).json({
//         error: 'Migration failed',
//         details: result.error
//       });
//     }
    
//   } catch (error) {
//     console.error('API Migration error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };



// export const moveAlbumCoverIntoFolder = async () => {


//   try {
//     console.log('Starting album cover migration...');
    
//     const albums = await Album.find({ albumCoverImage: { $exists: true, $ne: null } });
    
//     console.log(`Found ${albums.length} albums with cover images`);
    
//     let updatedCount = 0;
//     let skippedCount = 0;
//     let errorCount = 0;
    
//     for (const album of albums) {
//       try {
//         const oldUrl = album.albumCoverImage;
        
//         // Skip if already has folder or empty
//         if (!oldUrl || oldUrl.includes('/album-covers/')) {
//           skippedCount++;
//           continue;
//         }
        
//         // Extract filename from S3 URL
//         let filename;
        
//         if (oldUrl.includes('s3.amazonaws.com/')) {
//           // S3 URL format
//           const url = new URL(oldUrl);
//           filename = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash
//         } else if (oldUrl.includes('afrofeel-')) {
//           // Custom domain or just filename
//           const parts = oldUrl.split('/');
//           filename = parts[parts.length - 1];
//         } else {
//           // Just filename
//           filename = oldUrl;
//         }
        
//         // Clean up filename (remove any existing wrong folders)
//         const cleanFilename = filename.split('/').pop();
        
//         // Build new URL with album-covers folder
//         const newUrl = `https://afrofeel-album-covers.s3.us-west-2.amazonaws.com/album-covers/${cleanFilename}`;
        
//         // Update album
//         album.albumCoverImage = newUrl;
//         await album.save();
        
//         updatedCount++;
        
//         // Log progress every 50 albums
//         if (updatedCount % 50 === 0) {
//           console.log(`Progress: Updated ${updatedCount} albums...`);
//         }
        
//       } catch (albumError) {
//         console.error(`Error updating album ${album._id}:`, albumError.message);
//         errorCount++;
//       }
//     }
    
//     console.log('\n=== Migration Summary ===');
//     console.log(`Total albums processed: ${albums.length}`);
//     console.log(`Updated: ${updatedCount}`);
//     console.log(`Skipped (already correct): ${skippedCount}`);
//     console.log(`Errors: ${errorCount}`);
    
//     // Verify some samples
//     console.log('\n=== Sample Verification ===');
//     const sampleAlbums = await Album.find().limit(3);
//     sampleAlbums.forEach((album, index) => {
//       if (album.albumCoverImage) {
//         console.log(`Album ${index + 1}: ${album.albumCoverImage.substring(0, 80)}...`);
//       }
//     });
    
//     return {
//       success: true,
//       stats: {
//         total: albums.length,
//         updated: updatedCount,
//         skipped: skippedCount,
//         errors: errorCount
//       }
//     };
    
//   } catch (error) {
//     console.error('Migration failed:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };












// Also create a rollback function in case








// export const rollbackAlbumCoverMigration = async () => {
//   try {
//     console.log('Starting rollback...');
    
//     const albums = await Album.find({ 
//       albumCoverImage: { $regex: '/album-covers/', $options: 'i' } 
//     });
    
//     console.log(`Found ${albums.length} albums with album-covers folder`);
    
//     let rolledBackCount = 0;
    
//     for (const album of albums) {
//       try {
//         const oldUrl = album.albumCoverImage;
        
//         // Remove album-covers/ folder
//         const newUrl = oldUrl.replace('/album-covers/', '/');
        
//         album.albumCoverImage = newUrl;
//         await album.save();
//         rolledBackCount++;
        
//       } catch (error) {
//         console.error(`Rollback error for album ${album._id}:`, error.message);
//       }
//     }
    
//     console.log(`Rolled back: ${rolledBackCount} albums`);
//     return { success: true, rolledBack: rolledBackCount };
    
//   } catch (error) {
//     console.error('Rollback failed:', error);
//     return { success: false, error: error.message };
//   }
// };