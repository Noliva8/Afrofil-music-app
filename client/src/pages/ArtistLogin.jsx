import './CSS/signup.css'
import { ARTIST_LOGIN } from '../utils/mutations';
import * as React from 'react';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
// import Link from '@mui/material/Link';
import { Link } from "react-router-dom";
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { SitemarkIcon, FacebookIcon, GoogleIcon } from '../components/themeCustomization/customIcon';
import AppTheme from '../components/theme';
import ArtistAuth from '../utils/artist_auth';
import { useNavigate } from 'react-router-dom';





const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));



const ArtistLoginContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function ArtistLogin() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [login] = useMutation(ARTIST_LOGIN); // Assuming you have the ARTIST_LOGIN mutation defined

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };
  

const handleFormSubmit = async (event) => {
  event.preventDefault();

  try {
    // Log the formState to ensure the data is correct
    // console.log('Form State:', formState);
    
    const { data } = await login({
      variables: { ...formState }, 
    });

    // Check if the login was successful
    if (data && data.artist_login) {
      const { artistToken } = data.artist_login;

      // Save the token using your artist_auth service
      ArtistAuth.login(artistToken);
     

      // Fetch the profile to check the confirmed status
       const profile = ArtistAuth.getProfile();
       
   

      if (profile && profile.data && profile.data.confirmed) {
        setLoginErrorMessage('');
        navigate('/artist/dashboard');
      } else {
        // console.log('Artist is NOT confirmed or profile data is missing');
        navigate('/artist/verification'); 
      }
    } else {
      setLoginErrorMessage('Login failed. Please check your credentials.');
    }

  } catch (e) {
    console.error('ApolloError:', e.message);
    if (e.graphQLErrors) {
      e.graphQLErrors.forEach((error) => console.error('GraphQL Error:', error.message));
      setLoginErrorMessage('Invalid email or password. Please try again.');
    }
    if (e.networkError) {
      console.error('Network Error:', e.networkError.message);
      setLoginErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  // Clear form values only if the login was successful
  setFormState({
    email: '',
    password: '',
  });
};

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <ArtistLoginContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Sign in
          </Typography>

          <Box
            component="form"
            onSubmit={handleFormSubmit} 
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            {/* Email */}
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                onChange={handleChange}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
              />
            </FormControl>

            {/* Password */}
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                onChange={handleChange}
                id="password"
                type="password"
                name="password"
                placeholder="......"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
              />
            </FormControl>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
            >
              Sign in
            </Button>

            {/* Error Message */}
            {loginErrorMessage && (
              <Typography
                color="error"
                variant="body2"
                sx={{ marginTop: 1, textAlign: 'center' }}
              >
                {loginErrorMessage}
              </Typography>
            )}
          </Box>

          <Divider>or</Divider>

          {/* Other login options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Google')}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Facebook')}
            >
              Sign in with Facebook
            </Button>

            
                <Typography
              component={Link}
              to="/artist/register" 
              variant="contained"
              className='artistRegistAccount'
              color="primary"
              sx={{ textTransform: "none" }}
            >
              Don't have an account?
            </Typography>
           
          </Box>
        </Card>
      </ArtistLoginContainer>
    </AppTheme>
  );
}

