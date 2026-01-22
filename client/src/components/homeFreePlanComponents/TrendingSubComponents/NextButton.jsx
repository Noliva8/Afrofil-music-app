import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function NextButton({ handleSlide}){
    return(
         <IconButton sx={{mb: 3}} onClick={handleSlide}>
        <Box border='2px solid var(--border-color)' color='var(--button-color)' display='flex' alignItems='center' justifyContent='center' borderRadius='50%' width='40px' height='40px' >
            <NavigateNextIcon  /></Box>

              </IconButton>
    )
}