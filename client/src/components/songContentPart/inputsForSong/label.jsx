import Box from "@mui/material/Box";

import TextField from "@mui/material/TextField";

export default function Label() {
  return (
    <>
    <Box
      sx={{
        display: "flex",
        alignItems: {
          xs: "start",
          md: "center",
        },
        gap: "10px",
        flexDirection: {
          xs: "column",
          md: "row",
        },
      }}
    >
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
          textSpacing: "2px",
        }}
      >
        Main Artist
      </label>

      <TextField
        fullWidth
        id="mainArtist"
        name="mainArtist" // Fixed syntax here
        sx={{
          bgcolor: "var(--secondary-background-color)",
          color: "white",
          "& .MuiInputLabel-root": { color: "white" },
          "& .MuiInputBase-root": { color: "white" },
        }}
      />
    </Box>
    </>
  );
}
