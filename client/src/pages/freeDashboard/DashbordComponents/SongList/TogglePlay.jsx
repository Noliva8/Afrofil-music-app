import { useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Box from '@mui/material/Box';

export default function AudioPlayer({ song, audioUrl, playingSongId, setPlayingSongId, setVolumeRef }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      // Expose the ref to parent for volume control
      setVolumeRef && setVolumeRef(audioRef);
    }
  }, [setVolumeRef]);

  useEffect(() => {
    if (playingSongId === song._id) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
    }
  }, [playingSongId, song._id]);

  const togglePlay = () => {
    if (playingSongId === song._id) {
      setPlayingSongId(null);
    } else {
      setPlayingSongId(song._id);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onEnded={() => setPlayingSongId(null)}
        onError={(e) => console.error('❌ Audio error:', song.title, e.target.error)}
      />
      <Box
        sx={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: '#f07a22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: '#ff8a3d',
          },
        }}
      >
        <IconButton
          onClick={togglePlay}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          {playingSongId === song._id ? (
            <PauseIcon sx={{ fontSize: 30 }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: 30 }} />
          )}
        </IconButton>
      </Box>
    </>
  );
}
