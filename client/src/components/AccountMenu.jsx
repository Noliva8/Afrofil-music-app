import { alpha, styled, useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ArtistAuth from '../utils/artist_auth';
import { useMutation } from '@apollo/client';
import { TOGGLE_BOOKING_AVAILABILITY } from '../utils/mutations';



const drawerWidth = 440;

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

export default function AccountMenu({
  showAccountMenu,
  handleShowMobileMenu,
  profileImage,
  artistProfile,
}) {
  const theme = useTheme();
  const [bookingEnabled, setBookingEnabled] = useState(
    Boolean(artistProfile?.bookingAvailability ?? true)
  );

  useEffect(() => {
    if (artistProfile?.bookingAvailability !== undefined) {
      setBookingEnabled(Boolean(artistProfile.bookingAvailability));
    }
  }, [artistProfile?.bookingAvailability]);

  const [toggleBookingAvailability, { loading: togglingBooking }] =
    useMutation(TOGGLE_BOOKING_AVAILABILITY);




  const handleToggleBooking = async () => {
    const target = !bookingEnabled;
    try {
      const { data } = await toggleBookingAvailability({
        variables: { available: target },
      });
      const serverValue = data?.toggleBookingAvailability?.bookingAvailability;
      if (typeof serverValue === 'boolean') {
        setBookingEnabled(serverValue);
      } else {
        setBookingEnabled(target);
      }
    } catch (error) {
      console.error('Failed to toggle booking availability', error);
    }
  };




  const handleLogout = () => {
    ArtistAuth.logout();
  };

  const cardSx = {
    width: '100%',
    p: { xs: 2, sm: 2.5 },
    backgroundColor: alpha(theme.palette.background.paper, 0.88),
    color: theme.palette.text.primary,
    borderRadius: '8px',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: theme.shadows[2],
  };

  const dividerSx = {
    my: 2,
    borderColor: alpha(theme.palette.text.primary, 0.1),
  };

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={showAccountMenu}
      onClose={handleShowMobileMenu}
      sx={{
        display: { xs: handleShowMobileMenu ? 'block' : 'none' },
        [`& .${drawerClasses.paper}`]: {
          background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          color: theme.palette.text.primary,
          borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        },
        zIndex: '9999',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          minHeight: '100%',
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'transparent',
        }}
      >
        <Button
          onClick={handleShowMobileMenu}
          sx={{
            mb: 2,
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: '50%',
            color: theme.palette.text.primary,
            bgcolor: alpha(theme.palette.background.paper, 0.76),
            border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 0.96),
            },
          }}
          aria-label="Close account menu"
        >
          <ArrowBackIosIcon />
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Profile Section */}
          <Paper
            elevation={2}
            sx={cardSx}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar
                src={profileImage}
                sx={{
                  width: 64,
                  height: 64,
                  border: `2px solid ${theme.palette.common.white}`,
                  bgcolor: alpha(theme.palette.background.default, 0.72),
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800 }} variant="h6" noWrap>
                  {artistProfile.fullName}
                </Typography>
                <Typography sx={{ color: theme.palette.text.secondary }} variant="body2" noWrap>
                  {artistProfile.email}
                </Typography>
              </Box>
            </Box>
            <Divider sx={dividerSx} />
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 700 }} variant="body2">
                AKA
              </Typography>
              <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800 }} variant="h6" noWrap>
                {artistProfile.artistAka || 'Not available'}
              </Typography>
            </Box>
          </Paper>

          {/* Location Section */}
          <Paper
            elevation={2}
            sx={cardSx}
          >
            <Box>
                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800 }} variant="h6">
                  Country: {artistProfile.country || 'Not available'}
                </Typography>


               
    <Typography sx={{ color: theme.palette.text.primary, fontWeight: 800, mt: 1.5 }} variant="h6">
  Languages:
</Typography>
<Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    mt: 1,
  }}
>
  {artistProfile.languages?.length > 0 ? (
    artistProfile.languages.map((language, index) => (
      <Chip
        key={index}
        label={language}
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.14),
          color: theme.palette.text.primary,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
          fontWeight: 700,
          textTransform: "capitalize",
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.22),
          },
        }}
      />
    ))
  ) : (
    <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.875rem" }}>Not available</Typography>
  )}
</Box>



            </Box>
          </Paper>

          {/* Terms of Use Section */}
          <Paper
            elevation={2}
            sx={cardSx}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 800 }}>
                Terms of Use
              </Typography>
              <Divider sx={{ ...dividerSx, width: '100%' }} />
              <Button sx={{ color: theme.palette.text.primary, textTransform: 'none', fontWeight: 700 }}>Read More</Button>
            </Box>
          </Paper>

          <Paper
            elevation={2}
            sx={cardSx}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 800 }}>
                Booking controls
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem', textAlign: 'center' }}>
                Currently {bookingEnabled ? 'accepting' : 'not accepting'} bookings
              </Typography>

              <Button
                variant={bookingEnabled ? 'outlined' : 'contained'}
                onClick={handleToggleBooking}
                disabled={togglingBooking}
                sx={{
                  mt: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 800,
                  ...(bookingEnabled
                    ? {
                        color: theme.palette.text.primary,
                        borderColor: alpha(theme.palette.text.primary, 0.28),
                        '&:hover': {
                          borderColor: theme.palette.text.primary,
                          bgcolor: alpha(theme.palette.text.primary, 0.08),
                        },
                      }
                    : {
                        background: theme.palette.common.white,
                        color: theme.palette.common.black,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.common.white, 0.88),
                        },
                      }),
                }}
              >
                {togglingBooking
                  ? 'Saving...'
                  : bookingEnabled
                  ? 'Disable bookings'
                  : 'Enable bookings'}
              </Button>
            </Box>
          </Paper>

          {/* Advertisement Section */}
          <Paper
            elevation={2}
            sx={cardSx}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 800 }}>
                Advertisement
              </Typography>
              <Divider sx={{ ...dividerSx, width: '100%' }} />
              <Button sx={{ color: theme.palette.text.primary, textTransform: 'none', fontWeight: 700 }}>
                Ads in your content
              </Button>
            </Box>
          </Paper>

          {/* Logout Section */}

       <Paper
  elevation={0}
  sx={cardSx}
>

  <Button
   onClick={handleLogout}
    sx={{
      borderRadius:'8px',
      color: theme.palette.common.black,
      width: '100%',  
      padding: '1rem',  
      fontSize: '1.1rem',  
      fontWeight: 800,
      backgroundColor: theme.palette.common.white,  
      textTransform: 'none',
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.88), 
      },
    }}
  >
    Logout
  </Button>
</Paper>


        </Box>
      </Paper>
    </Drawer>
  );
}
