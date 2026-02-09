import IconButton from "@mui/material/IconButton";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Typography from "@mui/material/Typography";
export const BookingArtistButton = ({
  artistId,
  artistName,
  songId,
  onClick,
  disabled = false,
}) => {
  const handleClick = (event) => {
    event.stopPropagation();
    if (disabled) return;
    if (typeof onClick === "function") {
      onClick({ artistId, artistName, songId });
      return;
    }
  };

  return (
    <IconButton
      onClick={handleClick}
      aria-label="Book artist"
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
      <CalendarMonthIcon sx={{ fontSize: 18 }} />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Book
      </Typography>
    </IconButton>
  );
};

export default BookingArtistButton;
