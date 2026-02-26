
import { CreatePresignedUrl } from "../../../utils/awsS3.js"; 
import {Song, Album} from '../../../models/Artist/index_artist.js'
import path from 'path';
import { INITIAL_RECENCY_SCORE } from "../Redis/keys.js";
import crypto from "crypto";



export const newSongUpload = async (_, {filename, mimetype, region, bucket}, context) =>{
try{

// Authentication check
if (!context.artist) throw new Error('Unauthorized: You are not logged in.');
 const loggedInArtistId = context.artist._id;

// check the incoming file if it is audio and has the size does not exceed size limit


  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp3",
    "audio/flac",
  ];


 if (!allowedMimeTypes.includes(mimetype)) {
    throw new Error("Invalid file type.");
  }



  const baseTitle = path.basename(filename, path.extname(filename));
  const safeName = filename.replace(/[^\w.\-]+/g, "_");

 const uploadId = crypto.randomUUID();
  const uploadPrefix = "originalSongUploads/";
  const key = `${uploadPrefix}${uploadId}-${safeName}`;


  let album = await Album.findOne({ artist: loggedInArtistId });
    if (!album) {
      album = await Album.create({
        title: "Single",
        artist: loggedInArtistId,
        releaseDate: new Date()
      });
    }


    // create db
    // --------
  const song = await Song.create({
    title: baseTitle,
    album: album._id,
    artist: loggedInArtistId,
    bucket: bucket,
    visibility: "private",
    s3Key: key,
    songUploadStatus: "UPLOADING",
    duration: 0,
    releaseDate: new Date(),
    trendingScore: INITIAL_RECENCY_SCORE,
  });

  const url = await CreatePresignedUrl({ bucket, key, region });

console.log('IS PREIGNED? ', url)
console.log('KEY? ', key)
console.log('SONG? ', song)
    return {
    song,
    url,
    key
    }

}catch(error){
     console.error('Error in resolver:', error);
     throw new Error(error.message || "Song upload init failed");
}



}
