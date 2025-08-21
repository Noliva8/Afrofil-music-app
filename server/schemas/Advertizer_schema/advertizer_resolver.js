
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import registerAdvertizer from "./resolvers/registerAdvertizer.js";
import resendAdvertizerVerificationEmail from "./resolvers/resendVerificationEmail.js";
import loginAdvertizer from "./resolvers/loginAdvertizer.js";
import audioAdUpload from "./resolvers/audioAdUpload.js";
import uploadArtwork from "./resolvers/adArtworkUpload.js";

import { createAdBasic } from "./resolvers/createAd.js";
import confirmPrice from "./resolvers/confirmPrice.js";
import myAds from "./resolvers/adDisplay.js";


const resolvers = {
     Upload: GraphQLUpload,
     Query: {
myAds,

     },

     Mutation: {
        registerAdvertizer,
         loginAdvertizer,
         resendAdvertizerVerificationEmail,
         createAdBasic,
         confirmPrice,
         audioAdUpload,
         uploadArtwork
     }

}



export default resolvers;
