import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function ReleaseDate({ register, errors }) {
  return (
    <Box
      mb={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
       
      }}
    >
      <label
        htmlFor="releaseDate"
        style={{
          color: "white",
          fontFamily: "Roboto, sans-serif",
          fontWeight: 500,
          fontSize: "16px",
          letterSpacing: "2px",
          marginBottom: "10px",
          width: "100%",
          whiteSpace: "nowrap",

        }}
      >
        Release Date
      </label>

      <TextField
        id="releaseDate"
        name="releaseDate"
        margin="normal"
        type="date"
        fullWidth
        {...register("releaseDate", {
          required: "Release date is required",
          validate: {
            notInFuture: (value) => {
              const today = new Date().toISOString().split("T")[0];
              return value <= today || "Release date cannot be in the future";
            },
          },
        })}
        error={!!errors.releaseDate}
        helperText={errors.releaseDate?.message}
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#ffffff",
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
          "& .MuiInputBase-input": {
            color: "#ffffff",
          },
        }}
      />
    </Box>
  );
}
