
import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";







export default function Composer({register, errors}) {

 const [composers, setComposers] = useState([""]);


const addComposer = () => {
    setComposers([...composers, ""]);
  };

  const deleteComposer = (index) => {
    setComposers(composers.filter((_, i) => i !== index));
  };





  return (
    <>
  {/* Featuring Artist - Add More and Delete */}
      {composers.map((_, index) => (
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
              htmlFor={`composer-${index}`} 
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
            > {index === 0 ? "Composer" : `Composer ${index}`}</label>

            <TextField
              fullWidth
              id={`composer-${index}`}
              name={`composer[${index}]`} 
              {...register(`composer[${index}]`)}
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
            onClick={addComposer}
          >
            Add composer
          </Button>

          {/* Delete Button */}
          {index > 0 && (
           
              <Button
                variant="outlined"
                color="error"
                onClick={() => deleteComposer(index)}
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
