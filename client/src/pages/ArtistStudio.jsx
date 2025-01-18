import React from 'react';
import FreePlanAppNavBar from '../components/FreePlanAppNavBar';
import StudioNavBar from "../components/StudioNavBar";
import HomeFreePlan from './freeDashboard/HomeFreePlan';

import './CSS/studio.css';

export default function ArtistStudio(){
  return(
    <div className="artistStudioContainer">
      {/* Fixed Top Navigation */}
      <div className="appNavBar">
        <FreePlanAppNavBar />
      </div>

      {/* Fixed Side Navigation */}
      <div className="studioNavBar">
        <StudioNavBar />
      </div>

      {/* Main Content */}
      <div className="mainContent">
        <HomeFreePlan />
      </div>
    </div>
  );
}
