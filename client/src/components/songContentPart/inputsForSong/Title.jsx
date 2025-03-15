import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import TextField from "@mui/material/TextField";

export default function Title({register, errors}) {
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
        htmlFor="title"
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
        Title of the song:
      </label>

   <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>

          <TextField
            {...register("title", { required: "Title is required" })}
            id="title"
            fullWidth
            variant="outlined"
            sx={{
              bgcolor: "var(--secondary-background-color)",
              "& .MuiInputBase-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "gray" },
            }}
          />

          {/* Error Message (Always Below Input) */}
          {errors.title && (
            <Typography
              variant="body2"
              color="error"
              sx={{
                
                fontStyle: "italic",
                mt: "5px", // Adds spacing below the input
              }}
            >
              {errors.title.message}
            </Typography>
          )}
        </Box>
      
    </Box>
    </>
  );
}