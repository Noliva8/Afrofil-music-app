import logo from '../images/logo.png';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation} from "@apollo/client";
import { LOGIN_USER, CREATE_USER } from '../utils/mutations';
import UserAuth from '../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { NEW_UPLOADS_PUBLIC, SUGGESTED_SONGS_PUBLIC, SONG_OF_MONTH_PUBLIC, RADIO_STATIONS_PUBLIC } from '../utils/queries';
import MainMenu from '../components/MainMenu';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useTheme, alpha } from '@mui/material/styles';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { HORIZONTAL_LIMIT } from '../CommonSettings/songsRowNumberControl';

import { TRENDING_SONGS_PUBLICV2 } from '../utils/queries';
import FeedbackModal from '../components/FeedbackModal.jsx';

// simple helpers (matching the previously working version)
const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  const toggle = () => setState(prev => !prev);
  return [state, toggle];
};





const useFormState = (initialState) => {
  const [state, setState] = useState(initialState);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };
  const reset = () => setState(initialState);
  return [state, handleChange, reset];
};

const LoginSignin = function ({ display = '', onSwitchToLogin, onSwitchToSignup, isUserLoggedIn, onClose }) {
  const navigate = useNavigate();







  const handleBackHome = () => {
    onClose?.();
    navigate('/loginSignin');
  };

  const handleSwitchToLogin = () => {
    onSwitchToLogin?.();
    navigate('/loginSignin?login=1', { replace: true });
  };

  const handleSwitchToSignup = () => {
    onSwitchToSignup?.();
    navigate('/loginSignin?signup=1', { replace: true });
  };
  const theme = useTheme();
  const heroGradient = `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `;






  const {data: trendingSongsV2 , loading: trendingSongsLoadingV2, error: trendingSongsErrorV2} = 
  useQuery(TRENDING_SONGS_PUBLICV2, {
    variables: {limit: HORIZONTAL_LIMIT},
      pollInterval: 30000,
  notifyOnNetworkStatusChange: true,
  })




  const processedTrendingSongs = trendingSongsV2 ?.trendingSongsV2 || [];

  const { songsWithArtwork } = useSongsWithPresignedUrls(processedTrendingSongs);






const {data: newUploadsData} = useQuery(NEW_UPLOADS_PUBLIC, {
  variables: {limit: HORIZONTAL_LIMIT },
  pollInterval: 30000,
  notifyOnNetworkStatusChange: true,
});




  const { data: suggestedData } = useQuery(SUGGESTED_SONGS_PUBLIC, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
    variables: { limit: HORIZONTAL_LIMIT },
  });

  const { data: songOfMonthData } = useQuery(SONG_OF_MONTH_PUBLIC, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });
  const { data: radioStationsData } = useQuery(RADIO_STATIONS_PUBLIC, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });


  // Debug trendingSongs fetch to surface GraphQL errors and network state
  // React.useEffect(() => {
  //   if (loading) {
  //     console.log('[TrendingSongs] loading…');
  //     return;
  //   }
  //   if (error) {
  //     console.error('[TrendingSongs] error:', error);
  //     if (error.graphQLErrors?.length) {
  //       error.graphQLErrors.forEach((gqlErr, idx) =>
  //         console.error(`[TrendingSongs] graphQLErrors[${idx}]`, gqlErr.message, gqlErr)
  //       );
  //     }
  //     if (error.networkError) {
  //       console.error('[TrendingSongs] networkError:', error.networkError);
  //     }
  //   } else {
  //     console.log('[TrendingSongs] data:', data?.trendingSongs);
  //   }
  // }, [loading, error, data]);



  const { songsWithArtwork: newUploadsWithArtwork } = useSongsWithPresignedUrls(
    newUploadsData?.newUploads
  );
  const { songsWithArtwork: suggestedSongsWithArtwork } = useSongsWithPresignedUrls(
    suggestedData?.suggestedSongs
  );
  const songOfMonthSource = React.useMemo(
    () => (songOfMonthData?.songOfMonth ? [songOfMonthData.songOfMonth] : []),
    [songOfMonthData?.songOfMonth]
  );
  const { songsWithArtwork: songOfMonthWithArtwork } = useSongsWithPresignedUrls(
    songOfMonthSource
  );

  // const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  // const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);

// Signup & Login form states
const [signupFormState, handleSignupChange, resetSignup] = useFormState({
  username: '',
  email: '',
  password: ''
});
const [loginFormState, handleLoginChange, resetLogin] = useFormState({
  email: '',
  password: ''
});
const [agreedToTerms, setAgreedToTerms] = useState(false);

// Error messages
const [signupErrorMessage, setSignupErrorMessage] = useState('');
const [loginErrorMessage, setLoginErrorMessage] = useState('');

// Password visibility toggles
const [showPasswordLogin, setShowPasswordLogin] = useToggle(false);
const [showPasswordSignup, setShowPasswordSignup] = useToggle(false);

// Apollo GraphQL mutation hooks
const [createUser] = useMutation(CREATE_USER);
const [login] = useMutation(LOGIN_USER);


const validateSignupForm = ({ username, email, password }) => {
  if (!username.trim() || !email.trim() || !password) {
    throw new Error('All fields are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
};

const handleAuthError = (error, setErrorMessage) => {
  console.error('Auth error:', error);
  let message = 'An unexpected error occurred. Please try again.';

  if (
    error.message.includes('required') ||
    error.message.includes('valid email') ||
    error.message.includes('Password')
  ) {
    message = error.message;
  } else if (error.networkError) {
    message = 'Network error. Please check your connection.';
  } else if (error.graphQLErrors?.length > 0) {
    message = error.graphQLErrors[0].message;
  }

  setErrorMessage(message);
};



// Signup submission
const handleSignupSubmit = async (e) => {
  e.preventDefault();
  try {
    validateSignupForm(signupFormState);


  const { data } = await createUser({
  variables: {
    input: {
      username: signupFormState.username,
      email: signupFormState.email,
      password: signupFormState.password,
      role: 'regular'
    }
  }
});


    const token = data?.createUser?.userToken;
    if (token) {
      UserAuth.login(token);
      resetSignup();
      onClose();
    }
  } catch (error) {
    handleAuthError(error, setSignupErrorMessage);
  }
};


// Login submission
const handleLoginSubmit = async (e) => {
  e.preventDefault();
  try {
    if (!loginFormState.email.trim() || !loginFormState.password) {
      throw new Error('Email and password are required');
    }

    const { data } = await login({
      variables: {
        email: loginFormState.email,
        password: loginFormState.password
      }
    });

    const token = data?.login?.userToken;
    if (token) {
       UserAuth.login(token);
      resetLogin();
      onClose();
    }
  } catch (error) {
    handleAuthError(error, setLoginErrorMessage);
  }
};


const handleGoogleLogin = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    // Handle successful login
  } catch (error) {
    setLoginErrorMessage(error.message);
  }
};

const handleCloseLoginError = () => {
  setLoginErrorMessage('');
};



const renderLogin = () => (
  <Box
    className="auth-container"
    sx={{
      background: heroGradient,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: { xs: 2, sm: 3 },
      py: { xs: 4, sm: 6 },
      fontFamily: theme.typography.fontFamily,
    }}
  >
    <Box
      className="auth-form"
      sx={{
        background: alpha(theme.palette.background.paper || '#111119', 0.95),
        backdropFilter: 'blur(12px)',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        p: { xs: 3, sm: 4 },
        width: '100%',
        maxWidth: 480,
        boxShadow: theme.shadows[2],
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <Box
        className="auth-header"
        sx={{
          textAlign: 'center',
          mb: 3,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        <Box 
          component="img" 
          src={logo} 
          alt="Logo" 
          className="logo"
          sx={{
            height: 60,
            mb: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
        <Typography
          component="h2"
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Log In
        </Typography>
      </Box>

      {/* Custom Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: theme.palette.google?.main || '#4285F4',
          color: theme.palette.google?.contrastText || '#fff',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
          fontFamily: theme.typography.fontFamily,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '25px',
          transition: 'all 0.3s ease',
          ':hover': {
            background: '#3367D6',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
          alt="Google logo"
          style={{ width: '20px', height: '20px' }} 
        />
        Continue with Google
      </button>

        <Divider sx={{ my: 2, borderColor: alpha(theme.palette.text.secondary, 0.2) }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: theme.typography.fontFamily }}>
            OR
          </Typography>
        </Divider>

      <form className="form" onSubmit={handleLoginSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            color: theme.palette.text.secondary,
            marginBottom: '8px',
            fontSize: '14px'
          }}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleLoginChange}
            value={loginFormState.email}
            required
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: 'rgba(255,255,255,0.05)',
              color: theme.palette.text.primary,
              fontSize: '16px',
              fontFamily: theme.typography.fontFamily,
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: theme.palette.text.secondary,
            marginBottom: '8px',
            fontSize: '14px'
          }}>Password:</label>
          <div className="password-input" style={{ position: 'relative' }}>
            <input
              type={showPasswordLogin ? 'text' : 'password'}
              id="password"
              name="password"
              onChange={handleLoginChange}
              value={loginFormState.password}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                background: 'rgba(255,255,255,0.05)',
                color: theme.palette.text.primary,
                fontSize: '16px',
                fontFamily: theme.typography.fontFamily,
                paddingRight: '40px'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPasswordLogin(!showPasswordLogin)}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ':hover': {
                  color: '#E4C421'
                }
              }}
            >
              <FontAwesomeIcon icon={showPasswordLogin ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            navigate('/password-reset');
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginBottom: '18px',
            color: theme.palette.primary.main,
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Forgot password?
        </button>

        {loginErrorMessage && (
          <p className="error-message" style={{
            color: '#FF4D4D',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {loginErrorMessage}
          </p>
        )}

        <button
          type="submit"
          className="submit-button"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #E4C421, #B25035)',
            color: '#000',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: theme.typography.fontFamily,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '20px',
            ':hover': {
              background: 'linear-gradient(90deg, #F8D347, #C96146)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Log In
        </button>

        <div className="auth-switch" style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ color: theme.palette.text.secondary, margin: 0 }}>
            Don't have an account?
          </p>
          <button
            type="button"
            className="switch-button"
            onClick={handleSwitchToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginLeft: '5px',
              ':hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Sign up
          </button>
        </div>

        <Button
          onClick={handleBackHome}
          variant="text"
          color="inherit"
          sx={{
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            mx: 'auto',
            color: theme.palette.text.primary,
            fontWeight: 600,
            '&:hover': { color: theme.palette.primary.main, background: 'transparent' },
          }}
        >
          ← Back to home
        </Button>
      </form>
    </Box>
  </Box>
);


const renderSignup = () => (
  <Box
    className="auth-container"
    sx={{
      background: heroGradient,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: { xs: 2, sm: 3 },
      py: { xs: 4, sm: 6 },
      fontFamily: theme.typography.fontFamily,
    }}
  >
    <Box
      className="auth-form"
      sx={{
        background: alpha(theme.palette.background.paper || '#111119', 0.95),
        backdropFilter: 'blur(12px)',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        p: { xs: 3, sm: 4 },
        width: '100%',
        maxWidth: 480,
        boxShadow: theme.shadows[2],
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <Box
        className="auth-header"
        sx={{
          textAlign: 'center',
          mb: 3,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        <Box 
          component="img" 
          src={logo} 
          alt="Logo" 
          className="logo"
          sx={{
            height: 60,
            mb: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }} 
        />
        <Typography
          component="h2"
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Create Account
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mt: 1,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Join AfroFeel today
        </Typography>
      </Box>

      <form className="form" onSubmit={handleSignupSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="username" style={{
            display: 'block',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '8px',
            fontSize: '14px'
          }}>Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            onChange={handleSignupChange}
            value={signupFormState.username}
            required
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: 'rgba(255,255,255,0.05)',
              color: theme.palette.text.primary,
              fontSize: '16px',
              fontFamily: theme.typography.fontFamily,
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            color: theme.palette.text.secondary,
            marginBottom: '8px',
            fontSize: '14px'
          }}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleSignupChange}
            value={signupFormState.email}
            required
              style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: 'rgba(255,255,255,0.05)',
              color: theme.palette.text.primary,
              fontSize: '16px',
              fontFamily: theme.typography.fontFamily,
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: theme.palette.text.secondary,
            marginBottom: '8px',
            fontSize: '14px'
          }}>Password:</label>
          <div className="password-input" style={{ position: 'relative' }}>
            <input
              type={showPasswordSignup ? 'text' : 'password'}
              id="password"
              name="password"
              onChange={handleSignupChange}
              value={signupFormState.password}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                background: 'rgba(255,255,255,0.05)',
                color: theme.palette.text.primary,
                fontSize: '16px',
                fontFamily: theme.typography.fontFamily,
                paddingRight: '40px'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPasswordSignup(!showPasswordSignup)}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ':hover': {
                  color: '#E4C421'
                }
              }}
            >
              <FontAwesomeIcon icon={showPasswordSignup ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {signupErrorMessage && (
          <p className="error-message" style={{
            color: '#FF4D4D',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {signupErrorMessage}
          </p>
        )}


                 <div style={{ marginBottom: '20px' }}>
  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
    <input
      type="checkbox"
      checked={agreedToTerms}
      onChange={() => setAgreedToTerms(prev => !prev)}
      required
      style={{ marginRight: '8px' }}
    />
    I agree to the{' '}
    <a href="/terms" target="_blank" style={{ color: '#E4C421', textDecoration: 'underline' }}>
      Terms of Use
    </a>{' '}
    and{' '}
    <a href="/privacy" target="_blank" style={{ color: '#E4C421', textDecoration: 'underline' }}>
      Privacy Policy
    </a>
  </label>
</div>


        <button
          type="submit"
          className="submit-button"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #E4C421, #B25035)',
            color: '#000',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '20px',
            ':hover': {
              background: 'linear-gradient(90deg, #F8D347, #C96146)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Sign Up
        </button>

        <div className="auth-switch" style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ color: theme.palette.text.secondary, margin: 0 }}>
            Already have an account?
          </p>

 

          <button
            type="button"
            className="switch-button"
            onClick={handleSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginLeft: '5px',
              ':hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Log in
          </button>
          
        </div>

        <button
          type="button"
          className="back-button"
          onClick={handleBackHome}
          style={{
            background: 'none',
            border: 'none',
            color: theme.palette.text.primary,
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            margin: '0 auto',
            ':hover': {
              color: '#E4C421'
            }
          }}
        >
          ← Back to home
        </button>
      </form>
    </Box>
  </Box>
);






  return (
    <>
      {display === 'login' && renderLogin()}
      {display === 'signup' && renderSignup()}

      {display === '' && (
        <MainMenu
          trendingSongs={processedTrendingSongs}
          songsWithArtwork={songsWithArtwork}
          newUploadsWithArtwork={newUploadsWithArtwork}
          suggestedSongsWithArtwork={suggestedSongsWithArtwork}
          songOfMonthWithArtwork={songOfMonthWithArtwork}
          radioStations={radioStationsData?.radioStations || []}
        />
      )}
      <FeedbackModal
        open={Boolean(loginErrorMessage)}
        onClose={handleCloseLoginError}
        title="Login failed"
        message={loginErrorMessage}
      />
    </>
  );
};

export default LoginSignin;
