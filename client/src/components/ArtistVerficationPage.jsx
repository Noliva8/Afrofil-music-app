import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ArtistAuth from '../utils/artist_auth'; 
import { useNavigate } from 'react-router-dom';

const ArtistVerificationPage = () => {
  const [artistAka, setArtistAka] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Loading profile...');
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();

  useEffect(() => {
    const profile = ArtistAuth.getProfile();
    console.log(profile);

    if (profile) {
      const { artistAka, email, confirmed, selectedPlan } = profile.data;

      // Set the artist's profile data
      setArtistAka(artistAka);
      setEmail(email);
      setStatus(''); 
      setLoading(false); // Set loading to false after fetching profile

      // Redirect based on confirmation and selected plan
      if (confirmed) {
        if (selectedPlan) {
          navigate('/artist/dashboard');
        } else {
          navigate('/artist/plan');
        }
      }
    } else {
      setStatus('There was an issue with your token. Please try again later.');
      setLoading(false); // Stop loading if there is an issue
    }
  }, [navigate]);

  if (loading) {
    return <Typography variant="body1">Loading...</Typography>; // Show loading text while fetching
  }

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
          <Typography variant="body1" color="textSecondary">
            Please click on the link we just emailed to <strong>{email}</strong> to verify your account.
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