import { Box, Typography, useTheme } from "@mui/material";

export default function MessageBubble({ message, isOwnMessage }) {
  const statusText = isOwnMessage
    ? message.readByUser
      ? "Read"
      : "Sent"
    : null;
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          mb: 0.25,
          p: 1.5,
          borderRadius: 2,
          bgcolor: isOwnMessage
            ? theme.palette.primary.main
            : theme.palette.background.paper,
          color: isOwnMessage ? theme.palette.primary.contrastText : theme.palette.text.primary,
          boxShadow: isOwnMessage ? theme.shadows[6] : "0 1px 4px rgba(0, 0, 0, 0.08)",
          alignSelf: isOwnMessage ? "flex-start" : "flex-end",
          maxWidth: "65%",
          mr: isOwnMessage ? 4 : 0,
          ml: isOwnMessage ? 0 : 2,
        }}
      >
        <Typography variant="body2">{message.content}</Typography>
        <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </Typography>
      </Box>
      {statusText && (
        <Typography
          variant="caption"
          sx={{
            alignSelf: isOwnMessage ? "flex-start" : "flex-end",
            textAlign: isOwnMessage ? "left" : "right",
            color: theme.palette.text.secondary,
            ml: isOwnMessage ? 0 : 2.5,
            mr: isOwnMessage ? 4 : 0,
            mb: 1,
          }}
        >
          {statusText}
        </Typography>
      )}
    </>
  );
}
