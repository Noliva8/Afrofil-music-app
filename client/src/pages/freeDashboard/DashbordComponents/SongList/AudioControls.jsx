import React from 'react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import './toggleplay.css';

export default function AudioControls({ songId, playingSongId, volume, setVolume }) {
  return (
    <>
      {playingSongId === songId && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <div className="audio-bars">
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
          </div>
          <VolumeUpIcon fontSize="small" sx={{ mx: 1 }} />
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(_, newVal) => setVolume(newVal)}
            sx={{ width: 80 }}
          />
        </Box>
      )}
    </>
  );
}
