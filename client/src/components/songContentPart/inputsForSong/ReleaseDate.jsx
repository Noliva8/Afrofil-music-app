import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function ReleaseDate({ register, errors }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "center",
            md: "center",
          },
          gap: "10px",
          flexDirection: {
            xs: "row",
            md: "row",
          },
        }}
      >
        <label
          htmlFor="releaseDate"
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
          Release Date
        </label>

        <TextField
          id="releaseDate"
          name="releaseDate"
          type="date"
          fullWidth
          sx={{
            bgcolor: "var(--secondary-background-color)",
            color: "white",
            "& .MuiInputLabel-root": { color: "white" },
            "& .MuiInputBase-root": { color: "white" },
          }}
          {...register("releaseDate", {
            required: "Release date is required",
            validate: {
              notInFuture: (value) => {
                const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
                return value <= today || "Release date cannot be in the future";
              },
            },
          })}
          error={!!errors.releaseDate}
          helperText={errors.releaseDate?.message}
        />
      </Box>
    </>
  );
}
