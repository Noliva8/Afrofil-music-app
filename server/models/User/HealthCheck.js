import { Schema, model } from 'mongoose';

const healthCheckSchema = new Schema({
 timestamp: {
    type: Date,
    default: Date.now
  },



// Traffic metrics
activeUsers:{
    type: Number,
    default: 0
  },
  activeArtists:{
    type: Number,
    default: 0
  },
  concurrentUsers:{
    type: Number,
    default: 0
  },
  requestsPerMinute:{
    type: Number,
    default: 0
  },
  playsPerMinute:{
    type: Number,
    default: 0
  },
  uploadsInProgress:{
    type: Number,
    default: 0
  },



//  Failures and errors Reports
apiErrors: {
    type: Number,
    default: 0
  },
  playbackFailures:{
    type: Number,
    default: 0
  },
  uploadFailures:{
    type: Number,
    default: 0
  },
  loginFailures:{
    type: Number,
    default: 0
  },
  serverErrors:{
    type: Number,
    default: 0
  },


// Performance overview

avgResponseTime: {
    type: Number,
    default: 0
  },
  databaseLatency:{
    type: Number,
    default: 0
  },
  redisLatency:{
    type: Number,
    default: 0
  },

// Infrastructure 

cpuUsage: {
    type: Number,
    default: 0
  },
  memoryUsage:{
    type: Number,
    default: 0
  },
  diskUsage:{
    type: Number,
    default: 0
  },
   
// Streaming report

activeStreams: {
    type: Number,
    default: 0
  },
  playAttempts:{
    type: Number,
    default: 0
  },
  successfulPlays:{
    type: Number,
    default: 0
  },
  failedPlays:{
    type: Number,
    default: 0
  },


// Processing

 songsProcessing: {
    type: Number,
    default: 0
  },
  songsFailed:{
    type: Number,
    default: 0
  },
  queueDepth:{
    type: Number,
    default: 0
  },


});

const HealthCheck = model('HealthCheck', healthCheckSchema);

export default HealthCheck;