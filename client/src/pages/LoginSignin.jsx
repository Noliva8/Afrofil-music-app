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
import ModernMusicPlayer from '../components/userAudioPlayer';
import { useRef } from 'react';
import AuthModal from '../components/WelcomePage/AuthModal';

import { useOutletContext } from 'react-router-dom';





const LoginSignin = function ({ display = '', onSwitchToLogin, onSwitchToSignup, isUserLoggedIn, onClose }) {
  const { data, loading, error } = useQuery(TRENDING_SONGS_PUBLIC);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);

  const [songsWithArtwork, setSongsWithArtwork] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [teaserMode, setTeaserMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(null);
  const hasTriggeredTeaserRef = useRef(false);
  const animationFrameRef = useRef();
  const prevUpdateTime = useRef(0);
  const teaserTimeoutRef = useRef(null);
  const currentSongIdRef = useRef(null);
  const handleNextSongRef = useRef(null);


  // const {  isUserLoggedIn } = useOutletContext() || {};

  const [nowPlaying, setNowPlaying] = useState({
    songId: null,
    isPlaying: false,
    audioUrl: null,
  });

  const TEASER_DURATION = 30;
  const SMOOTH_UPDATE_INTERVAL = 50;
  

  const handleSliderChange = useCallback((_, value) => {
    setIsDragging(true);
    setCurrentTime(value);
  }, []);


  const handleSliderCommit = useCallback((_, value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
    setIsDragging(false);
  }, []);



const handleSongPlay = useCallback((song) => {
  hasTriggeredTeaserRef.current = false;
  currentSongIdRef.current = song._id;

  const audio = audioRef.current;
  clearTimeout(teaserTimeoutRef.current);
  teaserTimeoutRef.current = null;

  setTeaserMode(!isUserLoggedIn);

  setSelectedSong(song);
  setNowPlaying({ songId: song._id, isPlaying: true, audioUrl: song.audioUrl });

  audio.pause();
  audio.currentTime = 0;
  audio.src = song.audioUrl;

  audio.addEventListener("loadeddata", function onLoad() {
    audio.removeEventListener("loadeddata", onLoad);
    audio.play().catch(err => console.warn("Audio play failed:", err));
  });
}, [isUserLoggedIn]);



const handleNextSong = useCallback(() => {
  const currentId = currentSongIdRef.current;

  if (!songsWithArtwork || songsWithArtwork.length === 0) {
    console.warn("⛔ Cannot play next song — songsWithArtwork is empty.");
    return;
  }

  const index = songsWithArtwork.findIndex(s => s._id === currentId);

  if (index === -1) {
    console.warn("❌ Current song not found — fallback to first.");
    handleSongPlay(songsWithArtwork[0]);
    return;
  }

  const next = songsWithArtwork[(index + 1) % songsWithArtwork.length];
  console.log("🎵 Playing next song:", next.title);
  handleSongPlay(next);
}, [songsWithArtwork, handleSongPlay]);

// Keep ref updated
useEffect(() => {
  handleNextSongRef.current = handleNextSong;
}, [handleNextSong]);


// const handleNextSongRef = useRef(handleNextSong);


  const handlePreviousSong = useCallback(() => {
    const index = songsWithArtwork.findIndex(s => s._id === nowPlaying.songId);
    const prev = songsWithArtwork[(index - 1 + songsWithArtwork.length) % songsWithArtwork.length];
    if (prev) handleSongPlay(prev);
  }, [songsWithArtwork, nowPlaying.songId, handleSongPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying.audioUrl) return;

    if (audio.src !== nowPlaying.audioUrl) {
      audio.src = nowPlaying.audioUrl;
    }

    if (nowPlaying.isPlaying) {
      audio.play().catch(err => {
        console.error("Autoplay failed:", err);
        setNowPlaying(prev => ({ ...prev, isPlaying: false }));
      });
    } else {
      audio.pause();
    }
  }, [nowPlaying.audioUrl, nowPlaying.isPlaying]);
  




useEffect(() => {
  const audio = audioRef.current;

  // Guard against early load
  if (!audio || !songsWithArtwork || songsWithArtwork.length === 0) {
    console.warn("🚫 Teaser setup skipped — audio or songs missing.");
    return;
  }

  const enforceTeaser = () => {
    if (teaserMode && !isUserLoggedIn) {
      console.log("🔒 Enforcing teaser...");

      if (audio.currentTime >= TEASER_DURATION) {
        console.log("⏳ Teaser finished at", audio.currentTime);
        audio.currentTime = TEASER_DURATION;
        audio.pause();
        setNowPlaying(prev => ({ ...prev, isPlaying: false }));
        setShowAuthModal(true);

        clearTimeout(teaserTimeoutRef.current);
        setTimeout(() => {
          console.log("🕒 Waiting 3s to play next song...");
          teaserTimeoutRef.current = setTimeout(() => {
            console.log("🎯 Triggering next teaser song...");
            hasTriggeredTeaserRef.current = false;
            handleNextSongRef.current(); // ✅ Always latest
          }, 3000);
        }, 100); // wait for refs to update
      }
    }
  };

  const updateProgress = () => {
    const now = performance.now();
    if (!isDragging && now - prevUpdateTime.current >= SMOOTH_UPDATE_INTERVAL) {
      setCurrentTime(audio.currentTime);
      prevUpdateTime.current = now;

      if (
        teaserMode &&
        !isUserLoggedIn &&
        !hasTriggeredTeaserRef.current &&
        audio.currentTime >= TEASER_DURATION
      ) {
        hasTriggeredTeaserRef.current = true;
        enforceTeaser();
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const startUpdates = () => {
    prevUpdateTime.current = performance.now();
    hasTriggeredTeaserRef.current = false;
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const stopUpdates = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleSeeked = () => {
    setCurrentTime(audio.currentTime);
    if (teaserMode && !isUserLoggedIn && audio.currentTime > TEASER_DURATION) {
      enforceTeaser();
    }
  };

  const handleEnded = () => {
    if (teaserMode && !isUserLoggedIn) {
      enforceTeaser();
    }
  };

  audio.addEventListener("play", startUpdates);
  audio.addEventListener("pause", stopUpdates);
  audio.addEventListener("seeked", handleSeeked);
  audio.addEventListener("ended", handleEnded);

  if (!audio.paused) startUpdates();

  return () => {
    audio.removeEventListener("play", startUpdates);
    audio.removeEventListener("pause", stopUpdates);
    audio.removeEventListener("seeked", handleSeeked);
    audio.removeEventListener("ended", handleEnded);
    stopUpdates();
    clearTimeout(teaserTimeoutRef.current);
  };
}, [teaserMode, isUserLoggedIn, isDragging, songsWithArtwork]);



  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioDuration = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        const d = teaserMode ? Math.min(TEASER_DURATION, audio.duration) : audio.duration;
        setDuration(d);
      }
    };

    setAudioDuration();
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("emptied", setAudioDuration);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("emptied", setAudioDuration);
    };
  }, [teaserMode, nowPlaying.audioUrl]);

// -----------------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!teaserMode) {
        handleNextSong();
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [handleNextSong, teaserMode]);

// -----------------------------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateVolume = () => setVolume(audio.volume);
    audio.addEventListener("volumechange", updateVolume);
    return () => audio.removeEventListener("volumechange", updateVolume);
  }, []);

// -------------------------

  useEffect(() => {
    if (isUserLoggedIn) {
      setTeaserMode(false);
      clearTimeout(teaserTimeoutRef.current);
    }
  }, [isUserLoggedIn]);
// -----------------------------------

  useEffect(() => {
    return () => {
      clearTimeout(teaserTimeoutRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
// ----------------------------------

  useEffect(() => {
    const fetchArtworksAndAudio = async () => {
      if (!data?.trendingSongs) return;

      const updatedSongs = await Promise.all(
        data.trendingSongs.map(async (song) => {
          let artworkUrl = 'https://via.placeholder.com/300x300?text=No+Cover';
          let audioUrl = null;

          if (song.artwork) {
            try {
              const artworkKey = new URL(song.artwork).pathname.split('/').pop();
              const { data: artworkData } = await getPresignedUrlDownload({
                variables: {
                  bucket: 'afrofeel-cover-images-for-songs',
                  key: decodeURIComponent(artworkKey),
                  region: 'us-east-2',
                  expiresIn: 604800,
                },
              });
              artworkUrl = artworkData.getPresignedUrlDownload.urlToDownload;
            } catch (err) {
              console.error('Error fetching artwork for', song.title, err);
            }
          }

          if (song.streamAudioFileUrl) {
            try {
              const audioKey = new URL(song.streamAudioFileUrl).pathname.split('/').pop();
              const { data: audioData } = await getPresignedUrlDownloadAudio({
                variables: {
                  bucket: 'afrofeel-songs-streaming',
                  key: `for-streaming/${decodeURIComponent(audioKey)}`,
                  region: 'us-west-2',
                },
              });
              audioUrl = audioData.getPresignedUrlDownloadAudio.url;
            } catch (err) {
              console.error('Error fetching audio for', song.title, err);
            }
          }

          return {
            ...song,
            artworkUrl,
            audioUrl,
          };
        })
      );

      setSongsWithArtwork(updatedSongs);
    };

    fetchArtworksAndAudio();
  }, [data, getPresignedUrlDownload, getPresignedUrlDownloadAudio]);


// ------------------------
// LOGIN & SIGNUP


  // Page toggle state
  const [formDisplay, setFormDisplay] = useState('');

  // Handlers for displaying forms
  function handleLoginFormDisplay() {
    setFormDisplay('login');
  }

  function handleSignupFormDisplay() {
    setFormDisplay('signup');
  }

  // Login form states and handlers
  const [loginFormState, setLoginFormState] = useState({ email: '', password: '' });
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [login, { error: loginError }] = useMutation(LOGIN_USER);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginFormState({
      ...loginFormState,
      [name]: value,
    });
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: { ...loginFormState },
      });
      UserAuth.login(data.login.userToken);
      setLoginErrorMessage(''); 
    } catch (e) {
      setLoginErrorMessage('Invalid email or password.');
      console.error(e);
    }

    // Clear form values
    setLoginFormState({ email: '', password: '' });
  };

  // Signup form states and handlers
  const [signupFormState, setSignupFormState] = useState({ username: '', email: '', password: '' });
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [createUser, { error: signupError }] = useMutation(CREATE_USER);

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupFormState({
      ...signupFormState,
      [name]: value,
    });
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await createUser({
        variables: { ...signupFormState },
      });
      UserAuth.login(data.createUser.userToken);
      setSignupErrorMessage(''); // Clear error if successful
    } catch (e) {
      setSignupErrorMessage('Signup failed. Please ensure your details are correct.');
      console.error(e);
    }

    // Clear form values
    setSignupFormState({ username: '', email: '', password: '' });
  };

  // Hide or show password toggle logic
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);

  const toggleLoginPasswordVisibility = () => {
    setShowPasswordLogin((prevState) => !prevState);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowPasswordSignup((prevState) => !prevState);
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
                paddingRight: '40px'
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
      <audio ref={audioRef} src={nowPlaying.audioUrl} style={{ display: 'none' }} />

        {display === 'login' && renderLogin()}
      {display === 'signup' && renderSignup()}

      {display === '' && (
        <MainMenu
          songsWithArtwork={songsWithArtwork}
          nowPlaying={nowPlaying}
          isPlaying={nowPlaying.isPlaying}
          playingSongId={nowPlaying.songId}
          onSongPlay={handleSongPlay}
          onSwitchToLogin={onSwitchToLogin}

        />
      )}

      {selectedSong?.audioUrl && (
        <ModernMusicPlayer
          isDragging={isDragging}
          teaserMode={teaserMode}
          currentSong={selectedSong}
          audioUrl={selectedSong.audioUrl}
          audioRef={audioRef}
          isPlaying={nowPlaying.isPlaying}
          onPlayPause={(isPlaying) =>
            setNowPlaying((prev) => ({
              ...prev,
              songId: selectedSong._id,
              isPlaying,
            }))
          }
          onNext={handleNextSong}
          onPrev={handlePreviousSong}
          currentTime={currentTime}
          duration={teaserMode ? TEASER_DURATION : duration}
          onSeek={(time) => audioRef.current.currentTime = time}
          volume={volume}
          onVolumeChange={(v) => {
            if (audioRef.current) audioRef.current.volume = v;
            setVolume(v);
          }}
          onSliderChange={handleSliderChange}
          onSliderCommit={handleSliderCommit}
        />
      )}

<AuthModal
  open={showAuthModal}
  onClose={() => setShowAuthModal(false)}
  currentSong={selectedSong}
/>


    </>
  );
};

export default LoginSignin;

