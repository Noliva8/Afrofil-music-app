
// what we need from redis data :
/*

userIdentinty:{
    userId,
    userLocation,
    age , 
    userRole # either guest, regular, premium #
}

This identity will help us to know who is the user and what is his location, his role to give him the best suitable ads


userBehavior: {
    userId,
    sessionId,
     device,
    playStart,
    playEnd,
    ms_listened, # or we simply take  playStart-playEnd #
    playCount # how many times the user played the song #
     # this will help us to know if he played the full song #
    skipped,
    previewed,
    quit, 
}

userPreferredSongs: {
      userId,
      songId,
      artistId,
      albumId,
      genre,
      mood,
      subMood,
      songLocation
}

adWatched: {
     userId,
     adId,
     campaignId,
     targeting,
     schedule,
     analytics
}

To make even the life easier, for the ads, we can send all eligible ads in Redis as copy of mongodb document to be available in redis to filter which ad to play. We have to send them while user is hitting the play button if they are not availbe. we dont need redudant here

eligbleAd: {
    adId,
    advertiserId,
    campaignId,
    targeting,
    schedule,
    isCostConfirmed,
    isPaid,
    isApproved,
    streamingOverlayAdUrl,
    originalOverlayUrl,
    streamingBannerAdUrl,
    originalBannerAdUrl,
    masterAudionAdUrl,
    streamingAudioAdUrl,
    streamingFallBackAudioUrl,
    adArtWorkUrl
}



*/





// import redis from 'redis';

// // Basic connection to a Redis Enterprise database
// const client = redis.createClient({
//     url: 'redis://redis-17576.c1.us-west-2-2.ec2.redns.redis-cloud.com:17576', 
//     password: process.env.REDIS_PASSWORD
// });

// client.on('error', err => console.log('Redis Client Error', err));

// async function getRedis() {
//     await client.connect();
//     console.log('Connected to Redis Enterprise!');

//     // Example operations
//     await client.set('mykey', 'myvalue');
//     const value = await client.get('mykey');
//     console.log(`Value for mykey: ${value}`);

//     await client.quit();
// }

// getRedis();
// telemetry/buildTrackStartInput.js

