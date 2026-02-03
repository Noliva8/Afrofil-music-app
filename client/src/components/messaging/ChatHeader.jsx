import React from "react";
import { Box, Typography, IconButton, Divider, Stack } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

export default function ChatHeader({ booking, onClose, unreadCount, artistName, currentUser }) {

  console.log('BOOKING', booking)
    console.log('BOOKED ARTIST', currentUser)

  const userName = booking?.user?.username || booking?.userName || "Client";

  const shouldShowArtist = currentUser?.type === "user" && artistName;
    console.log('BOOKING USER', shouldShowArtist)
  return (



    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton size="small" onClick={onClose}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>
        <Stack spacing={0.2} sx={{ flex: 1 }}>

          <Typography variant="subtitle1" fontWeight="bold">
            Chatting with {shouldShowArtist ? artistName : userName}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {booking?.eventType || "Event"} ·{" "}
            {booking?.location?.venue || booking?.location?.city || "Location"}
          </Typography>
        </Stack>
        {unreadCount > 0 && (
          <Typography variant="caption" color="secondary">
            {unreadCount} unread
          </Typography>
        )}
      </Box>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
}
