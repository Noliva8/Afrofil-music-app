import React from "react";
import Stack from "@mui/material/Stack";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MenuButton from "./MenuButton";
import NavbarTitles from "./NavBarTitles";
import Avatar from "@mui/material/Avatar";
import Search from "./Search";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Box from "@mui/material/Box";

export default function StudioHeader({ openDrawer, handleShowDrawers, handleshowAccountMenu, profileImage }) {
  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: "none", md: "flex" },
        width: "100%",
        alignItems: "center",

        justifyContent: "space-between",
        maxWidth: { sm: "100%", md: "1700px" },
        pt: 4.5,
      }}
      spacing={2}
    >

{/*  -----------------*/}
      <Box
        sx={{
          display: "flex",
          gap: "4rem",
          color: "var(--button-color)",
          fontSize: "1.8rem",
        }}
      >
        <MenuButton sx={{bgcolor: 'var(--button-color)', borderRadius: '10px', width: '40px', height: '40px'}} onClick={handleShowDrawers}>
          <MenuRoundedIcon sx={{ color: "black" }} />
        </MenuButton>

        <NavbarTitles />
      </Box>
{/* ------------------------------------ */}

      <Stack direction="row" sx={{ gap: 3 }}>
        <Search />

        <Button onClick={handleshowAccountMenu}>
          <Avatar src= {profileImage} alt="Remy Sharp" />
        </Button>

        <MenuButton aria-label="Open notifications">
          <Badge
            showZero
            badgeContent={4}
            sx={{
              ".MuiBadge-badge": {
                backgroundColor: "white",
                color: "black",
              },
            }}
          >
            <NotificationsRoundedIcon
              sx={{ color: "var(--button-color)", fontSize: "1.8rem" }}
            />
          </Badge>
        </MenuButton>
      </Stack>
    </Stack>
  );
}
