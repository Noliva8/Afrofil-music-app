// utils/adAudioUtils.js
import { GET_PRESIGNED_URL_DOWNLOAD } from './mutations';
import { getAudioSupport } from "./audioSupport";
import { toBucketKey } from "./bucketKeySupport";
import { previewPointer } from "./previewSupport";



export const getAdAudioUrlWithFallback = async (creative) => {
  try {
    const support = getAudioSupport();
    const preview = previewPointer(creative, support);
    
    if (!preview) {
      throw new Error('No playable ad audio formats available');
    }

    const { pointer, defaultBucket } = preview;
    
    // Get presigned URL using your existing toBucketKey function
    const presignedUrl = await getPresignedAdUrlFromPointer(pointer, defaultBucket);
    
    if (!presignedUrl) {
      throw new Error('Failed to get presigned URL for ad audio');
    }

    return presignedUrl;
    
  } catch (error) {
    console.error('Failed to get ad audio URL:', error);
    throw error;
  }
};

// Use your existing toBucketKey function with GraphQL mutation
export const getPresignedAdUrlFromPointer = async (pointer, defaultBucket) => {
  if (!pointer) throw new Error('No pointer provided');
  
  // If it's already a presigned URL, return as-is
  if (pointer.includes('X-Amz-Signature') || pointer.includes('presigned')) {
    return pointer;
  }
  
  try {
    // Use your existing toBucketKey function
    const { bucket, key } = toBucketKey(pointer, defaultBucket);
    
    if (!bucket || !key) {
      console.warn('Could not parse bucket/key from pointer:', pointer);
      return pointer; // Return original if we can't parse it
    }

    // Use your GraphQL mutation
    const { data } = await apolloClient.mutate({
      mutation: GET_PRESIGNED_URL_DOWNLOAD,
      variables: {
        bucket,
        key: decodeURIComponent(key),
        region: 'us-west-2' // Your REGION constant
      }
    });

    if (data?.getPresignedUrlDownload?.urlToDownload) {
      return data.getPresignedUrlDownload.urlToDownload;
    }
    
    throw new Error('No presigned URL returned from server');
    
  } catch (error) {
    console.error('Error getting presigned URL via GraphQL:', error);
    throw error;
  }
};

// // Enhanced audio support detection
// export const getAudioSupport = () => {
//   const audio = document.createElement('audio');
//   return {
//     opusWebM: audio.canPlayType('audio/webm; codecs=opus') !== '',
//     opusOgg: audio.canPlayType('audio/ogg; codecs=opus') !== '',
//     opusMp4: audio.canPlayType('audio/mp4; codecs=opus') !== '',
//     aac: audio.canPlayType('audio/mp4; codecs=mp4a.40.2') !== '',
//     mp3: audio.canPlayType('audio/mpeg') !== ''
//   };
// };