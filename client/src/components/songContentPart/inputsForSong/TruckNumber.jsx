import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function TrackNumber({ register, errors, setValue, control }) {
  const theme = useTheme();

  const handleChange = (e) => {
    const value = e.target.value;
    // Allow empty string or positive integers
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      setValue("trackNumber", value === "" ? "" : Number(value));
    }
  };

  return (

    <Box
    mb={2}
      sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "start",
      
    }}
    >
    
        <Typography
         variant="body1"
      sx={{
        color: "#ffffff",
        fontWeight: 500,
        mb: 0.5,
      }}
        >
          Track Number
        </Typography>
   

      <TextField
        id="trackNumber"
         placeholder="truck number"
         fullWidth
        name="trackNumber"
        type="number" // Changed to text to handle input more gracefully
        margin="normal"
      variant="outlined"
        onChange={handleChange}

        inputProps={{
          inputMode: "numeric",
          pattern: "[1-9][0-9]*", // Only positive integers
          min: 1,
        }}
        InputProps={{
          startAdornment: (
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                mr: 1,
               
              }}
            >
              #
            </Typography>
          ),
          sx: {
            borderRadius: "8px",
            backgroundColor: theme.palette.background.default,
          },
        }}

         sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#ffffff",
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&:hover fieldset": {
            borderColor: "#ffde00",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#ffde00",
          },
        },
        "& .MuiInputLabel-root": {
          color: "rgba(255, 255, 255, 0.7)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#ffde00",
        },
      }}

        {...register("trackNumber", {
          validate: (value) =>
            value === "" ||
            (Number.isInteger(Number(value)) && Number(value) > 0) ||
            "Please enter a valid track number",
        })}
        error={!!errors.trackNumber}
        helperText={errors.trackNumber?.message}
      />

      <Typography
        variant="caption"
        sx={{
          color: 'var(--primary-font-color)',
          fontStyle: 'italic',
          ml: { md: 2 },
          alignSelf: { xs: "flex-start", md: "center" },
        }}
      >
        Optional - defaults to 1
      </Typography>
    </Box>
  );
}