import { Link, useNavigate } from 'react-router-dom';
import Auth from '../utils/auth';
import '../pages/CSS/NavTabs.css';

export default function NavTabs() {
  const navigate = useNavigate(); 
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
    navigate('/'); 
  };

  const loggedIn = Auth.loggedIn();
  const username = loggedIn ? Auth.getProfile().data.username : '';

  if (!loggedIn) {
    return (
      <div className="nav-tabs">
        <Link to="/">
          <button className="btn btn-lg btn-light m-2">Login / Sign Up</button>
        </Link>
      </div>
    ); // If not logged in, show login/signup button
  }

  return (
    

    <>
     <div className="welcome-section">
        <span>Welcome, {username}</span>
        <button className="btn btn-lg btn-light m-2" onClick={logout}>
          Logout
        </button>
      </div>
    

    <nav className="nav-tabs">

     


      <div className="nav-links">
        <Link to="/home">
          <button type="button">Home</button>
        </Link>
        <Link to="/search">
          <button type="button">Search</button>
        </Link>
        <Link to="/libraly">
          <button type="button">Libraly</button>
        </Link>
        <Link to="/createPlaylist">
          <button type="button">Playlist</button>
        </Link>
        <Link to="/more">
          <button type="button">More</button>
        </Link>
      </div>
    </nav>

        </>
  );
}
