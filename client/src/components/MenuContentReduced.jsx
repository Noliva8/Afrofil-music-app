import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import { alpha } from "@mui/material/styles";

export default function MenuContentReduced() {
  const itemSx = (isActive) => (theme) => ({
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : "transparent",
    transition: "background-color 0.2s ease, color 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.text.primary,
    },
  });

  return (
    <Stack sx={{ flexGrow: 1, p: 1, mt: 3, justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 1,
          width: "100%",
        }}
      >
        <NavLink to="home" style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <Box sx={itemSx(isActive)}>
              <HomeRoundedIcon />
            </Box>
          )}
        </NavLink>

        <NavLink to="content" style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <Box sx={itemSx(isActive)}>
              <SourceIcon />
            </Box>
          )}
        </NavLink>

        <NavLink to="dashboard" style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <Box sx={itemSx(isActive)}>
              <DashboardRounded />
            </Box>
          )}
        </NavLink>
      </Box>
    </Stack>
  );
}
