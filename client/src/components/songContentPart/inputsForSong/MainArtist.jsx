import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function MainArtist({ register, errors }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "center", md: "center" },
          gap: "10px",
          flexDirection: { xs: "row", md: "row" },
        }}
      >
        {/* Label */}
        <label
          htmlFor="mainArtist"
          style={{
            color: "white",
            minWidth: "150px",
            textWrap: "nowrap",
            fontFamily: "roboto",
            fontWeight: "500",
            textShadow: "revert-layer",
            fontSize: "18px",
            letterSpacing: "2px",
          }}
        >
          Main Artist
        </label>

        {/* Input & Error Message */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <TextField
            fullWidth
            id="mainArtist"
            name="mainArtist"
            {...register('mainArtist', { required: "Artist is required" })}
            sx={{
              bgcolor: "var(--secondary-background-color)",
              color: "white",
              "& .MuiInputLabel-root": { color: "white" },
              "& .MuiInputBase-root": { color: "white" },
            }}
          />

          {/* Error Message */}
          {errors.mainArtist && (
            <Typography
              variant="body2"
              color="error"
              sx={{
                fontStyle: "italic",
                mt: "5px", // Adds spacing below the input
              }}
            >
              {errors.mainArtist.message}
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
}
