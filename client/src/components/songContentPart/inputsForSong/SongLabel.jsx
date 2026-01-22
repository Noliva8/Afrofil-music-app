import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";

export default function SongLabel({ register, errors }) {
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
        Record Label
      </Typography>

      <TextField
        fullWidth
        placeholder="Enter your record label name"
        name="label"
        margin="normal"
        variant="outlined"

        {...register("label")}
        error={!!errors.label}
        helperText={errors.label?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <RecordVoiceOverIcon color="primary" />
            </InputAdornment>
          ),
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
      />
    </Box>
  );
}
