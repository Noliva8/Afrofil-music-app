
import '../pages/CSS/loginSignin.css';
import logo from '../images/logo.png';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useMutation } from '@apollo/client';
import {  ARTIST_LOGIN, CREATE_ARTIST } from '../utils/mutations';
import artist_auth from '../utils/artist_auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// Material UI
// ----------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../components/theme';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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


export default function ArtistRegister() {
  const [signupFormState, setSignupFormState] = useState({
    fullName: '',
    artistAka: '',
    email: '',
    password: '',
  });
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [createArtist] = useMutation(CREATE_ARTIST);

  const navigate = useNavigate();

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupFormState({ ...signupFormState, [name]: value });
  };

  const handleTermsChange = (event) => {
    setIsTermsChecked(event.target.checked);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowPasswordSignup((prevState) => !prevState);
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (!isTermsChecked) {
      setSignupErrorMessage("You must agree to the terms and conditions.");
      return;
    }

    try {
      const { data } = await createArtist({
        variables: { ...signupFormState },
      });


     console.log(data);

      
     artist_auth.login(data.createArtist.artistToken);


      setSignupErrorMessage('');
      setSignupFormState({ fullName: '', artistAka: '', email: '', password: '' });
    } catch (e) {
      setSignupErrorMessage("Signup failed. Please ensure your details are correct.");
      console.error(e);
    }
  };

  return (
    <AppTheme>
      <SignUpContainer direction="column" justifyContent="space-between" bgcolor="#333">
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography component="h1" variant="h4" sx={{ fontSize: 'clamp(2rem, 10vw, 2.6rem)' }}>
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSignupSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {/* Full Name */}
            <FormControl>
              <FormLabel htmlFor="fullName">Full name</FormLabel>
              <TextField
                name="fullName"
                required
                fullWidth
                onChange={handleSignupChange}
                value={signupFormState.fullName}
                placeholder="Logan Keron"
              />
            </FormControl>

            {/* Stage Name */}
            <FormControl>
              <FormLabel htmlFor="artistAka">Stage name</FormLabel>
              <TextField
                name="artistAka"
                required
                fullWidth
                onChange={handleSignupChange}
                value={signupFormState.artistAka}
                placeholder="Loka"
              />
            </FormControl>

            {/* Email */}
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                name="email"
                required
                fullWidth
                onChange={handleSignupChange}
                value={signupFormState.email}
                placeholder="your@email.com"
              />
            </FormControl>

            {/* Password */}
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                name="password"
                required
                fullWidth
                type={showPasswordSignup ? 'text' : 'password'}
                onChange={handleSignupChange}
                value={signupFormState.password}
                placeholder="••••••"
                InputProps={{
                  endAdornment: (
                    <FontAwesomeIcon
                      icon={showPasswordSignup ? faEye : faEyeSlash}
                      style={{ cursor: 'pointer', marginRight: '10px' }}
                      onClick={toggleSignupPasswordVisibility}
                    />
                  ),
                }}
              />
            </FormControl>

            {/* Terms Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isTermsChecked}
                  onChange={handleTermsChange}
                  color="primary"
                />
              }
              label="I have read terms and conditions of using Afrofeel."
            />

            <Button type="submit" fullWidth variant="contained">
              Sign up
            </Button>
          </Box>
          {signupErrorMessage && (
            <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
              {signupErrorMessage}
            </Typography>
          )}
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
