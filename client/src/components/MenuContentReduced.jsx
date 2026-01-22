import React, { useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { Link } from "react-router-dom";
import { styled } from "@mui/material/styles";
import ContentPaste from "@mui/icons-material/ContentPaste";
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
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
          <span>
            <HomeRoundedIcon />
          </span>
        </Link>

        <Link to="content" className="nav-item">
          <span>
            <SourceIcon />
          </span>
        </Link>

        <Link to="dashboard" className="nav-item">
          <span>
            <DashboardRounded />
          </span>
        </Link>
      </Box>
    </Stack>
  );
}
