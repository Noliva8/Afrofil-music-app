import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";


export default function Producer({register, errors}) {
  const [producers, setProducers] = useState([""]);

  const addProducer = () => {
    setProducers([...producers, ""]);
  };

  const deleteProducer = (index) => {
    setProducers(producers.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Producer - Add More and Delete */}
      {producers.map((_, index) => (
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
        htmlFor={`producer-${index}`} 
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
      > {index === 0 ? "Producer" : `Producer ${index}`} </label>

        <TextField 
            fullWidth
            name={`producer-${index}`} 
            id={`producer[${index}]`} 
            {...register(`producer[${index}]`)}
            sx={{
              bgcolor: "var(--secondary-background-color)",
              color: "white",
              "& .MuiInputLabel-root": { color: "white" },
              "& .MuiInputBase-root": { color: "white" },
            }}
          />


    </Box>
    
    <Box sx={{display:'flex', flexDirection: 'column', gap: '10px'}}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "var(--secondary-background-color)",
              color: "white",
               textAlign: 'center', textWrap: 'nowrap',
              "&:hover": { bgcolor: "gray" },
            }}
            onClick={addProducer}
          >
            Add Producer
          </Button>
          {index > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => deleteProducer(index)}
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