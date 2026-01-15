import {
  Shuffle,
} from '@mui/icons-material';
import Button from '@mui/material/Button';



export const ShuffleButton = ({playableTrack, isShuffled})=> {

    
    return(
        <>
        
           <Button
                      variant="outlined"
                      startIcon={<Shuffle />}
                      disabled={!playableTrack}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: '#fff',
                        bgcolor: 'transparent',
                        borderRadius: 10,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        px: { xs: 2, sm: 2.5, md: 3 },
                        py: { xs: 0.8, sm: 1, md: 1.2 },
                        minWidth: { xs: 120, sm: 140, md: 160, lg: 180 },
                        minHeight: { xs: 40, sm: 44, md: 48, lg: 52 },
                        fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.6)',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Shuffle
                    </Button>
                
        </>
    )
}