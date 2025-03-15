import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useState } from "react";

export default function Genre({ register, errors }) {
  const [genres] = useState(["Pop", "Rock", "Jazz", "Hip Hop", "Classical"]);

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
        <label
          htmlFor="genre"
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
          Genre
        </label>

        <TextField
          id="genre"
          name="genre" 
          select
          defaultValue=""
          fullWidth
          sx={{
            bgcolor: "var(--secondary-background-color)",
            color: "white",
            "& .MuiInputLabel-root": { color: "white" },
            "& .MuiInputBase-root": { color: "white" },
          }}
          {...register("genre", { required: "Genre is required" })}
          error={!!errors.genre}
          helperText={errors.genre?.message}
        >
          {genres.map((genre, index) => (
            <MenuItem key={index} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}