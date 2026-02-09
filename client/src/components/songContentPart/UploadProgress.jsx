import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function UploadProgress() {
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Simulate progress updates
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer); 
          return prevProgress;
        }
        return prevProgress + 10; 
      });
    }, 800);

    return () => {
      clearInterval(timer);
    };
  }, []);




  return (
    <div>
      {progress < 100 && (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress variant="determinate" value={progress} />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
              {`${Math.round(progress)}%`}
            </Typography>
          </Box>
        </Box>
      )}
      {uploadComplete && <p>Upload Complete!</p>}
    </div>
  );
}
