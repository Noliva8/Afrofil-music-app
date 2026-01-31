import React from "react";
import { Menu, MenuItem, Typography, Divider } from "@mui/material";

export default function UserNotifications({
  anchorEl,
  open,
  onClose,
  loading,
  notifications = [],
  onSelect,
}) {
  const notificationMenuId = "user-notification-menu";

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      id={notificationMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { mt: 1, minWidth: 240 },
      }}
    >
      {loading ? (
        <MenuItem disabled>Loading responses…</MenuItem>
      ) : notifications.length ? (
        notifications.map((notification) => {
          const isBooking = notification.kind === "BOOKING";
          const title = isBooking
            ? notification.type === "PENDING"
              ? "Your booking request is pending"
              : notification.type === "ACCEPTED"
                ? "Artist accepted your booking"
                : "Artist declined your booking"
            : "New message from the artist";
          const subtitle = isBooking
            ? `${notification.booking?.eventType || "Booking"} · ${
                notification.booking?.location?.city ||
                notification.booking?.location?.country ||
                "Location"
              }`
            : notification.message || "Message received";

          return (
            <MenuItem
              key={notification._id}
              onClick={() => onSelect(notification)}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                alignItems: "flex-start",
              }}
            >
              <Typography variant="subtitle2">{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
              {notification.message && (
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              )}
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>No new replies</MenuItem>
      )}
    </Menu>
  );
}
