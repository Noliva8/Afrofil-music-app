import React from "react";
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { ShareButton } from "./ShareButton.jsx";

export const ActionButtonsGroup = ({
  isFavorite,
  onToggleFavorite,
  onShare,
  onMore,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 0.5, sm: 1, md: 2 },
        justifyContent: { xs: "space-between", sm: "flex-start" },
        mt: { xs: 2, md: 0 },
        width: { xs: "100%", md: "auto" },
      }}
    >
      <IconButton
        onClick={onToggleFavorite}
        aria-label="Add to Favorites"
        sx={{
          color: isFavorite ? "#E4C421" : "rgba(255,255,255,0.85)",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          p: { xs: 1.2, sm: 1.5 },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.15)",
            transform: "scale(1.05)",
          },
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          minWidth: { xs: 70, sm: 80 },
        }}
      >
        {isFavorite ? (
          <FavoriteIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }} />
        ) : (
          <FavoriteBorderIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }} />
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: isFavorite ? "#E4C421" : "inherit",
          }}
        >
          {isFavorite ? "Added" : "Add"}
        </Typography>
      </IconButton>

      <ShareButton handleShare={onShare} />

      <IconButton
        aria-label="More options"
        onClick={onMore}
        sx={{
          color: "rgba(255,255,255,0.85)",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          p: { xs: 1.2, sm: 1.5 },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.15)",
            transform: "scale(1.05)",
          },
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          minWidth: { xs: 70, sm: 80 },
        }}
      >
        <MoreHorizIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          More
        </Typography>
      </IconButton>
    </Box>
  );
};
