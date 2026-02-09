
import '../pages/CSS/plan.css'
import { useState } from 'react';
import ArtistAuth from '../utils/artist_auth';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


export default function AppNavBar (){
const [showLogout, setShowLogout] = useState(false);

  // Toggle logout display
  function handleLogoutDisplay() {
    setShowLogout((prevState) => !prevState);
  }



    return(
         <header className="planHeader">
          <SitemarkIcon />
          <div className="accountContainer">
            <button
              type="button"
              className="accountButton"
              onClick={handleLogoutDisplay}
            >
              <AccountCircleIcon />
            </button>

            {/* Profile / Logout Button */}
            {showLogout && (
              <div className={`profileContainer ${showLogout ? 'show' : ''}`}>
                <button
                  onClick={() => {
                    console.log('Logged out');
                    ArtistAuth.logout(); // Handle logout logic
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
    )
}