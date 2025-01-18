import React, { useState } from "react";
import StudioNavBar from "./StudioNavBar";
import { SitemarkIcon } from "../components/themeCustomization/customIcon";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import "../pages/CSS/freeAppNavBar.css";
import ArtistAuth from "../utils/artist_auth";

export default function FreePlanAppNavBar() {
  const [showLogout, setShowLogout] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);

  // Toggle logout display
  function handleLogoutDisplay() {
    setShowLogout((prevState) => !prevState);
  }

  // Toggle side menu visibility
  function handleSideMenuDisplay() {
    setShowSideMenu((prevState) => !prevState);
  }

  return (
    <>
      <header className="planHeader-freePlan">
        <div className="logoMenu">
          <button onClick={handleSideMenuDisplay} className="menuButton">
            <MenuIcon />
          </button>
          <SitemarkIcon />
        </div>

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
            <div className={`profileContainer ${showLogout ? "show" : ""}`}>
              <button
                onClick={() => {
                  console.log("Logged out");
                  ArtistAuth.logout(); // Handle logout logic
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Side Menu */}
      <StudioNavBar
        isVisible={showSideMenu}
        onClose={handleSideMenuDisplay} // Pass function to toggle visibility
      />
    </>
  );
}
