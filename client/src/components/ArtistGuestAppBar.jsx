import React, { useState, useEffect, useRef } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { useTheme } from "@mui/material/styles";
import { useQuery, useMutation } from "@apollo/client";
import ArtistAuth from "../utils/artist_auth";
import { GET_ARTIST_BOOKINGS } from "../utils/queries";
import { RESPOND_TO_BOOKING_ARTIST } from "../utils/mutations";

const ArtistGuestAppBar = () => {
  const theme = useTheme();
  const artistProfile = ArtistAuth.getProfile()?.data;
  const isArtist = ArtistAuth.isArtist();
  const [anchorEl, setAnchorEl] = useState(null);
  const [highlight, setHighlight] = useState(true);
  const prevCount = useRef(0);

  const {
    data: bookingsData,
    loading,
    startPolling,
    stopPolling,
    refetch,
  } = useQuery(GET_ARTIST_BOOKINGS, {
    variables: { status: "PENDING" },
    skip: !isArtist,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!isArtist) return;
    startPolling(6000);
    return () => stopPolling();
  }, [isArtist, startPolling, stopPolling]);

  useEffect(() => {
    const count = bookingsData?.artistBookings?.length || 0;
    if (count > prevCount.current) {
      setHighlight(true);
    }
    prevCount.current = count;
  }, [bookingsData]);

  const bookings = bookingsData?.artistBookings || [];
  const [respondToBooking] = useMutation(RESPOND_TO_BOOKING_ARTIST);

  const handleRespond = async (id, status) => {
    try {
      await respondToBooking({
        variables: {
          input: { bookingId: id, status },
        },
      });
      refetch?.();
    } catch (error) {
      console.error("Failed to respond to booking:", error);
    }
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setHighlight(false);
  };
  const handleClose = () => setAnchorEl(null);

  if (!isArtist) return null;

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
            {artistProfile?.artistAka?.slice(0, 2).toUpperCase() || "A"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">Welcome back, {artistProfile?.artistAka || "artist"}</Typography>
            <Typography variant="caption" color="text.secondary">
              The welcome lounge is open while you browse guest pages.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={handleOpen} aria-label="booking messages">
            <Badge
              badgeContent={bookings.length}
              color="secondary"
              sx={{
                ".MuiBadge-badge": {
                  backgroundColor: highlight ? theme.palette.secondary.main : "white",
                  color: highlight ? "black" : theme.palette.text.primary,
                },
              }}
            >
              <MailOutlineIcon sx={{ color: theme.palette.text.primary }} />
            </Badge>
          </IconButton>
          <IconButton>
            <Badge badgeContent={0} color="secondary">
              <NotificationsRoundedIcon sx={{ color: theme.palette.text.primary }} />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 320, maxHeight: 440, p: 1 } }}
      >
        {loading ? (
          <MenuItem disabled>Loading booking requests…</MenuItem>
        ) : bookings.length ? (
          bookings.map((booking) => (
            <MenuItem
              key={booking._id}
              sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}
            >
              <Typography variant="subtitle2">
                {booking.user?.username || "Someone"} · {booking.eventType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {booking.song?.title || "—"} · {new Date(booking.eventDate).toLocaleDateString()}
              </Typography>
              {booking.message && (
                <Typography variant="caption" color="text.secondary">
                  {booking.message}
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button size="small" variant="contained" onClick={() => handleRespond(booking._id, "ACCEPTED") }>
                  Accept
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleRespond(booking._id, "DECLINED") }>
                  Decline
                </Button>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No pending booking requests</MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default ArtistGuestAppBar;
