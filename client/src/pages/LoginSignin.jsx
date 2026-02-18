import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { LOGIN_USER, CREATE_USER } from '../utils/mutations';
import UserAuth from '../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import {
  NEW_UPLOADS_PUBLIC,
  SUGGESTED_SONGS_PUBLIC,
  SONG_OF_MONTH_PUBLIC,
  RADIO_STATIONS_PUBLIC,
  TRENDING_SONGS_PUBLICV2
} from '../utils/queries';
import MainMenu from '../components/MainMenu';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useTheme, alpha } from '@mui/material/styles';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
import { HORIZONTAL_LIMIT } from '../CommonSettings/songsRowNumberControl';
import FeedbackModal from '../components/FeedbackModal.jsx';

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

const useAuthFormLogic = ({ onClose } = {}) => {
  const theme = useTheme();
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
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [showPasswordLogin, toggleShowPasswordLogin] = useToggle(false);
  const [showPasswordSignup, toggleShowPasswordSignup] = useToggle(false);
  const [createUser] = useMutation(CREATE_USER);
  const [loginMutation] = useMutation(LOGIN_USER);

  const heroGradient = `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `;

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
        setAgreedToTerms(false);
        onClose?.();
      }
    } catch (error) {
      handleAuthError(error, setSignupErrorMessage);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!loginFormState.email.trim() || !loginFormState.password) {
        throw new Error('Email and password are required');
      }
      const { data } = await loginMutation({
        variables: {
          email: loginFormState.email,
          password: loginFormState.password
        }
      });
      const token = data?.login?.userToken;
      if (token) {
        UserAuth.login(token);
        resetLogin();
        onClose?.();
      }
    } catch (error) {
      handleAuthError(error, setLoginErrorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoginErrorMessage(error.message);
    }
  };

  const handleCloseLoginError = () => {
    setLoginErrorMessage('');
  };

  return {
    theme,
    heroGradient,
    signupFormState,
    handleSignupChange,
    signupErrorMessage,
    handleSignupSubmit,
    agreedToTerms,
    setAgreedToTerms,
    showPasswordSignup,
    toggleShowPasswordSignup,
    loginFormState,
    handleLoginChange,
    loginErrorMessage,
    handleLoginSubmit,
    handleGoogleLogin,
    showPasswordLogin,
    toggleShowPasswordLogin,
    handleCloseLoginError
  };
};

const AuthFormContainer = ({ heroGradient, theme, children }) => (
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
      {children}
    </Box>
  </Box>
);

const LoginForm = ({
  heroGradient,
  theme,
  loginFormState,
  handleLoginChange,
  handleLoginSubmit,
  handleGoogleLogin,
  showPasswordLogin,
  toggleShowPasswordLogin,
  loginErrorMessage,
  onForgotPassword,
  onSwitchToSignup,
  onBackHome
}) => (
  <AuthFormContainer heroGradient={heroGradient} theme={theme}>
    <Box
      className="auth-content"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
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
        <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: 'flex-start' }} />
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

      <Divider sx={{ my: 0, borderColor: 'transparent' }} />

      <Box component="form" className="form" onSubmit={handleLoginSubmit}>
        <Box className="form-group" sx={{ mb: 2.5 }}>
          <Typography component="label" htmlFor="email" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
            Email:
          </Typography>
          <Box component="input"
            type="email"
            id="email"
            name="email"
            onChange={handleLoginChange}
            value={loginFormState.email}
            required
            sx={{
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
        </Box>

        <Box className="form-group" sx={{ mb: 3 }}>
          <Typography component="label" htmlFor="password" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
            Password:
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Box component="input"
              type={showPasswordLogin ? 'text' : 'password'}
              id="password"
              name="password"
              onChange={handleLoginChange}
              value={loginFormState.password}
              required
              sx={{
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
            <Box
              component="button"
              type="button"
              onClick={toggleShowPasswordLogin}
              sx={{
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
            </Box>
          </Box>
        </Box>

        <Box component="button" type="button" onClick={onForgotPassword} sx={{ background: 'none', border: 'none', padding: 0, mb: 2.25, color: theme.palette.primary.main, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
          Forgot password?
        </Box>

        {loginErrorMessage && (
          <Typography className="error-message" sx={{ color: '#FF4D4D', mb: 1.5, fontSize: 14, textAlign: 'center' }}>
            {loginErrorMessage}
          </Typography>
        )}

        <Box component="button" type="submit" sx={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'linear-gradient(90deg, #E4C421, #B25035)', color: '#000', border: 'none', fontSize: '16px', fontWeight: 600, fontFamily: theme.typography.fontFamily, cursor: 'pointer', transition: 'all 0.3s ease', mb: 2, '&:hover': { background: 'linear-gradient(90deg, #F8D347, #C96146)', transform: 'translateY(-2px)' } }}>
          Log In
        </Box>

        <Divider sx={{ my: 1, borderColor: alpha(theme.palette.text.secondary, 0.2) }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: theme.typography.fontFamily }}>
            OR
          </Typography>
        </Divider>

        <Box component="button" type="button" onClick={handleGoogleLogin} sx={{ width: '100%', padding: '12px', borderRadius: '8px', background: theme.palette.google?.main || '#4285F4', color: theme.palette.google?.contrastText || '#fff', border: 'none', fontSize: '16px', fontWeight: '500', fontFamily: theme.typography.fontFamily, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', mb: 2.5, transition: 'all 0.3s ease', '&:hover': { background: '#3367D6', transform: 'translateY(-2px)' } }}>
          <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo" sx={{ width: 20, height: 20 }} />
          Continue with Google
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography sx={{ color: theme.palette.text.secondary, mb: 0 }}>
            Don't have an account?
          </Typography>
          <Box component="button" type="button" onClick={onSwitchToSignup} sx={{ background: 'none', border: 'none', color: theme.palette.primary.main, cursor: 'pointer', fontSize: 14, fontWeight: 600, ml: 0.5, ':hover': { textDecoration: 'underline' } }}>
            Sign up
          </Box>
        </Box>

        <Button onClick={onBackHome} variant="text" color="inherit" sx={{ fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mx: 'auto', color: theme.palette.text.primary, fontWeight: 600, '&:hover': { color: theme.palette.primary.main, background: 'transparent' } }}>
          ← Back to home
        </Button>
      </Box>
    </Box>
  </AuthFormContainer>
);

const SignupForm = ({
  heroGradient,
  theme,
  signupFormState,
  handleSignupChange,
  handleSignupSubmit,
  agreedToTerms,
  setAgreedToTerms,
  showPasswordSignup,
  toggleShowPasswordSignup,
  signupErrorMessage,
  onSwitchToLogin,
  onBackHome
}) => (
  <AuthFormContainer heroGradient={heroGradient} theme={theme}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 3, fontFamily: theme.typography.fontFamily }}>
        <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: 'flex-start' }} />
        <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontFamily: theme.typography.fontFamily }}>
          Create Account
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontFamily: theme.typography.fontFamily }}>
          Join FloLup today
        </Typography>
      </Box>

      <Box component="form" className="form" onSubmit={handleSignupSubmit}>
        <Box className="form-group" sx={{ mb: 2 }}>
          <Typography component="label" htmlFor="username" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mb: 1, fontSize: 14 }}>
            Username:
          </Typography>
          <Box component="input" type="text" id="username" name="username" onChange={handleSignupChange} value={signupFormState.username} required sx={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: 'rgba(255,255,255,0.05)', color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }} />
        </Box>

        <Box className="form-group" sx={{ mb: 2 }}>
          <Typography component="label" htmlFor="email" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
            Email:
          </Typography>
          <Box component="input" type="email" id="email" name="email" onChange={handleSignupChange} value={signupFormState.email} required sx={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: 'rgba(255,255,255,0.05)', color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }} />
        </Box>

        <Box className="form-group" sx={{ mb: 3 }}>
          <Typography component="label" htmlFor="password" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
            Password:
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Box component="input" type={showPasswordSignup ? 'text' : 'password'} id="password" name="password" onChange={handleSignupChange} value={signupFormState.password} required sx={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: 'rgba(255,255,255,0.05)', color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily, paddingRight: '40px' }} />
            <Box component="button" type="button" onClick={toggleShowPasswordSignup} sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '10px', background: 'none', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ':hover': { color: '#E4C421' } }}>
              <FontAwesomeIcon icon={showPasswordSignup ? faEyeSlash : faEye} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography component="label" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            <Box component="input" type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(prev => !prev)} required sx={{ mr: 1 }} />
            I agree to the{' '}
            <Box component="a" href="/terms" target="_blank" sx={{ color: '#E4C421', textDecoration: 'underline' }}>
              Terms of Use
            </Box>{' '}
            and{' '}
            <Box component="a" href="/privacy" target="_blank" sx={{ color: '#E4C421', textDecoration: 'underline' }}>
              Privacy Policy
            </Box>
          </Typography>
        </Box>

        {signupErrorMessage && (
          <Typography sx={{ color: '#FF4D4D', mb: 1.5, fontSize: 14, textAlign: 'center' }}>
            {signupErrorMessage}
          </Typography>
        )}

        <Box component="button" type="submit" sx={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'linear-gradient(90deg, #E4C421, #B25035)', color: '#000', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', mb: 2, '&:hover': { background: 'linear-gradient(90deg, #F8D347, #C96146)', transform: 'translateY(-2px)' } }}>
          Sign Up
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography sx={{ color: theme.palette.text.secondary, mb: 0 }}>
            Already have an account?
          </Typography>
          <Box component="button" type="button" onClick={onSwitchToLogin} sx={{ background: 'none', border: 'none', color: theme.palette.primary.main, cursor: 'pointer', fontSize: 14, fontWeight: 600, ml: 0.5, ':hover': { textDecoration: 'underline' } }}>
            Log in
          </Box>
        </Box>

        <Box component="button" type="button" onClick={onBackHome} sx={{ background: 'none', border: 'none', color: theme.palette.text.primary, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mx: 'auto', ':hover': { color: '#E4C421' } }}>
          ← Back to home
        </Box>
      </Box>
    </Box>
  </AuthFormContainer>
);

export const UserLoginPage = ({ onClose, onSwitchToSignup }) => {
  const navigate = useNavigate();
  const {
    theme,
    heroGradient,
    loginFormState,
    handleLoginChange,
    handleLoginSubmit,
    handleGoogleLogin,
    showPasswordLogin,
    toggleShowPasswordLogin,
    loginErrorMessage,
    handleCloseLoginError
  } = useAuthFormLogic({ onClose });

  const handleBackHome = () => {
    onClose?.();
    navigate('/welcome');
  };

  const handleForgotPassword = () => {
    onClose?.();
    navigate('/password-reset');
  };

  const handleSwitchToSignup = () => {
    onSwitchToSignup?.();
    navigate('/user/signup');
  };

  return (
    <>
      <LoginForm
        heroGradient={heroGradient}
        theme={theme}
        loginFormState={loginFormState}
        handleLoginChange={handleLoginChange}
        handleLoginSubmit={handleLoginSubmit}
        handleGoogleLogin={handleGoogleLogin}
        showPasswordLogin={showPasswordLogin}
        toggleShowPasswordLogin={toggleShowPasswordLogin}
        loginErrorMessage={loginErrorMessage}
        onForgotPassword={handleForgotPassword}
        onSwitchToSignup={handleSwitchToSignup}
        onBackHome={handleBackHome}
      />
      <FeedbackModal
        open={Boolean(loginErrorMessage)}
        onClose={handleCloseLoginError}
        title="Login failed"
        message={loginErrorMessage}
      />
    </>
  );
};

export const UserSignupPage = ({ onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const {
    theme,
    heroGradient,
    signupFormState,
    handleSignupChange,
    handleSignupSubmit,
    agreedToTerms,
    setAgreedToTerms,
    showPasswordSignup,
    toggleShowPasswordSignup,
    signupErrorMessage
  } = useAuthFormLogic({ onClose });

  const handleBackHome = () => {
    onClose?.();
    navigate('/welcome');
  };

  const handleSwitchToLogin = () => {
    onSwitchToLogin?.();
    navigate('/user/login');
  };

  return (
    <SignupForm
      heroGradient={heroGradient}
      theme={theme}
      signupFormState={signupFormState}
      handleSignupChange={handleSignupChange}
      handleSignupSubmit={handleSignupSubmit}
      agreedToTerms={agreedToTerms}
      setAgreedToTerms={setAgreedToTerms}
      showPasswordSignup={showPasswordSignup}
      toggleShowPasswordSignup={toggleShowPasswordSignup}
      signupErrorMessage={signupErrorMessage}
      onSwitchToLogin={handleSwitchToLogin}
      onBackHome={handleBackHome}
    />
  );
};

const LoginSignin = () => {
  const { data: trendingSongsV2 } = useQuery(TRENDING_SONGS_PUBLICV2, {
    variables: { limit: HORIZONTAL_LIMIT },
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const processedTrendingSongs = trendingSongsV2?.trendingSongsV2 || [];
  const { songsWithArtwork } = useSongsWithPresignedUrls(processedTrendingSongs);

  const { data: newUploadsData } = useQuery(NEW_UPLOADS_PUBLIC, {
    variables: { limit: HORIZONTAL_LIMIT },
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const { songsWithArtwork: newUploadsWithArtwork } = useSongsWithPresignedUrls(newUploadsData?.newUploads);

  const { data: suggestedData } = useQuery(SUGGESTED_SONGS_PUBLIC, {
    variables: { limit: HORIZONTAL_LIMIT },
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const { songsWithArtwork: suggestedSongsWithArtwork } = useSongsWithPresignedUrls(suggestedData?.suggestedSongs);

  const { data: songOfMonthData } = useQuery(SONG_OF_MONTH_PUBLIC, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const songOfMonthSource = useMemo(
    () => (songOfMonthData?.songOfMonth ? [songOfMonthData.songOfMonth] : []),
    [songOfMonthData?.songOfMonth]
  );
  const { songsWithArtwork: songOfMonthWithArtwork } = useSongsWithPresignedUrls(songOfMonthSource);

  const { data: radioStationsData } = useQuery(RADIO_STATIONS_PUBLIC, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return (
    <>
      <MainMenu
        trendingSongs={processedTrendingSongs}
        songsWithArtwork={songsWithArtwork}
        newUploadsWithArtwork={newUploadsWithArtwork}
        suggestedSongsWithArtwork={suggestedSongsWithArtwork}
        songOfMonthWithArtwork={songOfMonthWithArtwork}
        radioStations={radioStationsData?.radioStations || []}
      />
    </>
  );
};

export { LoginSignin };
