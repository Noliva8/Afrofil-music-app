
import axios from 'axios';

// Using axios, we create a search method that is specific to our use case and export it at the bottom

const searchSong = (query) =>
  axios.get(`https://api.jamendo.com/v3.0/tracks/?name=${query}&client_id=9e073caa&format=json&limit=40`);


export default searchSong;
