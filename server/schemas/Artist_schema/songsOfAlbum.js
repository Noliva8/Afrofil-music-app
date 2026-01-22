import { Album, Song } from '../../models/Artist/index_artist.js';




export const getAlbum = async (_parent, { albumId }) => {
  try {
    const album = await Album.findById(albumId)
      .populate('artist', '_id artistAka profileImage coverImage country bio artistDownloadCounts followerCount')
      .lean();

    if (!album) return null;

    const publicSongs = await Song.find({ album: albumId, visibility: 'public' })
      .sort({ trackNumber: 1, createdAt: 1 })
      .select('-beats -timeSignature -tempo -key -mode')
      .populate({ path: 'artist', select: '_id artistAka profileImage coverImage country bio artistDownloadCounts followerCount' })
      .populate({ path: 'album', select: '_id title albumCoverImage releaseDate artist' })
      .lean();



    return {
      id: String(album._id),
      _id: String(album._id),
      title: album.title,
      artist: album.artist ? {
        _id: String(album.artist._id),
        id: String(album.artist._id),
        artistAka: album.artist.artistAka,
        profileImage: album.artist.profileImage
      } : null,
      releaseDate: album.releaseDate?.toISOString(),
      albumCoverImage: album.albumCoverImage,
      songs: publicSongs.map((song) => ({
        _id: String(song._id),
        id: String(song._id),
        title: song.title,
        trackNumber: song.trackNumber || null,
        artistName: song.artist?.artistAka,

        artistFollowers: song.artistFollowers || 0,

        artistDownloadCounts: song.downloadCount || 0,
        artist: song.artist
          ? {
              _id: String(song.artist._id),
              id: String(song.artist._id),
              artistAka: song.artist.artistAka,
              profileImage: song.artist.profileImage,
            }
          : null,
        album: song.album
          ? {
              _id: String(song.album._id),
              id: String(song.album._id),
              title: song.album.title,
            }
          : null,
        artwork: song.artwork || null,
    
        audioFileUrl: song.audioFileUrl || null,
        audioStreamKey: song.audioStreamKey || null,
        streamAudioFileUrl: song.streamAudioFileUrl || null,
        duration: song.duration || 0,
        playCount: song.playCount || 0,
        downloadCount: song.downloadCount || 0,
        likesCount: song.likesCount || 0,
        shareCount: song.shareCount || 0,
        releaseDate: song.releaseDate || null,
        composer: song.composer || [],
        producer: song.producer || [],
        genre: song.genre || null,
        mood: song.mood || [],
        subMoods: song.subMoods || [],
        label: song.label || '',
        featuringArtist: song.featuringArtist || [],
        lyrics: song.lyrics || '',
      })),
      createdAt: album.createdAt?.toISOString()
    };
  } catch (error) {
    console.error('Error fetching album:', error);
    throw error;
  }
};




export const otherAlbumsByArtist = async (parent, { albumId, artistId }) => {
      console.log('[getAlbum] albumId:', albumId);
       console.log('[getArtist] albumId:', artistId);
  try {
    const albums = await Album.find({
      artist: artistId,
      _id: { $ne: albumId },
      title: { $nin: ['Unknown', 'Single'] }
    })
      .populate(
        'artist',
        '_id artistAka profileImage coverImage country bio artistDownloadCounts followers'
      )
      .sort({ releaseDate: -1, createdAt: -1 })
      .lean();

    if (!albums?.length) return [];

    const albumIds = albums.map((album) => String(album._id));
    const songs = await Song.find({
      album: { $in: albumIds },
      visibility: { $ne: 'private' },
    })
      .select('title featuringArtist trackNumber producer composer label duration lyrics playCount downloadCount likesCount shareCount streamAudioFileUrl artwork album')
      .lean();

    const songsByAlbum = new Map();
    for (const song of songs) {
      const key = String(song.album);
      if (!songsByAlbum.has(key)) songsByAlbum.set(key, []);
      songsByAlbum.get(key).push(song);
    }

    return albums
      .map((album) => {
        const albumKey = String(album._id);
        return {
          ...album,
          songs: songsByAlbum.get(albumKey) || [],
        };
      })
      .filter((album) => Array.isArray(album.songs) && album.songs.length > 0);
  } catch (error) {
    console.error('Error fetching other albums by artist:', error);
    throw error;
  }
};
