import { FaBars, FaTimes } from 'react-icons/fa';
import ForArtistOnly from './ForArtistOnly';
import { useState } from 'react';


const MobileNav = ({ showArtistButton, setShowArtistButton }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isOpen && (
        <div className="mobile-menu">
          <nav className="mobile-links">
            {/* Your navigation links here */}
          </nav>
          
          {showArtistButton && (
            <div className="mobile-artist-option">
              <ForArtistOnly />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileNav;