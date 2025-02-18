import db from '../config/connection.js';
import { User, Song, Comment, Playlist, Artist, Album } from '../models/index.js';
import dropCollection from './cleanDB.js';

// Part 1: Artist and their dependencies
import artistSeeds from './artistData.json';
import songSeeds from './songData.json';
import genreSeeds from './genreData.json';
import albumSeeds from './albumData.json';

// Part 2: User and their dependencies
import userSeeds from './userData.json';
import playlistSeeds from './playlistData.json';
import commentSeeds from './commentData.json';


    

  



    