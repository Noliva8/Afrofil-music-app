import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function ArtistBookingNotifications({
  anchorEl,
  onClose,
  loading,
  pendingBookings = [],
  handleRespond,
  detailBookingId,
  setDetailBookingId,
}) {

  console.log('see bookings:', pendingBookings)
  const toggleDetailFor = (bookingId) => {
    setDetailBookingId((prev) => (prev === bookingId ? null : bookingId));
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{ sx: { width: 360, maxHeight: 440, p: 1 } }}
    >
      {loading ? (
        <MenuItem disabled>Loading booking requests…</MenuItem>
      ) : pendingBookings.length ? (
        pendingBookings.map((booking) => (
          <MenuItem
            key={booking._id}
            disableRipple
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.5,
              mb: 0.5,
            }}
          >
       <Typography variant="subtitle2" sx={{ lineHeight: 1.5, wordBreak: "break-word" }}>
  You've received a booking request!
  <br />
  Someone wants to book you for a <strong>{booking.eventType}</strong>
  <br />
  at <strong>{booking.location?.venue}</strong> 
     <strong> {booking.location?.city}</strong>
     <strong> {booking.location?.country
}</strong>
  <br />
  on <strong>{new Date(booking.eventDate).toLocaleDateString()}</strong>
</Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="contained" onClick={() => handleRespond(booking._id, 'ACCEPTED')}>
              Accept
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleRespond(booking._id, 'DECLINED')}>
              Decline
            </Button>
          </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, lineHeight: 1.4 }}
            >
              You won’t be able to chat with them until you accept or decline.
            </Typography>
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>You're all caught up. No new booking requests.</MenuItem>
      )}
    </Menu>
  );
}
