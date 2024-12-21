import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAuth from '../utils/auth';
import '../pages/CSS/profile.css';

const ProfileDropdown = () => {
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const navigate = useNavigate();

  const loggedIn = UserAuth.loggedIn();
  const username = loggedIn ? UserAuth.getProfile().data.username : '';
  console.log(username);

  const handleLogout = () => {
    UserAuth.logout();
    navigate('/loginSignin');
  };

  const toggleProfile = () => {
    setIsProfileExpanded((prevState) => !prevState);
  };

  const collapseProfile = () => {
    setIsProfileExpanded(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const profileContainer = document.querySelector('.profile-header');
      if (profileContainer && !profileContainer.contains(event.target)) {
        collapseProfile();
      }
    };

    const handleScroll = () => collapseProfile();

    // Add event listeners
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('scroll', handleScroll);

    // Clean up event listeners
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!loggedIn) return null;

  return (
    <div
      className={`profile-header ${isProfileExpanded ? 'expanded' : ''}`}
    >
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-icon" onClick={toggleProfile}>
          {username.charAt(0).toUpperCase()}
        </div>
        {isProfileExpanded && <span className="profile-username">{username}</span>}
      </div>

      {/* Dropdown Menu */}
      {isProfileExpanded && (
        <div className="dropdown-menu">
          <ul>
            <li onClick={handleLogout}>Logout</li>
            <li>About</li>
            <li>Settings</li>
            <li>Privacy</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
