// LikesComponent.jsx
import React, { useMemo, useState } from 'react';
import { IconButton, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useMutation } from '@apollo/client';
import { LIKES } from '../../utils/mutations';
import Feedback from '../Feedback';
import UserAuth from "../../utils/auth.js"
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';



export function LikesComponent({ song, onRequireAuth }) {
  
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  
  // Normalize inputs
  const songId = useMemo(() => String(song?.id ?? song?._id ?? song?.songId ?? ''), [song]);

  const likesCount = Number(song?.likesCount ?? 0);
  const likedByMe = Boolean(song?.likedByMe);

  const [toggleLike, { loading }] = useMutation(LIKES, {
    variables: { songId },
    // Instant UI update - but don't calculate likesCount optimistically
    optimisticResponse: {
      toggleLikeSong: {
        __typename: 'Song',
        _id: songId,
        title: song?.title ?? '',
        // DON'T calculate likesCount - let server determine the actual count
        likesCount: likesCount, // Keep current count until server responds
        likedByMe: !likedByMe, // Only toggle the boolean state
        // provide required subfields to match selection set
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
    },
    // Important: don't refetch queries; that causes the snap-back you observed
    refetchQueries: [],
  });

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!userId) {
      setFeedbackMessage('You need to login to like the song');
      setFeedbackOpen(true);
      return;
    }
    if (!songId) return;

    try {
      await toggleLike();
    } catch (err) {
      if (err?.message?.includes('Unauthorized')) {
        // Already handled by modal — do nothing
      } else {
        console.error('[like] toggle failed:', err);
      }
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
        {likedByMe ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      </IconButton>
      <Typography variant="caption" sx={{ color: '#E4C421', fontWeight: 600 }}>
        {likesCount}
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