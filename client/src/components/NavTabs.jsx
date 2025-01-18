import { Link } from 'react-router-dom';
import { FaHome, FaSearch, FaMusic, FaPlus, FaEllipsisH } from 'react-icons/fa'; // Import React Icons
import Auth from '../utils/auth';
import '../pages/CSS/NavTabs.css'; 

export default function NavTabs() {
  const loggedIn = Auth.loggedIn();

  if (!loggedIn) {
    return (
      <div className="nav-tabs">
        <Link to="/">
          <button className="btn btn-lg btn-light m-2">Login / Sign Up</button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="nav-tabs">
        <div className="nav-links">
          {/* Each icon has a label */}
          <Link to="/home" className="nav-item">
            <FaHome size={24} />
            <span>Home</span>
          </Link>
          <Link to="/search" className="nav-item">
            <FaSearch size={24} />
            <span>Search</span>
          </Link>
          <Link to="/libraly" className="nav-item">
            <FaMusic size={24} />
            <span>Library</span>
          </Link>
          <Link to="/createPlaylist" className="nav-item">
            <FaPlus size={24} />
            <span>Playlist</span>
          </Link>
          <Link to="/more" className="nav-item">
            <FaEllipsisH size={24} />
            <span>More</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
