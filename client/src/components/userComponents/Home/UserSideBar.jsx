// components/Sidebar.jsx
import { FiHome, FiSearch, FiPlus, FiMusic, FiCalendar } from 'react-icons/fi';
import { RiCompassDiscoverLine } from 'react-icons/ri';




const UserSideBar = ({ activeTab, setActiveTab }) => {
  const playlists = [
    { id: 1, name: 'Workout Mix', songCount: 12, coverColor: '#ff4d4d' },
    { id: 2, name: 'Chill Vibes', songCount: 8, coverColor: '#4d79ff' },
    { id: 3, name: 'Road Trip', songCount: 15, coverColor: '#4dffb8' },
  ];

  const upcomingEvents = [
    { id: 1, artist: 'Burna Boy', date: 'Oct 15', location: 'Lagos', price: '$50+' },
    { id: 2, artist: 'Wizkid', date: 'Nov 2', location: 'Accra', price: '$40+' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">Afro<span>Feel</span></div>

      <nav className="main-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
          <FiHome /> Home
        </button>
        <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>
          <FiSearch /> Search
        </button>
        <button className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}>
          <RiCompassDiscoverLine /> Discover
        </button>
        <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
          <FiMusic /> Library
        </button>
        <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
          <FiCalendar /> Events
        </button>
      </nav>

      <div className="user-playlists">
        <h3>Your Playlists</h3>
        <button className="create-playlist">
          <FiPlus /> Create Playlist
        </button>
        <ul>
          {playlists.map(playlist => (
            <li key={playlist.id}>
              <div className="playlist-cover" style={{ backgroundColor: playlist.coverColor }}>
                <FiMusic />
              </div>
              <div>
                <p className="playlist-name">{playlist.name}</p>
                <p className="song-count">{playlist.songCount} songs</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="events-preview">
        <h3>Upcoming Events</h3>
        {upcomingEvents.map(event => (
          <div key={event.id} className="event-preview-card">
            <div className="event-preview-info">
              <h4>{event.artist}</h4>
              <p>{event.date} • {event.location}</p>
            </div>
            <span className="event-price">{event.price}</span>
          </div>
        ))}
        <button className="see-all-events">See all events</button>
      </div>
    </aside>
  );
};

export default UserSideBar;
