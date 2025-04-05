import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

export default function Title({register, errors}) {
  return (
    <>
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

   <Box sx={{ flex: 1, display: "flex", width: '100%', flexDirection: "column" }}>

          <TextField
            {...register("title", { required: "Title is required" })}
            id="title"
            fullWidth
            variant="outlined"
            sx={{
              width: '100%',
              bgcolor: "var(--secondary-background-color)",
              "& .MuiInputBase-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "gray" },
            }}
          />

        
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
      
    </Paper>
    </>
  );
}