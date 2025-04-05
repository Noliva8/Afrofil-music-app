import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
export default function Featuring({ register, errors }) {
  const [featuringArtists, setFeaturingArtists] = useState([""]);

  const addFeaturingArtist = () => {
    setFeaturingArtists([...featuringArtists, ""]);
  };

  const deleteFeaturingArtist = (index) => {
    setFeaturingArtists(featuringArtists.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Featuring Artist - Add More and Delete */}
      {featuringArtists.map((_, index) => (
         <Paper key={index} elevation={3} 
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
              htmlFor={`featuringArtist-${index}`} // Unique id
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
              {index === 0 ? "Featured Artist" : `Featuring Artist ${index}`}
            </label>

            <TextField
              fullWidth
              id={`featuringArtist-${index}`}
              name={`featuring[${index}]`} 
              {...register(`featuringArtist[${index}]`)}
              sx={{
                
                width: '100%',
              bgcolor: "var(--secondary-background-color)",
              "& .MuiInputBase-root": { color: "white" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "gray" },
              }}
            />
          

          {/* Add More Button */}

          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: "var(--secondary-background-color)",
                fontSize: { xs: "12px", md: "14px" },
                color: "white",
                "&:hover": { bgcolor: "gray" },
              }}
              onClick={addFeaturingArtist}
            >
              Add More
            </Button>

            {/* Delete Button */}
            {index > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => deleteFeaturingArtist(index)}
                sx={{
                  "&:hover": { bgcolor: "red", color: "white" },
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Paper>
      ))}
    </>
  );
}
