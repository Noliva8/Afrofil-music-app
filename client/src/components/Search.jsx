import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { alpha } from '@mui/material/styles';

export default function Search() {
  return (
    <FormControl sx={{ width: { xs: '100%', md: '30ch'} }} variant="outlined">
      <OutlinedInput
        size="small" 
        id="search"
        placeholder="Search…"
       

        sx={{
          flexGrow: 1,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
          borderRadius: '8px',
          color: 'text.primary',
          fontFamily: 'inherit',
          '& fieldset': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
          },
          '&:hover fieldset': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.45),
          },
          '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
          },
        }}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
  );
}
