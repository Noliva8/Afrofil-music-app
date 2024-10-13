const db = require('../config/connection');
const { User, Song, Comment, Playlist, Genre, Artist, Album } = require('../models');
const cleanDB = require('./cleanDB');

// Part 1: Artist and their dependencies
const artistSeeds = require('./artistData.json');
const songSeeds = require('./songData.json');
const genreSeeds = require('./genreData.json');
const albumSeeds = require('./albumData.json');

// Part 2: User and their dependencies
const userSeeds = require('./userData.json');
const playlistSeeds = require('./playlistData.json');
const commentSeeds = require('./commentData.json');

db.once('open', async () => {
  try {
    // Clean the database collections
    await cleanDB('Artist', 'artists');
    await cleanDB('Song', 'songs');
    await cleanDB('Genre', 'genres');
    await cleanDB('Album', 'albums');
    await cleanDB('User', 'users');
    await cleanDB('Playlist', 'playlists');
    await cleanDB('Comment', 'comments');

    // Part 1: Seed Artist, Album, Genre, and Songs
    // ----------------------------------------

    // Step 1: Create Genres
    const createdGenres = await Genre.create(genreSeeds);

    // Step 2: Create Albums
    const createdAlbums = await Album.create(albumSeeds);

    // Step 3: Create Artists and randomly assign Genres and Albums
    const createdArtists = await Artist.create(artistSeeds);

    for (const artist of createdArtists) {
      // Assign random genres to the artist
      const randomGenre = createdGenres[Math.floor(Math.random() * createdGenres.length)];

      // Assign random albums to the artist
      const randomAlbum = createdAlbums[Math.floor(Math.random() * createdAlbums.length)];

      // Add album reference to the artist
      await Artist.findByIdAndUpdate(
        artist._id,
        { $addToSet: { albums: randomAlbum._id, genres: randomGenre._id } }
      );

      // Also add artist reference to the album
      await Album.findByIdAndUpdate(
        randomAlbum._id,
        { $addToSet: { artist: artist._id } }
      );
    }

    // Step 4: Create Songs and associate with Artists, Albums, and Genres
    for (let i = 0; i < songSeeds.length; i++) {
      const songSeed = songSeeds[i];

      // Randomly assign an artist from the createdArtists to the song
      const randomArtist = createdArtists[Math.floor(Math.random() * createdArtists.length)];

      // Randomly assign a genre to the song
      const randomGenre = createdGenres[Math.floor(Math.random() * createdGenres.length)];

      // Randomly assign an album to the song
      const randomAlbum = createdAlbums[Math.floor(Math.random() * createdAlbums.length)];

      // Create the song and link it to the artist, genre, and album
      const createdSong = await Song.create({
        ...songSeed,
        artist: randomArtist._id,
        genre: randomGenre._id,
        album: randomAlbum._id
      });

      // Step 5: Add the song reference to the artist, genre, and album's songs array
      await Artist.findByIdAndUpdate(
        randomArtist._id,
        { $addToSet: { songs: createdSong._id } }
      );

      await Genre.findByIdAndUpdate(
        randomGenre._id,
        { $addToSet: { songs: createdSong._id } }
      );

      await Album.findByIdAndUpdate(
        randomAlbum._id,
        { $addToSet: { songs: createdSong._id } }
      );
    }

    // Part 2: Seed User and their dependencies
    // ----------------------------------------
    // Create Users
    const createdUsers = await User.create(userSeeds);

    // Create Playlists and link them to users and add songs to the playlist
    for (let i = 0; i < playlistSeeds.length; i++) {
      const playlistSeed = playlistSeeds[i];

      // Randomly assign a user to the playlist
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      // Randomly assign a set of songs to the playlist
      const randomSongs = [];
      for (let j = 0; j < 5; j++) { // Add 5 random songs to the playlist
        const randomSong = await Song.findOne().skip(Math.floor(Math.random() * songSeeds.length));
        randomSongs.push(randomSong._id);
      }

      // Create the playlist and link it to the user
      const createdPlaylist = await Playlist.create({
        ...playlistSeed,
        user: randomUser._id,
        createdBy: randomUser._id,
        songs: randomSongs
      });

      // Add the playlist reference to the user's playlists array
      await User.findByIdAndUpdate(
        randomUser._id,
        { $addToSet: { playlists: createdPlaylist._id } }
      );
    }

    // Seed Comments and associate with users and playlists
    for (let i = 0; i < commentSeeds.length; i++) {
      const commentSeed = commentSeeds[i];

      // Randomly assign a user to the comment
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      // Randomly assign a playlist to the comment
      const randomPlaylist = await Playlist.findOne().skip(Math.floor(Math.random() * playlistSeeds.length));

      // Create the comment and link it to the user and playlist
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
