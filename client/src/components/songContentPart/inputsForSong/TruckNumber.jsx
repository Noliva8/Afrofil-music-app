import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function TruckNumber({ register, errors, setValue }) {
  const handleChange = (e) => {
    const numericValue = e.target.value === "" ? "" : Number(e.target.value);
    setValue("trackNumber", numericValue); 
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "center", md: "center" },
        gap: "10px",
        flexDirection: { xs: "row", md: "row" },
      }}
    >
      <label
        htmlFor="trackNumber"
        style={{
          color: "white",
          minWidth: "150px",
          textWrap: "nowrap",
          fontFamily: "roboto",
          fontWeight: "500",
          fontSize: "18px",
        }}
      >
        Track Number
      </label>

      <TextField
        id="trackNumber"
        name="trackNumber"
        type="number"
        fullWidth
        onChange={handleChange} // Handle number conversion
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} // Ensure numeric input
        sx={{
          bgcolor: "var(--secondary-background-color)",
          color: "white",
          "& .MuiInputLabel-root": { color: "white" },
          "& .MuiInputBase-root": { color: "white" },
        }}
        {...register("trackNumber", { valueAsNumber: true })} // Enforce number type
        error={!!errors.trackNumber}
        helperText={errors.trackNumber?.message}
      />
    </Box>
  );
}
