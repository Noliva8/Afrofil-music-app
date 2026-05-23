



import { Artist } from '../models/Artist/index_artist.js';

export const updateArtistProfileImageUrlsSimple = async () => {
  try {
    
    // Find all artists with profile images
    const artists = await Artist.find({ 
      profileImage: { $exists: true, $ne: null } 
    }).select('_id fullName profileImage');
    
    
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
        
        
      } catch (error) {
        console.error(`Error for ${artist.fullName}:`, error.message);
      }
    }
    
    
    // Verify
    const updatedArtists = await Artist.find({ 
      profileImage: { $regex: '/profile-picture/', $options: 'i' } 
    }).select('fullName profileImage');
    
    
    updatedArtists.forEach(artist => {
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
    
    const artist = await Artist.findOne({ fullName: 'noliva' });
    
    if (!artist) {
      return { success: false, error: 'Artist not found' };
    }
    
    const oldUrl = artist.profileImage;
    
    // Simple string manipulation
    const newUrl = oldUrl.replace(
      'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/',
      'afrofeel-profile-picture.s3.us-west-2.amazonaws.com/profile-picture/'
    );
    
    
    // Direct update without validation
    await Artist.updateOne(
      { _id: artist._id },
      { $set: { profileImage: newUrl } }
    );
    
    
    // Verify
    const updated = await Artist.findById(artist._id).select('profileImage');
    
    return { success: true, oldUrl, newUrl };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};

// Run this!
export const fixAllArtistProfileImages = async () => {
  
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
  
  
  // Show results
  const artists = await Artist.find({}).select('fullName profileImage').limit(5);
  artists.forEach(artist => {
  });
  
  return result;
};







// // Preview function
// export const previewAddCoverImagesFolder = async () => {
  
//   const songs = await Song.find({ 
//     artwork: { 
//       $regex: 'afrofeel-cover-images-for-songs',
//       $not: { $regex: '/cover-images/', $options: 'i' }
//     } 
//   }).limit(10);
  
  
//   songs.forEach((song, i) => {
//     const oldUrl = song.artwork;
    
//     try {
//       const url = new URL(oldUrl);
//       const currentPath = decodeURIComponent(url.pathname.substring(1));
//       const filename = currentPath.split('?')[0];
//       const newUrl = `https://${url.hostname}/cover-images/${filename}`;
      
//     } catch (e) {
//     }
//   });
  
// };
// // Quick test function to preview changes
// export const previewSongArtworkChanges = async () => {
  
//   const songs = await Song.find({ 
//     artwork: { 
//       $regex: '/cover-images/', 
//       $options: 'i' 
//     } 
//   }).limit(10);
  
  
//   songs.forEach((song, i) => {
//     const oldUrl = song.artwork;
//     const newUrl = oldUrl.replace(/\/cover-images\//g, '/').replace(/\/\//g, '/');
    
//   });
  
// };

// // API endpoint wrapper
// export const runSongArtworkMigration = async (req, res) => {
//   try {
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
    
//     const albums = await Album.find({ albumCoverImage: { $exists: true, $ne: null } });
    
    
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
//         }
        
//       } catch (albumError) {
//         console.error(`Error updating album ${album._id}:`, albumError.message);
//         errorCount++;
//       }
//     }
    
    
//     // Verify some samples
//     const sampleAlbums = await Album.find().limit(3);
//     sampleAlbums.forEach((album, index) => {
//       if (album.albumCoverImage) {
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
    
//     const albums = await Album.find({ 
//       albumCoverImage: { $regex: '/album-covers/', $options: 'i' } 
//     });
    
    
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
    
//     return { success: true, rolledBack: rolledBackCount };
    
//   } catch (error) {
//     console.error('Rollback failed:', error);
//     return { success: false, error: error.message };
//   }
// };