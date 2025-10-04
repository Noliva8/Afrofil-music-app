import Box from '@mui/material/Box';
import { IconButton } from '@mui/material';
import Typography from '@mui/material/Typography'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';


export default function ShowAllButton(handleShowAll){
    return(
         <IconButton sx={{mb: 3}} onClick={handleShowAll}>

      <Typography variant='body2' sx={{color: 'var(--button-color)'}}>Show all</Typography>

              </IconButton>
    )
}