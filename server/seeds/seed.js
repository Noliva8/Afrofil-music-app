import db from '../config/connection.js';
import { User, Song, Comment, Playlist, Genre, Artist, Album } from '../models/index.js';
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

db.once('open', async () => {
  try {
    // Clean the database collections
    await dropCollection('Artist');
    await dropCollection('Song');
    await dropCollection('Genre');
    await dropCollection('Album');
    await dropCollection('User');
    await dropCollection('Playlist');
    await dropCollection('Comment');

    // Part 1: Seed Artist, Album, Genre, and Songs
    // ----------------------------------------

    // Step 1: Create Genres
    const createdGenres = await Genre.create(genreSeeds);

    // Step 2: Create Albums
    const createdAlbums = await Album.create(albumSeeds);

    // Step 3: Create Artists and randomly assign Genres and Albums
    const createdArtists = await Artist.create(artistSeeds);

    for (const artist of createdArtists) {
      const randomGenre = createdGenres[Math.floor(Math.random() * createdGenres.length)];
      const randomAlbum = createdAlbums[Math.floor(Math.random() * createdAlbums.length)];

      await Artist.findByIdAndUpdate(
        artist._id,
        { $addToSet: { albums: randomAlbum._id, genres: randomGenre._id } }
      );

      await Album.findByIdAndUpdate(
        randomAlbum._id,
        { $addToSet: { artist: artist._id } }
      );
    }

    // Step 4: Create Songs and associate with Artists, Albums, and Genres
    for (let i = 0; i < songSeeds.length; i++) {
      const songSeed = songSeeds[i];
      const randomArtist = createdArtists[Math.floor(Math.random() * createdArtists.length)];
      const randomGenre = createdGenres[Math.floor(Math.random() * createdGenres.length)];
      const randomAlbum = createdAlbums[Math.floor(Math.random() * createdAlbums.length)];

      const createdSong = await Song.create({
        ...songSeed,
        artist: randomArtist._id,
        genre: randomGenre._id,
        album: randomAlbum._id
      });

      await Artist.findByIdAndUpdate(randomArtist._id, { $addToSet: { songs: createdSong._id } });
      await Genre.findByIdAndUpdate(randomGenre._id, { $addToSet: { songs: createdSong._id } });
      await Album.findByIdAndUpdate(randomAlbum._id, { $addToSet: { songs: createdSong._id } });
    }

    // Part 2: Seed User and their dependencies
    const createdUsers = await User.create(userSeeds);

    for (const user of createdUsers) {
      // Randomly select songs to recommend
      const recommendedSongs = [];
      const recommendationAlgorithms = ['basedOnLikes', 'basedOnPlayCounts', 'trending', 'newReleases'];

      // Let's say you want to recommend 3 songs per user
      for (let i = 0; i < 3; i++) {
        const randomSong = await Song.findOne().skip(Math.floor(Math.random() * songSeeds.length));
        if (randomSong) {
          recommendedSongs.push({
            song: randomSong._id,
            algorithm: recommendationAlgorithms[Math.floor(Math.random() * recommendationAlgorithms.length)]
          });
        }
      }

      // Update the user with recommended songs
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { recommendedSongs: { $each: recommendedSongs } }
      });
    }

    // Create Playlists
    for (let i = 0; i < playlistSeeds.length; i++) {
      const playlistSeed = playlistSeeds[i];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomSongs = [];

      for (let j = 0; j < 5; j++) {
        const randomSong = await Song.findOne().skip(Math.floor(Math.random() * songSeeds.length));
        randomSongs.push(randomSong._id);
      }

      const createdPlaylist = await Playlist.create({
        ...playlistSeed,
        user: randomUser._id,
        createdBy: randomUser._id,
        songs: randomSongs
      });

      await User.findByIdAndUpdate(randomUser._id, { $addToSet: { playlists: createdPlaylist._id } });
    }

    // Create Comments
    for (let i = 0; i < commentSeeds.length; i++) {
      const commentSeed = commentSeeds[i];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomPlaylist = await Playlist.findOne().skip(Math.floor(Math.random() * playlistSeeds.length));

      await Comment.create({
        ...commentSeed,
        user: randomUser._id,
        playlist: randomPlaylist._id
      });
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error("Error occurred during seeding: ", error);
  } finally {
    db.close();
  }
});
