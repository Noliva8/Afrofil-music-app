import { ARTIST_LOGIN } from '../utils/mutations';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
// import Link from '@mui/material/Link';
import { Link } from "react-router-dom";
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
// Icons pulled from brand set if needed later; kept minimal for now.
import ArtistAuth from '../utils/artist_auth';
import UserAuth from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import InputAdornment from '@mui/material/InputAdornment';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle.jsx';

import { useApolloClient } from '@apollo/client';









const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  gap: theme.spacing(2),
  margin: 'auto',
  background: alpha(theme.palette.background.paper || '#111119', 0.95),
  backdropFilter: 'blur(12px)',
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: theme.shadows[2],
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.up('sm')]: {
    maxWidth: '480px',
  },
}));



const ArtistLoginContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4, 2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(6, 3),
  },
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  background: `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `,
}));



// export default function ArtistLogin() {
//   const [formState, setFormState] = useState({ email: '', password: '' });
//   const [loginErrorMessage, setLoginErrorMessage] = useState('');
//   const [login] = useMutation(ARTIST_LOGIN); // Assuming you have the ARTIST_LOGIN mutation defined

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormState({
//       ...formState,
//       [name]: value,
//     });
//   };
  
// const handleFormSubmit = async (event) => {
//   event.preventDefault();

//   try {
//     // Log the formState to ensure the data is correct
    
//     const { data } = await login({
//       variables: { ...formState },
//     });

//     // Check if the login was successful
//     if (data && data.artist_login) {
//       const { artistToken } = data.artist_login;

//       // Save the token using your artist_auth service
//       ArtistAuth.login(artistToken);

//       // Fetch the profile to check the confirmed status
//       const profile = ArtistAuth.getProfile();

//       if (profile && profile.data && profile.data.confirmed) {
//         setLoginErrorMessage('');
//       } else {
//       }
//     } else {
//       setLoginErrorMessage('Login failed. Please check your credentials.');
//     }

//   } catch (e) {
//     console.error('ApolloError:', e.message);
    
//     // Log specific GraphQL errors
//     if (e.graphQLErrors) {
//       e.graphQLErrors.forEach((error) => {
//         console.error('GraphQL Error:', error.message);
//       });
//       setLoginErrorMessage('Invalid email or password. Please try again.');
//     }
    
//     // Log network errors
//     if (e.networkError) {
//       console.error('Network Error:', e.networkError.message);
//       setLoginErrorMessage('Network error. Please check your connection and try again.');
//     }
    
//     // Handle any general errors
//     if (!e.graphQLErrors && !e.networkError) {
//       console.error('Unexpected Error:', e);
//       setLoginErrorMessage('An unexpected error occurred. Please try again later.');
//     }
//   }

//   // Clear form values only if the login was successful
//   setFormState({
//     email: '',
//     password: '',
//   });
// };




//   return (
//     <ArtistLoginContainer direction="column" justifyContent="space-between">
//       <Card variant="outlined">
//         <Typography
//           component="h1"
//           variant="h4"
//           sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
//         >
//           Sign in
//         </Typography>

//         <Box
//           component="form"
//           onSubmit={handleFormSubmit} 
//           noValidate
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             width: "100%",
//             gap: 2,
//           }}
//         >
//           {/* Email */}
//           <FormControl>
//             <FormLabel htmlFor="email">Email</FormLabel>
//             <TextField
//               onChange={handleChange}
//               id="email"
//               type="email"
//               name="email"
//               placeholder="your@email.com"
//               autoComplete="email"
//               autoFocus
//               required
//               fullWidth
//               variant="outlined"
//               value={formState.email}
//             />
//           </FormControl>

//           {/* Password */}
//           <FormControl>
//             <FormLabel htmlFor="password">Password</FormLabel>
//             <TextField
//               onChange={handleChange}
//               id="password"
//               type="password"
//               name="password"
//               placeholder="......"
//               autoComplete="current-password"
//               required
//               fullWidth
//               variant="outlined"
//               value={formState.password}
//             />
//           </FormControl>

//           {/* Submit Button */}
//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//           >
//             Sign in
//           </Button>

//           {/* Error Message */}
//           {loginErrorMessage && (
//             <Typography
//               color="error"
//               variant="body2"
//               sx={{ marginTop: 1, textAlign: 'center' }}
//             >
//               {loginErrorMessage}
//             </Typography>
//           )}
//         </Box>

//         <Divider>or</Divider>

//         {/* Other login options */}
//         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//           <Button
//             fullWidth
//             variant="outlined"
//             onClick={() => alert('Sign in with Google')}
//           >
//             Sign in with Google
//           </Button>
//           <Button
//             fullWidth
//             variant="outlined"
//             onClick={() => alert('Sign in with Facebook')}
//           >
//             Sign in with Facebook
//           </Button>

          
//               <Typography
//           component={Link}
//           to="/artist/register" 
//           variant="contained"
//           className='artistRegistAccount'
//           color="primary"
//           sx={{ textTransform: "none" }}
//         >
//           Don't have an account?
//         </Typography>
       
//         <Button
//           component={Link}
//           to="/"
//           variant="text"
//           color="inherit"
//           sx={{ mt: 1, alignSelf: 'center' }}
//         >
//           ← Back to home
//         </Button>
//         </Box>
//       </Card>
//     </ArtistLoginContainer>
//   );
// }




export default function ArtistLogin() {
  const navigate = useNavigate(); 
  const theme = useTheme();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { reset }] = useMutation(ARTIST_LOGIN); // Assuming you have the ARTIST_LOGIN mutation defined

  // Inside your component:
const client = useApolloClient();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  const labelSx = {
    color: theme.palette.text.secondary,
    mb: 1,
    fontSize: 14,
  };
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      color: theme.palette.text.primary,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      '& fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.2),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.45),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: alpha(theme.palette.text.secondary, 0.75),
      opacity: 1,
    },
  };
  
// const handleFormSubmit = async (event) => {
//   event.preventDefault();
//   reset();
//   setLoginErrorMessage('');

//   try {
//     // Log the formState to ensure the data is correct
    
//     const { data } = await login({
//       variables: { ...formState },
//         fetchPolicy: 'network-only',
//     });

//     // Check if the login was successful
//     if (data && data.artist_login) {
//       const { artistToken } = data.artist_login;

    
//       ArtistAuth.login(artistToken);

//       // 🧹 CLEAN UP TEMPORARY CACHE
//       localStorage.removeItem('artistProfile');
      
//       // Fetch the profile to check the confirmed status
//       const profile = ArtistAuth.getProfile();

//       if (profile && profile.data && profile.data.confirmed) {
//         setLoginErrorMessage('');
//         navigate('/artist/studio/home');
//       } else {
//         navigate('/artist/verification');
//       }
//     } else {
//       setLoginErrorMessage('Login failed. Please check your credentials.');
//     }

//     } catch (e) {
//     console.error('ApolloError:', e.message);
    
//     // Log specific GraphQL errors
//     if (e.graphQLErrors) {
//       e.graphQLErrors.forEach((error) => {
//         console.error('GraphQL Error:', error.message);
//       });
//       setLoginErrorMessage('Invalid email or password. Please try again.');
//     }
    
//     // Log network errors
//     if (e.networkError) {
//       console.error('Network Error:', e.networkError.message);
//       setLoginErrorMessage('Network error. Please check your connection and try again.');
//     }
    
//     // Handle any general errors
//     if (!e.graphQLErrors && !e.networkError) {
//       console.error('Unexpected Error:', e);
//       setLoginErrorMessage('An unexpected error occurred. Please try again later.');
//     }
//   }

//   // Clear form values only if the login was successful
//   setFormState({
//     email: '',
//     password: '',
//   });
// };


const handleFormSubmit = async (event) => {
  event.preventDefault();
  reset();
  setLoginErrorMessage('');

  try {
    const { data } = await login({
      variables: { ...formState },
      // Add this to prevent caching of failed attempts
      fetchPolicy: 'network-only',
    });

    // Check if the login was successful
    if (data && data.artist_login) {
      const { artistToken, userToken } = data.artist_login;

      ArtistAuth.login(artistToken);
      if (userToken) {
        UserAuth.setToken(userToken);
      }

      // 🧹 CLEAN UP TEMPORARY CACHE
      localStorage.removeItem('artistProfile');
      
      // Clear Apollo cache for sensitive queries
      await client.clearStore();
      
      // Fetch the profile to check the confirmed status
      const profile = ArtistAuth.getProfile();

      if (profile && profile.data && profile.data.confirmed) {
        setLoginErrorMessage('');
        // Clear form state on success
        setFormState({
          email: '',
          password: '',
        });
        navigate('/artist/studio/home');
      } else {
        navigate('/artist/verification');
      }
    } else {
      setLoginErrorMessage('Login failed. Please check your credentials.');
      // Don't clear form on failure - let user see what they typed
      // Only clear password for security
      setFormState(prev => ({
        ...prev,
        password: '',
      }));
    }

  } catch (e) {
    console.error('ApolloError:', e.message);
    
    // Log specific GraphQL errors
    if (e.graphQLErrors) {
      e.graphQLErrors.forEach((error) => {
        console.error('GraphQL Error:', error.message);
      });
      setLoginErrorMessage('Invalid email or password. Please try again.');
    }
    
    // Log network errors
    if (e.networkError) {
      console.error('Network Error:', e.networkError.message);
      setLoginErrorMessage('Network error. Please check your connection and try again.');
    }
    
    // Handle any general errors
    if (!e.graphQLErrors && !e.networkError) {
      console.error('Unexpected Error:', e);
      setLoginErrorMessage('An unexpected error occurred. Please try again later.');
    }
    
    // Clear only the password field on error
    setFormState(prev => ({
      ...prev,
      password: '',
    }));
    
    // Optionally, reset the Apollo store to clear any cached state
    await client.resetStore();
  }
};


  return (
    <ArtistLoginContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: 'flex-start' }} />
        <Typography
          component="h1"
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontFamily: theme.typography.fontFamily,
            fontSize: "clamp(2rem, 8vw, 2.4rem)",
          }}
        >
          Continue to Creator Studio
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily, mb: 1 }}
        >
          Use the creator profile connected to your FloLup account.
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
            <FormLabel htmlFor="email" sx={labelSx}>Email</FormLabel>
            <TextField
              onChange={handleChange}
              id="email"
              type="email"
              name="email"
              placeholder="Add your email"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              value={formState.email}
              sx={textFieldSx}
            />
          </FormControl>

          {/* Password */}
          <FormControl>
            <FormLabel htmlFor="password" sx={labelSx}>Password</FormLabel>
            <TextField
              onChange={handleChange}
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Add your password"
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
              value={formState.password}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityToggle
                      show={showPassword}
                      onClick={toggleShowPassword}
                      sx={{ color: "inherit" }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.75,
              borderRadius: '8px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: theme.palette.primary.contrastText,
              fontSize: 16,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: theme.shadows[2],
              '&:hover': {
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="text"
            fullWidth
            sx={{
              textTransform: 'none',
              justifyContent: 'flex-start',
              color: (theme) => theme.palette.primary.main,
            }}
          >
            Forgot password?
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
          {/*
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Google')}
          >
            Sign in with Google
          </Button>
          */}

          
              <Typography
          component={Link}
          to="/artist/register" 
          variant="contained"
          className='artistRegistAccount'
          color="primary"
          sx={{ textTransform: "none" }}
        >
          Complete creator profile
        </Typography>
       
        <Button
          component={Link}
          to="/"
          variant="text"
          color="inherit"
          sx={{ mt: 1, alignSelf: 'center' }}
        >
          ← Back to home
        </Button>
        </Box>
      </Card>
    </ArtistLoginContainer>
  );
}
