import './CSS/signup.css'
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
import { styled } from '@mui/material/styles';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
// Icons pulled from brand set if needed later; kept minimal for now.
import ArtistAuth from '../utils/artist_auth';
import { useNavigate } from 'react-router-dom';




const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...(theme.palette.mode === 'dark' && {
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
  position: 'relative',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  backgroundColor: theme.palette.background.default,
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      theme.palette.mode === 'dark'
        ? 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
        : 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
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
//     // console.log('Form State:', formState);
    
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
//         // console.log('Artist is NOT confirmed or profile data is missing');
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

    
      ArtistAuth.login(artistToken);

      // 🧹 CLEAN UP TEMPORARY CACHE
      console.log('🧹 Cleaning up temporary plan data after login');
      localStorage.removeItem('artistProfile');
      
      // Fetch the profile to check the confirmed status
      const profile = ArtistAuth.getProfile();

      if (profile && profile.data && profile.data.confirmed) {
        setLoginErrorMessage('');
        navigate('/artist/studio/home');
      } else {
        // console.log('Artist is NOT confirmed or profile data is missing');
        navigate('/artist/verification');
      }
    } else {
      setLoginErrorMessage('Login failed. Please check your credentials.');
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
  }

  // Clear form values only if the login was successful
  setFormState({
    email: '',
    password: '',
  });
};



  return (
    <ArtistLoginContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: 'flex-start' }} />
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Sign in
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: (theme) => theme.typography.fontFamily, mb: 1 }}
        >
          For creators only—unlock your studio and artist tools.
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
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Google')}
          >
            Sign in with Google
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
