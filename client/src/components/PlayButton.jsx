



import Button from "@mui/material/Button"
import useTheme from '@mui/material/styles/useTheme';
import {PlayArrow, Pause} from '@mui/icons-material';


export const PlayButton = ({handlePrimaryPlay, isArtistTrackPlaying, playableTrack }) => {


const theme = useTheme();
  const primary = theme.palette.primary.main;
   const onPrimary = theme.palette.getContrastText(primary);
    return(
        <>


                <Button
              variant="contained"
              startIcon={isArtistTrackPlaying ? <Pause /> : <PlayArrow />}
              onClick={handlePrimaryPlay}
              disabled={!playableTrack}
              sx={{
                bgcolor: primary,
                color: onPrimary,
                borderRadius: 10,
                textTransform: 'none',
                fontWeight: 800,
                px: { xs: 2.5, sm: 3, md: 4 },
                py: { xs: 1, sm: 1.2, md: 1.5 },
                minWidth: { xs: 140, sm: 160, md: 200, lg: 240 },
                minHeight: { xs: 44, sm: 48, md: 56, lg: 64 },
                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.05rem' },
                '&:hover': { transform: 'scale(1.02)' },
                '&:active': { transform: 'scale(0.98)' },
                transition: 'transform 0.2s ease',
              }}
            >
              {isArtistTrackPlaying ? 'Playing' : 'Play'}
            </Button>
        </>
    )
    
}