import { Link } from "react-router-dom";
import "../pages/CSS/sideNavBar.css";

import SourceIcon from "@mui/icons-material/Source";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import HomeIcon from "@mui/icons-material/Home";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { useState } from "react";


export default function StudioNavBar({ isVisible, onClose }) {



  return (
    <nav className={`sideNav ${isVisible ? "expanded" : "collapsed"}`}>
      {isVisible && (  // Conditionally render the close button only when expanded
        <button className="closeButton" onClick={onClose}>
          <CancelPresentationIcon />
        </button>
      )}

      <div className="sideNavContainer">
        <Link to="home" className="nav-item">
          <span>
            <HomeIcon />
          </span>
          <span className="nav-text">Home</span>
        </Link>

        <Link to="content" className="nav-item">
          <span>
            <SourceIcon />
          </span>
          <span className="nav-text">Content</span>
        </Link>

        <Link to="dashboard" className="nav-item">
          <span>
            <DashboardCustomizeIcon />
          </span>
          <span className="nav-text">Dashboard</span>
        </Link>
      </div>
    </nav>
  );
}
