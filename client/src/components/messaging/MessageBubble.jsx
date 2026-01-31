import React from "react";
import { Box, Typography } from "@mui/material";

export default function MessageBubble({ message, isOwnMessage }) {
  return (
    <Box
      sx={{
        mb: 1,
        p: 1.5,
        borderRadius: 2,
        bgcolor: isOwnMessage ? "primary.dark" : "grey.200",
        color: isOwnMessage ? "common.white" : "text.primary",
        alignSelf: isOwnMessage ? "flex-end" : "flex-start",
        maxWidth: "65%",
        position: "relative",
        mr: isOwnMessage ? 4 : 0,
        ml: isOwnMessage ? 0 : 2,
      }}
    >
      <Typography variant="body2">{message.content}</Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
        {new Date(message.createdAt).toLocaleTimeString()}
      </Typography>
    </Box>
  );
}
