import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import Box from "@mui/material/Box";
import DynamicFeedRoundedIcon from "@mui/icons-material/DynamicFeedRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useLocation, useNavigate } from "react-router-dom";

const GuestBottomNav = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const current = (() => {
    if (location.pathname.startsWith("/collection")) return "collections";
    if (location.pathname.startsWith("/explore")) return "search";
    if (location.pathname.startsWith("/feed")) return "feed";
    if (location.pathname.startsWith("/search")) return "search";
    return "music";
  })();

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
      elevation={0}
    >
      <BottomNavigation
        value={current}
        showLabels
        onChange={(_, value) => {
          if (value === "music") navigate("/loginSignin");
          if (value === "collections") {
            navigate("/collection");
          }
          if (value === "feed") navigate("/feed");
          if (value === "search") {
            navigate(isMobile ? "/explore?search=1" : "/search");
          }
        }}
        sx={{
          height: 72,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            flex: 1,
            py: 1,
            color: theme.palette.text.secondary,
          },
          "& .MuiBottomNavigationAction-root.Mui-selected": {
            color: theme.palette.primary.main,
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.75rem",
            opacity: 1,
          },
          "& .Mui-selected .MuiBottomNavigationAction-label": {
            fontWeight: 700,
          },
        }}
      >
        <BottomNavigationAction label="Music" value="music" icon={<MusicNoteRoundedIcon />} />
        <BottomNavigationAction
          label="Collections"
          value="collections"
          icon={<Box component="span" sx={{ fontSize: "1.25rem" }}>📚</Box>}
        />
        <BottomNavigationAction label="Feed" value="feed" icon={<DynamicFeedRoundedIcon />} />
        <BottomNavigationAction label="Explore" value="search" icon={<SearchRoundedIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default GuestBottomNav;
