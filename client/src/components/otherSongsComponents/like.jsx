// LikesComponent.jsx
import { useMemo, useState, useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';

import { useMutation } from '@apollo/client';
import { LIKES } from '../../utils/mutations';
import Feedback from '../Feedback';
import UserAuth from "../../utils/auth.js"
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';

const getSongLikesCount = (song) => {
  const value = song?.likesCount ?? song?.likedByUsers?.length ?? 0;
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
};



export function LikesComponent({ song, currentUserId, onRequireAuth }) {

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const isAuthenticated = Boolean(UserAuth.loggedIn?.());
  const profile = UserAuth.getProfile?.();
  const userId = currentUserId || profile?.data?._id || null;

  const songId = useMemo(() => String(song?.id ?? song?._id ?? song?.songId ?? ''), [song]);
  const previousSongIdRef = useRef(songId);
  const isTogglingRef = useRef(false);

  const [displayLikes, setDisplayLikes] = useState(getSongLikesCount(song));
  const [displayLikedByMe, setDisplayLikedByMe] = useState(
    Boolean(isAuthenticated && userId && song?.likedByMe)
  );

  useEffect(() => {
    if (previousSongIdRef.current !== songId) {
      previousSongIdRef.current = songId;
      setDisplayLikes(getSongLikesCount(song));
      setDisplayLikedByMe(Boolean(isAuthenticated && userId && song?.likedByMe));
    }
  }, [isAuthenticated, song, songId, userId]);

  useEffect(() => {
    if (isTogglingRef.current) return;
    setDisplayLikes(getSongLikesCount(song));
    setDisplayLikedByMe(Boolean(isAuthenticated && userId && song?.likedByMe));
  }, [isAuthenticated, song, song?.likesCount, song?.likedByMe, userId]);

  const [toggleLike, { loading }] = useMutation(LIKES, {
    // Write the canonical Song entity so every list/card stays in sync
    update: (cache, { data }) => {
      const s = data?.toggleLikeSong;
      if (!s) return;
      cache.modify({
        id: cache.identify({ __typename: 'Song', _id: s._id }),
        fields: {
          likesCount: () => s.likesCount,
          likedByMe: () => s.likedByMe,
        },

      });
      setDisplayLikes(getSongLikesCount(s));
      setDisplayLikedByMe(s.likedByMe);
      const dailyMixId = cache.identify({ __typename: 'DailyMixTrack', _id: s._id });
      if (dailyMixId) {
        cache.modify({
          id: dailyMixId,
          fields: {
            likesCount: () => s.likesCount,
            likedByMe: () => s.likedByMe,
          },
        });
        setDisplayLikes(getSongLikesCount(s));
        setDisplayLikedByMe(s.likedByMe);
      }
    },
    // Important: don't refetch queries; that causes the snap-back you observed
    refetchQueries: [],
  });

  


  const handleClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      onRequireAuth?.();
      setFeedbackMessage('You need to login to like the song');
      setFeedbackOpen(true);
      return;
    }
    if (!songId) return;

    const previousLikes = displayLikes;
    const previousLikedByMe = displayLikedByMe;
    const nextLikedByMe = !previousLikedByMe;
    const nextLikes = Math.max(0, previousLikes + (nextLikedByMe ? 1 : -1));

    isTogglingRef.current = true;
    setDisplayLikes(nextLikes);
    setDisplayLikedByMe(nextLikedByMe);

    try {
      const { data } = await toggleLike({
        variables: { songId },
        optimisticResponse: {
          toggleLikeSong: {
            __typename: 'Song',
            _id: songId,
            title: song?.title ?? '',
            likesCount: nextLikes,
            likedByMe: nextLikedByMe,
            streamAudioFileUrl: song?.streamAudioFileUrl ?? song?.audioUrl ?? null,
            genre: song?.genre ?? null,
            artwork: song?.artwork ?? song?.artworkUrl ?? null,
            album: song?.album
              ? { __typename: 'Album', _id: String(song.album._id ?? song.albumId ?? ''), title: song.album.title ?? '' }
              : null,
            artist: song?.artistId || song?.artist
              ? {
                  __typename: 'Artist',
                  _id: String(song.artist?._id ?? song.artistId ?? ''),
                  artistAka: song.artist?.artistAka ?? song.artistName ?? ''
                }
              : null
          }
        },
      });
      const updatedSong = data?.toggleLikeSong;
      if (updatedSong) {
        setDisplayLikes(getSongLikesCount(updatedSong));
        setDisplayLikedByMe(Boolean(updatedSong.likedByMe));
      }
    } catch (err) {
      setDisplayLikes(previousLikes);
      setDisplayLikedByMe(previousLikedByMe);
      if (err?.message?.includes('Unauthorized')) {
        // Already handled by modal — do nothing
      } else {
        console.error('[like] toggle failed:', err);
      }
    } finally {
      isTogglingRef.current = false;
    }
  };



  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        size="small"
        onClick={handleClick}
        disabled={loading}
        sx={{
          width: 32, height: 32,
          backgroundColor: 'rgba(255,255,255,0.08)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.16)' },
        }}
      >
        {displayLikedByMe ? <ThumbUpOffAltIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      </IconButton>



      <Typography variant="caption" sx={{ color: '#E4C421', fontWeight: 600 }}>
        {displayLikes}
      </Typography>

      <Feedback
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title={
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <PanToolRoundedIcon sx={{ fontSize: 40, color: '#E4C421' }} />
            Login Required
          </Typography>
        }
        message={feedbackMessage}
      />
    </Box>
  );
}
