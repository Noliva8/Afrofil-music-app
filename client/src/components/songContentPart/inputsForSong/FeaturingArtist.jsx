import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

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
        <Stack key={index} direction="row" spacing={5} alignItems="center">
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
            >{index === 0 ? "Featuring" : `Featuring ${index}`}</label>

            <TextField
              fullWidth
              id={`featuringArtist-${index}`}
              name={`featuring[${index}]`} // Dynamically set the name for each input
              {...register(`featuringArtist[${index}]`)}
              sx={{
                bgcolor: "var(--secondary-background-color)",
                color: "white",
                "& .MuiInputLabel-root": { color: "white" },
                "& .MuiInputBase-root": { color: "white" },
              }}
            />
          </Box>

          {/* Add More Button */}

             <Box sx={{display:'flex', flexDirection: 'column', gap: '10px'}}>
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
        </Stack>
      ))}
    </>
  );
}