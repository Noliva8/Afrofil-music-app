import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import {
  CheckCircleOutline,
  ErrorOutline,
  PauseCircleOutline,
  CloudUpload,
  Warning,
  Block
} from '@mui/icons-material';



const SongUploadProgressComponent = ({ uploadState, loading, error }) => {
  const { progress, status, message, step } = uploadState;

  const statusConfig = {
    PENDING: { color: 'info', icon: <PauseCircleOutline /> },
    IN_PROGRESS: { color: 'info', icon: <CloudUpload /> },
    COMPLETED: { color: 'success', icon: <CheckCircleOutline /> },
    FAILED: { color: 'error', icon: <ErrorOutline /> },
    DUPLICATE: { color: 'warning', icon: <Warning /> },
    COPYRIGHT_ISSUE: { color: 'error', icon: <Block /> },
    SUCCESS: { color: 'success', icon: <CheckCircleOutline /> },
  
  };

  // Only render if there's active upload or status
  const shouldShow = Boolean(loading || error || status);


  if (!shouldShow) {
    return null; // Don't render anything when inactive
  }

  return (
    <Fade in={shouldShow} timeout={500}>
      <Paper elevation={3} sx={{ 
        p: 3, 
        borderRadius: 2,
        backgroundColor: 'var(--secondary-background-color)',
       
        width: '100%',
        minWidth: 300, // Prevent container from collapsing
        visibility: shouldShow ? 'visible' : 'hidden' // Double protection
      }}>
        <Stack spacing={3}>
          {loading && !status && (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Alert severity="error">
              {error.message}
            </Alert>
          )}

          {status && (
            <>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Upload Status</Typography>
                <Chip
                  icon={statusConfig[status]?.icon}
                  label={status.replace(/_/g, ' ')}
                  color={statusConfig[status]?.color || 'default'}
                />
              </Box>
              
              <LinearProgress
                variant={progress ? "determinate" : "indeterminate"}
                value={progress || 0}
                color={statusConfig[status]?.color}
                sx={{ height: 8 }}
              />
              
              {message && (
                <Alert severity={
                  status === 'FAILED' ? 'error' : 
                  status === 'DUPLICATE' || status === 'COPYRIGHT_ISSUE' ? 'warning' : 
                  'info'
                }>
                  {message}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Fade>
  );
};

export default SongUploadProgressComponent;