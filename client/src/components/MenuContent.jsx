import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { Link } from "react-router-dom";
import { styled } from '@mui/material/styles';
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import '../pages/CSS/CSS-HOME-FREE-PLAN/MenuContent.css'

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
  },
  '&.active': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));



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



<Link to="dashboard" className="nav-item" onClick={handleShowMobileMenu}>
  <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
    <DashboardRounded />
  </span>
  <span className="nav-text" style={{ fontSize: '18px', fontWeight: '400', color: 'white'}}>
    Collabo Request
  </span>



</Link>

    
</Box>


    </Stack>
  );
}