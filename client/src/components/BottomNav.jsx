import { FaHome, FaSearch, FaHeart, FaUser } from 'react-icons/fa';
import { MdLibraryMusic } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const BottomNav = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', icon: <FaHome />, label: 'Home', path: '/' },
    { id: 'search', icon: <FaSearch />, label: 'Search', path: '/search' },
    { id: 'library', icon: <MdLibraryMusic />, label: 'Library', path: '/library' },
    { id: 'favorites', icon: <FaHeart />, label: 'Favorites', path: '/favorites' },
    { id: 'profile', icon: <FaUser />, label: 'Profile', path: '/profile' }
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab)}
          aria-label={tab.label}
        >
          <div className="nav-icon">{tab.icon}</div>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;