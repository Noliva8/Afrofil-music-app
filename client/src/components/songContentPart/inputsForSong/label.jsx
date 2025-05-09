import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

import TextField from "@mui/material/TextField";

export default function Label(register, errors) {
  return (
    <>
  <Paper
      sx={{
        width: "98%",
        display: "flex",
        backgroundColor: "var(--secondary-background-color)",
        margin: "0 auto",
        marginTop: "10px",
        padding: "1rem",
        alignItems: { xs: "start", md: "center" },
        gap: "10px",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <label
        htmlFor="label"
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
        Label
      </label>

      <TextField
        fullWidth
        id="label"
        name="label" 
        {...register}
       sx={{
              width: '100%',
              bgcolor: "var(--secondary-background-color)",
              "& .MuiInputBase-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "gray" },
            }}
      />
    </Paper>
    </>
  );
}
