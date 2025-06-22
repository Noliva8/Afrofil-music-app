
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export default function Genre({ control,Controller, errors }) {
  const [genres] = useState(["Pop", "Rock", "Jazz", "Hip Hop", "Classical"]);

  return (
    <Box
      mb={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start"
      }}
    >
      <Typography
        htmlFor="genre"
        sx={{
          color: "white",
          fontFamily: "Roboto",
          fontWeight: 500,
          fontSize: "16px",
          letterSpacing: "1px",
          mb: 2
        }}
      >
        Genre
      </Typography>

      <Controller
        name="genre"
        control={control}
        defaultValue=""
        rules={{ required: "Please select a genre" }}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            displayEmpty
            error={!!errors.genre}

 MenuProps={{
    PaperProps: {
      sx: {
        backgroundColor: "var(--secondary-background-color)",
        color: "#ffffff",         
      },
    },
  }}



            
            sx={{
              minWidth: 220,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              fontSize: "16px",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none"
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#ffde00"
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#ffde00"
              }
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{
                color: 'white'
              }}>Select a genre</Typography>
            </MenuItem>
            {genres.map((genre, index) => (
              <MenuItem key={index} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {errors.genre && (
        <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>
          {errors.genre.message}
        </Typography>
      )}
    </Box>
  );
}
