import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { Link } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import "../pages/CSS/CSS-HOME-FREE-PLAN/MenuContent.css";

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
  "&.active": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export default function MenuContentReduced() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, mt: 5, justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",

          justifyContent: "flex-start" /* Aligns links to the start */,
          alignItems: "center",
          gap: "2.5rem" ,
          width: "100%" ,
          marginRight: "1rem" ,
          
        }}
      >
        <Link to="home" className="nav-item">
          <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
            <HomeRoundedIcon />
          </span>
        </Link>

        <Link to="content" className="nav-item">
          <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
            <SourceIcon />
          </span>
        </Link>

        <Link to="dashboard" className="nav-item">
          <span  style={{ fontSize: '18px', fontWeight: '400', color: 'white' }}>
            <DashboardRounded />
          </span>
        </Link>
      </Box>
    </Stack>
  );
}