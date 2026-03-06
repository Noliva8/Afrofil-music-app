
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const UserSettings = () => {
  const location = useLocation();
const theme = useTheme();
const textColor = theme.palette.text.primary;


  useEffect(() => {
    const targetId = location.hash?.replace('#', '').trim();
    const scrollTarget = targetId || 'user-settings-page';
    setTimeout(() => {
      const element = document.getElementById(scrollTarget);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  }, [location.hash]);
  return (
    <Box
      id="user-settings-page"
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
      }}
    >
      <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ color: textColor, textAlign: 'center' }}>
        Settings are coming soon.
      </Typography>





    </Box>
  );
};

export default UserSettings;
