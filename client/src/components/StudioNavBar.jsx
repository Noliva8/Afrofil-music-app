import "../pages/CSS/sideNavBar.css";

import SourceIcon from "@mui/icons-material/Source";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import HomeIcon from "@mui/icons-material/Home";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { useNavigate } from "react-router-dom";
import { startTransition } from "react";


export default function StudioNavBar({ isVisible, onClose }) {
  const navigate = useNavigate();
  const handleDashboard = () => {
    onClose?.();
    startTransition(() => navigate("/artist/studio/dashboard"));
  };
  const handleNavigate = (path) => {
    onClose?.();
    startTransition(() => navigate(path));
  };



  return (
    <nav className={`sideNav ${isVisible ? "expanded" : "collapsed"}`}>
      {isVisible && (  // Conditionally render the close button only when expanded
        <button className="closeButton" onClick={onClose}>
          <CancelPresentationIcon />
        </button>
      )}

      <div className="sideNavContainer">
        <button className="nav-item" onClick={() => handleNavigate("/artist/studio/home")}>
          <span>
            <HomeIcon />
          </span>
          <span className="nav-text">Home</span>
        </button>

        <button className="nav-item" onClick={() => handleNavigate("/artist/studio/content")}>
          <span>
            <SourceIcon />
          </span>
          <span className="nav-text">Content</span>
        </button>

        <button className="nav-item" onClick={handleDashboard}>
          <span>
            <DashboardCustomizeIcon />
          </span>
          <span className="nav-text">Dashboard</span>
        </button>
        
      </div>
    </nav>
  );
}
