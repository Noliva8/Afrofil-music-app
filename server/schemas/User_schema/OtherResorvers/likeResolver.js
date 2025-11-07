import { GraphQLError } from 'graphql';
import { Song } from '../../../models/Artist/index_artist.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { userLikesKey, songKey } from '../../Artist_schema/Redis/keys.js';
import { addSongRedis, getSongRedi } from '../../Artist_schema/Redis/addSongRedis.js';





export const likesResolver = async (_, {songId}, context) => {

     if (!context?.user?._id) {
    throw new GraphQLError('User login required to like songs', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }


  const userId = context.user._id;
  const redisUserKey = userLikesKey(userId);
  const redisSongKey = songKey(songId);


// BLOCK 1: REDIS-LIKES


try{

const client = await getRedis();
const redisLikes = client.sAdd(redisUserKey, songId);

if (redisLikes){
    const songLiked = getSongRedi(songId);
    if(!songLiked){
        const songLikedAdded = addSongRedis(songId, client);
    }
    client.hIncrBy(redisSongKey, 'likesCount', 1)

    // update mongodb
    // ==============

  // find the current likesCount to increase it by 1
  const existingSong = await Song.findById({_id: songId});
  if (existingSong){
    let existingLikesCount = existingSong.likesCount;
  // find it in db and update then return.
      const song = await Song.findOneAndUpdate(
    {_id: songId},
    {$set: {likesCount: existingLikesCount+1}},
    { returnDocument: 'after' } 
    )
 
}}

}catch(error){}

}