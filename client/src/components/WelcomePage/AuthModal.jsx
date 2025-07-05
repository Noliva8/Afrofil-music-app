import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Typography
} from "@mui/material";
import { useOutletContext } from "react-router-dom";






export default function AuthModal({
  open,
  onClose,
  
  currentSong
}) {
    const outletContext = useOutletContext() || {};
const { onSwitchToLogin, onSwitchToSignup, isUserLoggedIn } = outletContext;



  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Continue Listening</DialogTitle>
      <DialogContent>
        <img
          src={currentSong?.artworkUrl || currentSong?.cover || 'https://via.placeholder.com/150x150?text=No+Cover'}
          alt={currentSong?.title}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            marginBottom: 12,
            objectFit: 'cover',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150x150?text=No+Cover';
          }}
        />

        <Typography variant="h6" align="center" sx={{ mb: 1 }}>
          {currentSong?.title || 'Preview Track'}
        </Typography>

        <Typography variant="body1" align="center">
          Create an account or sign in to enjoy the full track!
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          onClick={() => {
    onClose();                // ✅ Close modal
    onSwitchToLogin();        // ✅ Trigger form
  }}
        >
          Log In
        </Button>
        <Button
           onClick={() => {
    onClose();
    onSwitchToSignup();
  }}
        >
          Sign Up
        </Button>
      </DialogActions>
    </Dialog>
  );
}
