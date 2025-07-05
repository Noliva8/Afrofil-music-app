import { useState } from 'react';
import searchSong from '../utils/api.js';
import ForArtistOnly from '../components/ForArtistOnly.jsx';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaHome, FaMusic, FaHeart, FaUser } from 'react-icons/fa';
import { MdLibraryMusic } from 'react-icons/md';
import ProfileDropdown from '../components/ProfileDropdown'; // Added back
import Auth from '../utils/auth'; // Import Auth for logout

export default function Home({ isMobile }) {
  const [findSongs, setFindSongs] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const navigate = useNavigate();

  const songs = async (query) => {
    try {
      const { data } = await searchSong(query);
      if (data?.data) {
        setFindSongs(data.data);
      } else {
        setFindSongs([]);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSearchChange = (e) => setQuery(e.target.value);
  const handleSearch = () => songs(query);
  const handlePlay = (song) => setSelectedSong(song);

  // Logout function
  const handleLogout = () => {
    Auth.logout();
    navigate('/login');
  };

  return (
    <div className="home-container">
      {/* Desktop Profile Dropdown */}
      {!isMobile && (
        <div className="profile-dropdown-container">
          <ProfileDropdown onLogout={handleLogout} />
        </div>
      )}

      {/* Artist Entrance - Positioned carefully */}
      {!isMobile && (
        <div className="artist-entrance-desktop">
          <ForArtistOnly />
        </div>
      )}

      <div className="search-section">
        <h1>Search and Play Songs</h1>
        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search for a song..."
          />
          <button onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Song List */}
      <div className="song-list">
        {findSongs.length === 0 ? (
          <p className="no-songs">No songs found. Try searching again.</p>
        ) : (
          findSongs.map((song) => (
            <div
              key={song.id}
              className="song-item"
              onClick={() => handlePlay(song)}
            >
              <img src={song.image} alt={song.name} />
              <div className="song-info">
                <h3>{song.name}</h3>
                <p>{song.artist}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audio Player */}
      {selectedSong && (
        <div className="audio-player">
          <h2>Now Playing: {selectedSong.name}</h2>
          <audio controls autoPlay>
            <source src={selectedSong.preview} type="audio/mp3" />
          </audio>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="bottom-nav">
          <button onClick={() => navigate('/')}>
            <FaHome />
            <span>Home</span>
          </button>
          <button onClick={() => navigate('/search')}>
            <FaSearch />
            <span>Search</span>
          </button>
          <button className="artist-button">
            <ForArtistOnly mobileVersion />
          </button>
          <button onClick={() => navigate('/library')}>
            <MdLibraryMusic />
            <span>Library</span>
          </button>
          <button onClick={() => navigate('/profile')}>
            <FaUser />
            <span>Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}