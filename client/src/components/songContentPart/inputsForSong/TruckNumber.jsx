import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";

export default function TruckNumber({ register, errors, setValue }) {
  const handleChange = (e) => {
    const numericValue = e.target.value === "" ? "" : Number(e.target.value);
    setValue("trackNumber", numericValue); 
  };

  return (
     <Paper elevation={3} 
      sx={{
        width: '98%',
        display: "flex",
        backgroundColor: 'var(--secondary-background-color)',
        margin: '0 auto',
        marginTop: '10px',
        padding:'1rem',
         
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
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} 
       sx={{
              width: '100%',
              bgcolor: "var(--secondary-background-color)",
              "& .MuiInputBase-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "gray" },
            }}
        {...register("trackNumber", { valueAsNumber: true })} // Enforce number type
        error={!!errors.trackNumber}
        helperText={errors.trackNumber?.message}
      />
    </Paper>
  );
}