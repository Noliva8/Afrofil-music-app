import { Schema, model } from 'mongoose';


const adPerformanceLogSchema = new Schema({
  ad: {  type: Schema.Types.ObjectId, ref: 'Ad', required: true },


 

  viewerUser: {  type: Schema.Types.ObjectId, ref: 'User' }, 
  timestamp: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['impression', 'click', 'playthrough'],
    required: true
  }
});

export default model('AdPerformanceLog', adPerformanceLogSchema);
