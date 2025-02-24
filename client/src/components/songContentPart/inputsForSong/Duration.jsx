import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function DurationInput({ register, errors, setValue }) {
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  const handleMinutesChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    setMinutes(value);
    updateDuration(value, seconds);
  };

  const handleSecondsChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Only allow numbers
    if (parseInt(value) > 59) return; // Ensure seconds <= 59
    setSeconds(value);
    updateDuration(minutes, value);
  };

  const updateDuration = (min, sec) => {
    const totalSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
    setValue("duration", totalSeconds); // Store total seconds in form state
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexDirection: { xs: "row", md: "row" },
      }}
    >
      <label
        style={{
          color: "white",
          minWidth: "150px",
          fontFamily: "roboto",
          fontWeight: "500",
          fontSize: "18px",
        }}
      >
        Duration 
      </label>

      <TextField
        label="Min"
        type="text"
        value={minutes}
        onChange={handleMinutesChange}
        sx={{
          bgcolor: "var(--secondary-background-color)",
          color: "white",
          "& .MuiInputLabel-root": { color: "white" },
          "& .MuiInputBase-root": { color: "white" },
        }}
        error={!!errors.duration}
      />

      <TextField
        label="Seconds"
        type="text"
        value={seconds}
        onChange={handleSecondsChange}
        sx={{
          bgcolor: "var(--secondary-background-color)",
          color: "white",
          "& .MuiInputLabel-root": { color: "white" },
          "& .MuiInputBase-root": { color: "white" },
        }}
        error={!!errors.duration}
        
      />
    </Box>
  );
}
