import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { SONGS_I_LIKE } from "../../utils/queries";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks";
import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { SongRowContainer } from '../otherSongsComponents/SongsRow';
import { useNavigate } from 'react-router-dom';

export const SongsILike = () => {
  const { checkScrollPosition } = useScrollNavigation();

  const { data } = useQuery(SONGS_I_LIKE, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  const songs = data?.songsLikedByMe?.songs || [];
  const navigate = useNavigate();
  const { songsWithArtwork } = useSongsWithPresignedUrls(songs);

  const handleCardClick = (song) => {
    const albumId = song?.albumId || song?.album?._id || song?.album;
    const songId = song?.id || song?._id;
    if (albumId && songId) {
      navigate(`/album/${albumId}/${songId}`, { state: { song } });
      return;
    }
    if (songId) {
      navigate(`/song/${songId}`, { state: { song } });
    }
  };

  const likedSongs = useMemo(
    () =>
      processSongs(songsWithArtwork)
        .filter((song) => song.audioUrl)
        .sort((a, b) => b.plays - a.plays),
    [songsWithArtwork]
  );

console.log('how is liked songs:', likedSongs)
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  return (
    <SongRowContainer
      header="Songs you like"
      subHeader="Your personal favorites library"
      songsWithArtwork={likedSongs}
      onCardClick={handleCardClick}
      rowCode="songsYouLike"
    />
  );
};
