import { Box } from "@mui/material";
import ChatHeader from "./ChatHeader";
import ChatWindow from "./ChatWindow";

export default function ChatContainer({ booking, currentUser, onClose, artistName }) {
  if (!booking) {
    return (
      <Box sx={{ p: 2 }}>
        Select a booking to start chatting.
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <ChatHeader
        booking={booking}
        onClose={onClose}
        unreadCount={booking.unreadCount || 0}
        artistName={artistName}
        currentUser={currentUser}
      />
      <ChatWindow bookingId={booking.bookingId} currentUser={currentUser} />
    </Box>
  );
}
