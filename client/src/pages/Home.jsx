// Home.jsx (modularized entry)
import { useState, useEffect } from 'react';
import UserSideBar from '../components/userComponents/Home/UserSideBar';
import UserMobileHeader from '../components/userComponents/Home/UserMobileHeader';
import PremiumCard from '../components/userComponents/Home/PremiumCard';
import AdBanner from '../components/userComponents/Home/AdBanner';
import PlaylistSection from '../components/userComponents/Home/PlaylistSection';
import MadeForYou from '../components/userComponents/Home/MadeForYou';
import EventsSection from '../components/userComponents/Home/EventsSection';
import PromotedArtists from '../components/userComponents/Home/PromotedArtists';
import NowPlayingBar from '../components/userComponents/Home/NowPlayingBar';
import '../pages/CSS/CSS-HOME-FREE-PLAN/home.css';
import PremiumCheckout from '../components/userComponents/Home/Premium/PremiumCheckout';
import PremiumCheckoutPage from '../components/userComponents/Home/Premium/PremiumCheckoutPage';
import PremiumPromoModal from '../components/userComponents/Home/Premium/PremiumPromoModal';


const Home = ({ upgradeToPremium }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Checkout Visibility
  // ------------------
  const [showCheckout, setShowCheckout] = useState(false);


  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="music-app">
      {!isMobile && (
        <UserSideBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <main className="content-area">
        {isMobile && <UserMobileHeader />}

        <div className="content-wrapper">
         <PremiumCard upgradeToPremium={() => setShowCheckout(true)} />
           <AdBanner />

          <div className="main-content-grid">
            <div className="main-content-column">
              <PlaylistSection
                currentSong={currentSong}
                setCurrentSong={setCurrentSong}
                setIsPlaying={setIsPlaying}
              />
              <MadeForYou />
              <EventsSection />
            </div>

            {!isMobile && <PromotedArtists />}
          </div>
        </div>
      </main>

      {isMobile && (
        <nav className="mobile-nav">
          <button 
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button 
            className={activeTab === 'library' ? 'active' : ''}
            onClick={() => setActiveTab('library')}
          >
            Library
          </button>
          <button 
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </nav>
      )}

      <NowPlayingBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
      />


      {showCheckout && (
  <PremiumPromoModal
    onClose={() => setShowCheckout(false)}
    onSubscribe={(plan) => {
      console.log('Subscribed to:', plan);
      // TODO: update user context to 'premium'
      setShowCheckout(false);
    }}
  />
)}

    </div>

  );
};

export default Home;
