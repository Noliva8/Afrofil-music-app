
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import registerAdvertizer from "./resolvers/registerAdvertizer.js";
import resendAdvertizerVerificationEmail from "./resolvers/resendVerificationEmail.js";
import loginAdvertizer from "./resolvers/loginAdvertizer.js";
import audioAdUpload from "./resolvers/audioAdUpload.js";
import uploadArtwork from "./resolvers/adArtworkUpload.js";

import { createAdBasic } from "./resolvers/createAd.js";
import confirmPrice from "./resolvers/confirmPrice.js";
import myAds from "./resolvers/adDisplay.js";
import { AdAprouve, AdReject } from "./resolvers/adAprouveAndReject.js";
import {adDecisionEngine }from "./resolvers/adDecision.js";
import {adBumpServed } from "./resolvers/adDecision.js";
// import { trackProgress, trackStart, trackEnd } from "./resolvers/telemetry.js";

import { trackStart, trackComplete, trackSkip, trackAdEvent, trackEnd} from './resolvers/telemetry.js'
import { savePlaybackContextState } from "./resolvers/playbackContext/savePlaybackContextState.js";
import { getPlaybackContextState } from "./resolvers/playbackContext/getPlaybackContextState.js";

import { clearPlaybackContextState } from "./resolvers/playbackContext/clearPlaybackContextState.js";
import { getAudioAd } from "./resolvers/getAudioAd.js";



const resolvers = {
     Upload: GraphQLUpload,
     Query: {
myAds,
getPlaybackContextState,
getAudioAd

     },

     Mutation: {
        registerAdvertizer,
         loginAdvertizer,
         resendAdvertizerVerificationEmail,
         createAdBasic,
         confirmPrice,
         audioAdUpload,
         uploadArtwork,
         AdAprouve,
         AdReject,
         
         adDecisionEngine,
         adBumpServed,

          trackStart, 
          trackComplete,
           trackSkip, 
           trackAdEvent,
           trackEnd,
           savePlaybackContextState,
           clearPlaybackContextState


     }

}



export default resolvers;
