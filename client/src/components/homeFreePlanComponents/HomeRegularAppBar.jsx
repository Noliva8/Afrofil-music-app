import { FiHome, FiSearch, FiMusic, FiCalendar } from 'react-icons/fi';
import { RiCompassDiscoverLine } from 'react-icons/ri';

const HomeRegularAppNavBar = ({ activeTab, setActiveTab, isMobile }) => {
  const navItems = [
    { id: 'home', icon: <FiHome />, label: 'Home' },
    { id: 'search', icon: <FiSearch />, label: 'Search' },
    { id: 'discover', icon: <RiCompassDiscoverLine />, label: 'Discover' },
    { id: 'library', icon: <FiMusic />, label: 'Library' },
    { id: 'events', icon: <FiCalendar />, label: 'Events' }
  ];

  if (isMobile) {
    return (
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="main-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={activeTab === item.id ? 'active' : ''}
          onClick={() => setActiveTab(item.id)}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </nav>
  );
};

export default HomeRegularAppNavBar;