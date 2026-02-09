import { useMemo, useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Dialog,
  DialogContent,
  Box,
  CircularProgress,
  Paper,
  Link,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useQuery } from "@apollo/client";
import { MESSAGE_CONVERSATIONS } from "../utils/queries";
import ArtistAuth from "../utils/artist_auth";
import UserAuth from "../utils/auth";
import ChatContainer from "./messaging/ChatContainer";

export default function ArtistMessagingPanel() {
  const [open, setOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const dropdownOpen = Boolean(anchorEl);

  const { data: conversationsData, loading: convLoading } = useQuery(MESSAGE_CONVERSATIONS);
  const conversations = conversationsData?.messageConversations || [];
  const totalUnread = useMemo(
    () => conversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0),
    [conversations]
  );

  useEffect(() => {
    if (!selectedBookingId && conversations.length) {
      const firstChat = conversations.find((item) => item.isChatEnabled);
      setSelectedBookingId(firstChat?.bookingId || conversations[0]?.bookingId || null);
    }
  }, [conversations, selectedBookingId]);

  const handleClose = () => setOpen(false);
  const handleMenuOpen = (event) => {
    if (!enabledConversations.length) return;
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const handleDropdownSelect = (bookingId) => {
    setSelectedBookingId(bookingId);
    handleMenuClose();
    setOpen(true);
  };

  const enabledConversations = useMemo(
    () => conversations.filter((item) => item.isChatEnabled),
    [conversations]
  );

  const artistName = ArtistAuth.isArtist() ? ArtistAuth.getProfile()?.artistAka : "Artist";
  const currentUser = ArtistAuth.isArtist()
    ? { id: ArtistAuth.getProfile()._id, type: "artist" }
    : UserAuth.loggedIn()
      ? { id: UserAuth.getUserId(), type: "user" }
      : null;

  return (
    <>
      <IconButton
        aria-label="Open chat menu"
        onClick={handleMenuOpen}
        disabled={!enabledConversations.length}
        sx={{ color: "white" }}
      >
        <Badge badgeContent={totalUnread} color="secondary" showZero>
          <MailOutlineIcon fontSize="large" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={dropdownOpen}
        onClose={handleMenuClose}
        PaperProps={{ sx: { width: 360, maxHeight: 420, pt: 1, pb: 1 } }}
      >
        {convLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : enabledConversations.length ? (
          enabledConversations.map((convo) => (
            <MenuItem
              key={convo.bookingId}
              disableRipple
              sx={{ px: 2, py: 1, justifyContent: "stretch" }}
            >
              <Paper
                variant="outlined"
                component={Link}
                underline="none"
                sx={{
                  width: '100%',
                  p: 1.5,
                  display: 'block',
                  borderRadius: 2,
                  color: 'text.primary',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 30,
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: (theme) => theme.palette.primary.main,
                  },
                }}
                onClick={(event) => {
                  event.preventDefault();
                  handleDropdownSelect(convo.bookingId);
                }}
              >
                <Typography variant="body1" fontWeight="bold" noWrap>
                  Chat with {convo.userName || "client"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                  {convo.eventType || "Event"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  {convo.location?.venue ? `${convo.location.venue} · ` : ""}
                  {convo.location?.city || convo.location?.country
                    ? `${convo.location?.city || ""}${convo.location?.city && convo.location?.country ? " · " : ""}${convo.location?.country || ""}`
                    : "Location TBD"}
                </Typography>
                {convo.eventDate && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(convo.eventDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                )}
              </Paper>
              {convo.unreadCount > 0 && (
                <Badge badgeContent={convo.unreadCount} color="secondary" />
              )}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" textAlign="center">
              Accept a booking to start chatting.
            </Typography>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent>
          <Box display="flex" gap={2} sx={{ minHeight: 400 }}>
            <Divider orientation="vertical" flexItem />
            <Box flex={1}>
              <ChatContainer
                booking={conversations.find((item) => item.bookingId === selectedBookingId)}
                currentUser={currentUser}
                artistName={artistName}
                onClose={handleClose}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
