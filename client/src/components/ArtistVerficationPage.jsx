import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ArtistAuth from '../utils/artist_auth'; // Adjust the import based on your file structure

const ArtistVerificationPage = () => {
  const [artistAka, setArtistAka] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Loading profile...');

  useEffect(() => {
    // Fetch artist profile from the token using ArtistAuth
    const profile = ArtistAuth.getProfile();

    console.log('Fetched Profile:', profile); // Debugging: log the profile

    if (profile) {
      setArtistAka(profile.data.artistAka);
      setEmail(profile.data.email);
      setStatus(''); // Remove the loading message once profile is set
    } else {
      setStatus('There was an issue with your token. Please try again later.');
    }
  }, []);

  return (
    <Box sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography variant="h4" color="textPrimary" paragraph>
        Welcome to Afrofeel, {artistAka}!
      </Typography>
      {artistAka && email ? (
        <div>
          <Typography variant="h6" color="textSecondary">
            You are all set.
          </Typography>
          <Typography variant="body1" color="textSecondary" >
            Please click on the link we just emailed to  <strong>{email}</strong> to verify your account.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Don't see our email? Check your spam/junk folder.
          </Typography>
        </div>
      ) : (
        <Typography variant="body1" color="error">
          {status}
        </Typography>
      )}
    </Box>
  );
};

export default ArtistVerificationPage;
