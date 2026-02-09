import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography'


export default function ShowAllButton(handleShowAll){
    return(
         <IconButton sx={{mb: 3}} onClick={handleShowAll}>

      <Typography variant='body2' sx={{color: 'var(--button-color)'}}>Show all</Typography>

              </IconButton>
    )
}