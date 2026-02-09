import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArtistAuth from '../utils/artist_auth';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem'
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

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={showAccountMenu}
      onClose={handleShowMobileMenu}
      sx={{
        display: { xs: handleShowMobileMenu ? 'block' : 'none' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'var(--primary-background-color)',
        },
        zIndex: '9999',
      }}
    >
      <Paper sx={{ padding: '1rem' , bgcolor: 'var(--secondary-background-color)'}}>
        <Button onClick={handleShowMobileMenu} sx={{ marginBottom: '1rem' }}>
          <ArrowBackIosIcon />
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profile Section */}
          <Paper
            elevation={2}
            sx={{
              width: '90%',
              margin: '0 auto',
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-background-color)',
              borderRadius: '10px',
            }}
          >
            <Box sx={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
              <Avatar src={profileImage} sx={{ width: 60, height: 60 }} />
              <Box>
                <Typography sx={{ color: 'var(--primary-font-color)' }} variant="h6">
                  {artistProfile.fullName}
                </Typography>
                <Typography sx={{ color: 'var(--primary-font-color)' }} variant="body2">
                  {artistProfile.email}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ margin: '1rem 0', backgroundColor: 'var(--divider-color)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', marginTop: '1rem' }}>
              <Typography sx={{ marginRight: '1rem', color: 'var(--primary-font-color)' }} variant="body2">
                A K A :
              </Typography>
              <Typography sx={{ color: 'var(--primary-font-color)' }} variant="h6">
                {artistProfile.artistAka}
              </Typography>
            </Box>
          </Paper>

          {/* Location Section */}
          <Paper
            elevation={2}
            sx={{
              width: '90%',
              margin: '0 auto',
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-background-color)',
              borderRadius: '10px',
            }}
          >
            <Box sx={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ color: 'var(--primary-font-color)' }} variant="h6">
                  Country:  {artistProfile.country}
                </Typography>


               
    <Typography sx={{ color: "var(--primary-font-color)" }} variant="h6">
  Languages:
</Typography>
<List
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: 0,
    listStyle: "none",
  }}
>
  {artistProfile.languages?.length > 0 ? (
    artistProfile.languages.map((language, index) => (
      <ListItem
        key={index}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--primary-background-color)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "16px",
          fontSize: "0.875rem",
          fontWeight: "bold",
          textTransform: "capitalize",
          border: "1px solid var(--divider-color)",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "white",
            color: "black",
          },
        }}
      >
        {language}
      </ListItem>
    ))
  ) : (
    <Typography sx={{ color: "gray", fontSize: "0.875rem" }}>Not available</Typography>
  )}
</List>



              </Box>
            </Box>
            <Divider sx={{ margin: '1rem 0', backgroundColor: 'var(--divider-color)' }} />
          </Paper>

          {/* Terms of Use Section */}
          <Paper
            elevation={2}
            sx={{
              width: '90%',
              margin: '0 auto',
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-background-color)',
              borderRadius: '10px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'var(--primary-font-color)', fontWeight: 'bold' }}>
                Terms of Use
              </Typography>
              <Divider sx={{ marginBottom: '1rem', backgroundColor: 'var(--divider-color)' }} />
              <Button sx={{ color: 'var(--primary-font-color)', textTransform: 'none' }}>Read More</Button>
            </Box>
          </Paper>

          <Paper
            elevation={2}
            sx={{
              width: '90%',
              margin: '0 auto',
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-background-color)',
              borderRadius: '10px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--primary-font-color)', fontWeight: 'bold' }}>
                Booking controls
              </Typography>
              <Typography sx={{ color: 'var(--primary-font-color)', fontSize: '0.9rem' }}>
                Currently {bookingEnabled ? 'accepting' : 'not accepting'} bookings
              </Typography>

              <Button
                variant={bookingEnabled ? 'outlined' : 'contained'}
                color={bookingEnabled ? 'secondary' : 'primary'}
                onClick={handleToggleBooking}
                disabled={togglingBooking}
                sx={{ textTransform: 'none' }}
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
            sx={{
              width: '90%',
              margin: '0 auto',
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-background-color)',
              borderRadius: '10px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'var(--primary-font-color)', fontWeight: 'bold' }}>
                Advertisement
              </Typography>
              <Divider sx={{ marginBottom: '1rem', backgroundColor: 'var(--divider-color)' }} />
              <Button sx={{ color: 'var(--primary-font-color)', textTransform: 'none' }}>
                Ads in your content
              </Button>
            </Box>
          </Paper>

          {/* Logout Section */}

       <Paper
  elevation={0}
  sx={{
    width: '90%',
    margin: '0 auto',
    marginTop: '3rem',
    padding: '2rem',
    backgroundColor: 'var(--secondary-background-color)',
  }}
>

  <Button
   onClick={handleLogout}
    sx={{
        borderRadius:'10px',
      color: 'white',
      width: '100%',  
      padding: '1rem',  
      fontSize: '1.1rem',  
      backgroundColor: 'var( --primary-background-color)',  
      '&:hover': {
        backgroundColor: 'white', 
        color: 'black' 
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
