import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import '../pages/CSS/CSS-HOME-FREE-PLAN/MenuContent.css'

export default function MenuContent({handleShowMobileMenu}) {
  return (

    <Stack sx={{ flexGrow: 1, p: 1, mt: 5, justifyContent: 'space-between' }}>
      
<Box sx={{
  display: 'flex', 
  flexDirection: 'column',

  justifyContent: 'flex-start', /* Aligns links to the start */
  alignItems: 'center', 
  gap: '2.5rem', /* Controls spacing between items */
  width: '100%', /* Ensures it takes full width */
  marginLeft: '1rem' /* Keeps a consistent left margin */
}}>
 

        <Link to="home" className="nav-item" onClick={handleShowMobileMenu}>
  <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    <HomeRoundedIcon />
  </span>
  <span className="nav-text" style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    Home
  </span>
</Link>

<Link to="content" className="nav-item" onClick={handleShowMobileMenu}>
  <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    <SourceIcon />
  </span>
  <span className="nav-text" style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    Content
  </span>
</Link>

<Link to="dashboard" className="nav-item" onClick={handleShowMobileMenu}>
  <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    <DashboardRounded />
  </span>
  <span className="nav-text" style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    Dashboard
  </span>
</Link>

    
</Box>


    </Stack>
  );
}
