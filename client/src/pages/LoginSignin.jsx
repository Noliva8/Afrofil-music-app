import './CSS/loginSignin.css';
import logo from '../images/logo.png';
import react, { useState, useEffect } from 'react';
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




const LoginSignin = function ({ display = '', onSwitchToLogin, onSwitchToSignup, onClose, isUserLoggedIn}) {




// Query the data to play and to display
const { data, loading,  error } = useQuery(TRENDING_SONGS_PUBLIC);

// Presigned url to show images and play songs from s3
const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);

// Song states
const [songsWithArtwork, setSongsWithArtwork] = useState([]);
const [selectedSong, setSelectedSong] = useState(null);
const [duration, setDuration] = useState(0);
const [currentTime, setCurrentTime] = useState(0);
const [volume, setVolume] = useState(1);



// Playing States
  const audioRef = useRef(null);
const [nowPlaying, setNowPlaying] = useState({
  songId: null,
  isPlaying: false,
  audioUrl: null
});



// for teaser
const teaserTimeoutRef = useRef(null);
const [teaserMode, setTeaserMode] = useState(false);    
const [showAuthModal, setShowAuthModal] = useState(false); 

const TEASER_DURATION = 30;


// slider animation
const [isDragging, setIsDragging] = useState(false);






// next and previous




/* 
Here we need to fetch the songs to dsplay in cards. But because we dont have any button to trigger this function, we are using useEffect which will trigger the function once the component mounts.
*/

useEffect(() => {
  const fetchArtworksAndAudio = async () => {
    if (!data?.trendingSongs) return;

    const updatedSongs = await Promise.all(
      data.trendingSongs.map(async (song) => {
        let artworkUrl = 'https://via.placeholder.com/300x300?text=No+Cover';
        let audioUrl = null;

        // Artwork
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

        // Audio
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

console.log('check the fetched song:', songsWithArtwork);




// 1. Utilities: Next and Previous Song
const handleNextSong = () => {
  const index = songsWithArtwork.findIndex(s => s._id === nowPlaying.songId);
  const next = songsWithArtwork[(index + 1) % songsWithArtwork.length];
  if (next) handleSongPlay(next);
};

const handlePreviousSong = () => {
  const index = songsWithArtwork.findIndex(s => s._id === nowPlaying.songId);
  const prev = songsWithArtwork[(index - 1 + songsWithArtwork.length) % songsWithArtwork.length];
  if (prev) handleSongPlay(prev);
};


// 2. Play Song Handler
const handleSongPlay = (song) => {
  const isSame = nowPlaying.songId === song._id;

  if (!isUserLoggedIn) {
    setTeaserMode(true); // 🔒 Teaser mode active
  } else {
    setTeaserMode(false);
  }

  if (isSame && nowPlaying.isPlaying) {
    audioRef.current?.pause();
    setNowPlaying(prev => ({ ...prev, isPlaying: false }));
  } else {
    if (!isSame) {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
    }
    setSelectedSong(song);
    setNowPlaying({
      songId: song._id,
      isPlaying: true,
      audioUrl: song.audioUrl,
    });
  }
};


// 3. Cleanup on Unmount (just in case teaserTimeoutRef is used anywhere)
useEffect(() => {
  return () => {
    clearTimeout(teaserTimeoutRef.current);
  };
}, []);


// 4. Play / Pause when `nowPlaying` state changes
useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !nowPlaying.audioUrl) return;

  if (audio.src !== nowPlaying.audioUrl) {
    audio.src = nowPlaying.audioUrl;
  }

  nowPlaying.isPlaying
    ? audio.play().catch(console.error)
    : audio.pause();
}, [nowPlaying.audioUrl, nowPlaying.isPlaying]);


// 5. Smooth Slider Progress + Teaser Playback Control
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const updateTime = () => {
    if (!isDragging) {
      setCurrentTime(audio.currentTime);
    }


   if (
  teaserMode &&
  !isUserLoggedIn &&
  audio.currentTime >= TEASER_DURATION
) {
  audio.pause();
  setNowPlaying(prev => ({ ...prev, isPlaying: false }));

  // Ensure we only trigger once
  if (!teaserTimeoutRef.current) {
    teaserTimeoutRef.current = setTimeout(() => {
      setShowAuthModal(true);
      handleNextSong(); // ⏭ Play next song after showing modal
      teaserTimeoutRef.current = null;
    }, 800); // enough delay for pause to register
  }
}



  };

  audio.addEventListener("timeupdate", updateTime);
  return () => audio.removeEventListener("timeupdate", updateTime);
}, [teaserMode, handleNextSong, isDragging, isUserLoggedIn]);


// 6. Sync Duration (override to 30s in teaser mode)
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const setAudioDuration = () => {
    setDuration(teaserMode ? TEASER_DURATION : audio.duration);
  };

  audio.addEventListener("loadedmetadata", setAudioDuration);
  return () => audio.removeEventListener("loadedmetadata", setAudioDuration);
}, [teaserMode]);


// 7. Auto-Play Next on End (full songs only)
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  audio.addEventListener("ended", handleNextSong);
  return () => audio.removeEventListener("ended", handleNextSong);
}, [handleNextSong]);


// 8. Keep Volume in Sync with UI
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const syncVolume = () => setVolume(audio.volume);
  audio.addEventListener("volumechange", syncVolume);
  return () => audio.removeEventListener("volumechange", syncVolume);
}, []);


// 9. Exit Teaser Mode When Logged In
useEffect(() => {
  if (isUserLoggedIn) {
    setTeaserMode(false);
    clearTimeout(teaserTimeoutRef.current); // defensive, even if unused
  }
}, [isUserLoggedIn]);


// 10. Slider Handlers (for drag/seek behavior)
const handleSliderChange = (_, value) => {
  setIsDragging(true);
  setCurrentTime(value);
};

const handleSliderCommit = (_, value) => {
  audioRef.current.currentTime = value;
  setIsDragging(false);
};








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
    nowPlaying={nowPlaying} // ✅ add this
 isPlaying={nowPlaying.isPlaying}
    playingSongId={nowPlaying.songId}
  onSongPlay={handleSongPlay}
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
      if (audioRef.current) {
        audioRef.current.volume = v;
      }
      setVolume(v);
    }}
    onSliderChange={handleSliderChange} // ✅ Optional
    onSliderCommit={handleSliderCommit} // ✅ Optional
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
