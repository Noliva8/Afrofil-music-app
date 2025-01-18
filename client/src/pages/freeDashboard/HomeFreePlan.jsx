import React from "react";
import '../CSS/CSS-HOME-FREE-PLAN/homeFreePlan.css';
import Bio from "../../components/homeFreePlanComponents/Bio.jsx";
import Language from "../../components/homeFreePlanComponents/Language.jsx";
import Country from "../../components/homeFreePlanComponents/Country.jsx";
import Genre from "../../components/homeFreePlanComponents/Genre.jsx";


import ArtistAccountProfile from "../../components/homeFreePlanComponents/ArtistAccountProfile.jsx";



export default function HomeFreePlan() {



  return (
    <div className="wrapper">
    <div className="inner-wrapper">
      <header>
        <h1>Complete Your Profile</h1>
      </header>


      <main>
        






<ArtistAccountProfile />
     <Bio />
     <Language />
     <Country />
     <Genre />



      </main>

    
    </div>

    <footer>
      <h4>This is the footer</h4>
    </footer>
  </div>
  );
}
