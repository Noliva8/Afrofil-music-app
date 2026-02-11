import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TextField from "@mui/material/TextField";

const textFieldStyles = {
  bgcolor: "var(--secondary-background-color)",
  "& .MuiInputLabel-root": { color: "white !important" },
  "& .MuiInputBase-root": { color: "white !important" },
  "& .MuiInputBase-input": {
    color: "white !important",
    "&::placeholder": {
      color: "rgba(255,255,255,0.75)",
    },
  },
};

export default function ReleaseDatePicker({ value, onChange, error, helperText }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        id="releaseDate"
        name="releaseDate"
        value={value || null}
        onChange={onChange}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            error={!!error}
            helperText={helperText}
            sx={textFieldStyles}
          />
        )}
      />
    </LocalizationProvider>
  );
}
