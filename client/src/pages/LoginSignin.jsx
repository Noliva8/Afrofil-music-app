import './CSS/loginSignin.css';
import logo from '../images/logo.png';
import react, { useState, useEffect, useCallback } from 'react';
import {  useQuery, useMutation} from "@apollo/client";
import { LOGIN_USER, CREATE_USER } from '../utils/mutations';
import UserAuth from '../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import Grid2 from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import ForArtistOnly from '../components/ForArtistOnly';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { TRENDING_SONGS_PUBLIC } from '../utils/queries';
import { GET_PRESIGNED_URL_DOWNLOAD, GET_PRESIGNED_URL_DOWNLOAD_AUDIO } from '../utils/mutations';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { CircularProgress } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';
import { ChevronRight } from '@mui/icons-material';
import WelcomeAppNavBar from '../components/WelcomePage/WelcomAppNavBar';
import MainMenu from '../components/MainMenu';
import { GoogleLogin } from '@react-oauth/google';

import { useRef } from 'react';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';

import { useOutletContext } from 'react-router-dom';





const LoginSignin = function ({ display = '', onSwitchToLogin, onSwitchToSignup, isUserLoggedIn, onClose }) {



 const { data, loading, error, refetch } = useQuery(TRENDING_SONGS_PUBLIC, {
    pollInterval: 30000, // Refetch every 30 seconds
    notifyOnNetworkStatusChange: true,
  });


  const { songsWithArtwork } = useSongsWithPresignedUrls(data?.trendingSongs);


  // const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  // const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);

  // const [songsWithArtwork, setSongsWithArtwork] = useState([]);


console.log('Loading:', loading);
console.log('Error:', error);
console.log('Data:', data);









// SIGNUP LOGIN
// ------------


// useToggle: toggles boolean state
const useToggle = (initialState = false) => {
  const [state, setState] = useState(initialState);
  const toggle = () => setState(prev => !prev);
  return [state, toggle];
};

// useFormState: handles form field updates and resets
const useFormState = (initialState) => {
  const [state, setState] = useState(initialState);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };
  const reset = () => setState(initialState);
  return [state, handleChange, reset];
};


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



const renderLogin = () => (
  <div className="auth-container" style={{
    background: `
      radial-gradient(circle at 20% 30%, 
        rgba(228, 196, 33, 0.03) 0%, 
        transparent 25%),
      linear-gradient(to bottom, #0F0F0F, #1A1A1A)
    `,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <div className="auth-form" style={{
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(228, 196, 33, 0.2)',
      padding: '40px',
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div className="auth-header" style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <img 
          src={logo} 
          alt="Logo" 
          className="logo"
          style={{
            height: '60px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }} 
        />
        <h2 style={{
          color: '#E4C421',
          margin: '0',
          fontSize: '28px',
          fontWeight: '600'
        }}>Log In</h2>
      </div>

      {/* Custom Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: '#4285F4',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '20px 0'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        <span style={{ padding: '0 15px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
      </div>

      <form className="form" onSubmit={handleLoginSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            color: 'rgba(255,255,255,0.8)',
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '16px',
              ':focus': {
                outline: 'none',
                borderColor: '#E4C421',
                boxShadow: '0 0 0 2px rgba(228, 196, 33, 0.2)'
              }
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: 'rgba(255,255,255,0.8)',
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
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '16px',
                paddingRight: '40px'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPasswordLogin(!showPasswordLogin)}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                ':hover': {
                  color: '#E4C421'
                }
              }}
            >
              <FontAwesomeIcon icon={showPasswordLogin ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

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
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Don't have an account?
          </p>
          <button
            type="button"
            className="switch-button"
            onClick={onSwitchToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#E4C421',
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

        <button
          type="button"
          className="back-button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
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
    </div>
  </div>
);


const renderSignup = () => (
  <div className="auth-container" style={{
    background: `
      radial-gradient(circle at 20% 30%, 
        rgba(228, 196, 33, 0.03) 0%, 
        transparent 25%),
      linear-gradient(to bottom, #0F0F0F, #1A1A1A)
    `,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <div className="auth-form" style={{
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(228, 196, 33, 0.2)',
      padding: '40px',
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div className="auth-header" style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <img 
          src={logo} 
          alt="Logo" 
          className="logo"
          style={{
            height: '60px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }} 
        />
        <h2 style={{
          color: '#E4C421',
          margin: '0',
          fontSize: '28px',
          fontWeight: '600'
        }}>Create Account</h2>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          marginTop: '8px'
        }}>Join AfroFeel today</p>
      </div>

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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '16px',
              ':focus': {
                outline: 'none',
                borderColor: '#E4C421',
                boxShadow: '0 0 0 2px rgba(228, 196, 33, 0.2)'
              }
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            color: 'rgba(255,255,255,0.8)',
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '16px',
              ':focus': {
                outline: 'none',
                borderColor: '#E4C421',
                boxShadow: '0 0 0 2px rgba(228, 196, 33, 0.2)'
              }
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: 'rgba(255,255,255,0.8)',
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '16px',
              ':focus': {
                outline: 'none',
                borderColor: '#E4C421',
                boxShadow: '0 0 0 2px rgba(228, 196, 33, 0.2)'
              }
            }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPasswordSignup(!showPasswordSignup)}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
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
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Already have an account?
          </p>

 

          <button
            type="button"
            className="switch-button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#E4C421',
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
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
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
    </div>
  </div>
);






  return (
    <>
        {display === 'login' && renderLogin()}
      {display === 'signup' && renderSignup()}

{display === '' && (
<MainMenu
  songsWithArtwork={songsWithArtwork}    
  onSwitchToLogin={onSwitchToLogin}
   refetch={refetch}
/>

)}


    </>
  );
};

export default LoginSignin;

