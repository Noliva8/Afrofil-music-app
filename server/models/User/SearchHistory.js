
import { Schema, model } from 'mongoose';


const searchHistorySchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId,
     ref: 'User',
      required: true
       },

  searched_songs: { 
    type: Schema.Types.ObjectId,
     ref: 'Song'
      },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const SearchHistory = model('SearchHistory', searchHistorySchema);

export default SearchHistory;
