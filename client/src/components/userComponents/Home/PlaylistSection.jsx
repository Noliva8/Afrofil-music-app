// components/PlaylistSection.jsx
import { FiMusic } from 'react-icons/fi';
import { IoMdPlay, IoMdPause } from 'react-icons/io';
import { BsThreeDots } from 'react-icons/bs';
import { useSongsWithPresignedUrls } from '../../../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import { useAudioPlayer } from '../../../utils/Contexts/AudioPlayerContext.jsx';
import { usePlayCount } from '../../../utils/handlePlayCount';
import { handleTrendingSongPlay } from '../../../utils/plabackUtls/handleSongPlayBack.js';
import { useApolloClient } from '@apollo/client';
import SectionHeader from '../../common/SectionHeader.jsx';

const MAX_RECENT_SONGS = 4;

const PlaylistSection = ({ songs = [], loading, currentSong, setCurrentSong, setIsPlaying }) => {
  const { songsWithArtwork, loading: artworkLoading } = useSongsWithPresignedUrls(songs);
  const client = useApolloClient();
  const { currentTrack, isPlaying: isTrackPlaying, handlePlaySong, pause } = useAudioPlayer();
  const { incrementPlayCount } = usePlayCount();
  const headerTitle = 'Recently Played';
  const playlistDescription = 'Back to the tracks you loved most recently.';
  const displayedSongs = songsWithArtwork.slice(0, Math.min(MAX_RECENT_SONGS, songsWithArtwork.length));
  const isLoading = loading || artworkLoading;

  const normalizeArtist = (value) => {
    if (!value) return 'Unknown Artist';
    if (typeof value === 'string') return value;
    if (value.artistAka) return value.artistAka;
    if (value.fullName) return value.fullName;
    return 'Unknown Artist';
  };

  const handleSelectSong = async (song) => {
    const normalizedSong = {
      ...song,
      artist: normalizeArtist(song.artist) || normalizeArtist(song.artistName),
    };
    setCurrentSong(normalizedSong);
    await handleTrendingSongPlay({
      song: normalizedSong,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: songsWithArtwork,
      client,
    });
    setIsPlaying(true);
  };

  return (
    <section className="integrated-playlist">
      <SectionHeader title={headerTitle} subtitle={playlistDescription} />

      <div className="playlist-tracks">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="playlist-track shimmer" />)
        ) : displayedSongs.length ? (
          displayedSongs.map(song => {
            const artistName =
              typeof song.artist === "string"
                ? song.artist
                : normalizeArtist(song.artist) || normalizeArtist(song.artistName);
            const coverImageUrl =
              song.artworkUrl ||
              song.albumCoverImageUrl ||
              song.coverImage ||
              song.artwork ||
              song.album?.albumCoverImage ||
              song.profilePictureUrl ||
              '';
            const hasCoverImage = Boolean(coverImageUrl);
            const isSongActive = currentTrack?._id === song._id;
            const isPlayingSong = isSongActive && isTrackPlaying;
            const durationLabel = song.duration || song.durationSeconds || '0:00';

            return (
              <div
                key={song._id}
                className={`playlist-track${isSongActive ? ' active' : ''}`}
                onClick={() => handleSelectSong(song)}
              >
                <div
                  className="track-cover"
                  style={{
                    backgroundImage: hasCoverImage ? `url(${coverImageUrl})` : 'none',
                    backgroundColor: hasCoverImage ? 'transparent' : song.coverColor || '#222',
                  }}
                >
                  {!hasCoverImage && <FiMusic />}
                  <button
                    className="play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSong(song);
                    }}
                  >
                    {isPlayingSong ? <IoMdPause /> : <IoMdPlay />}
                  </button>
                </div>
                <div className="track-info">
                  <h3>{song.title}</h3>
                  <p>{artistName}</p>
                </div>
                <div className="track-meta">
                  <span className="track-duration">{durationLabel}</span>
                  <button className="more-options">
                    <BsThreeDots />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="section-description">No songs available in this playlist.</p>
        )}
      </div>
    </section>
  );
};

export default PlaylistSection;
