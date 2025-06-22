import { useState } from "react";
import { 
  Box, 
  TextField, 
  Paper, 
  Typography,
  IconButton,
  InputAdornment,
  useTheme
} from "@mui/material";
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";

export default function Producer({ register, errors }) {
  const theme = useTheme();
  const [producers, setProducers] = useState([{ name: "", role: "" }]);

  const addProducer = () => {
    setProducers([...producers, { name: "", role: "" }]);
  };

  const deleteProducer = (index) => {
    if (producers.length > 1) {
      setProducers(producers.filter((_, i) => i !== index));
    }
  };

  const handleProducerChange = (index, field, value) => {
    const updatedProducers = [...producers];
    updatedProducers[index][field] = value;
    setProducers(updatedProducers);
  };

 return (

  <Box
     mb={2}
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "start",
      
    }}
  >


    <Typography
      variant="body1"
      sx={{
        color: "#ffffff",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      Producers
    </Typography>

  {producers.map((producer, index) => (

  <Box
    key={index}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      width: "100%",
      mb: 2,
      flexDirection: { xs: "column", sm: "row" }, // Responsive layout
    }}
  >
    <TextField
      fullWidth
      placeholder="Who produced this song ?"
  
      margin="normal"
      variant="outlined"
      {...register(`producer[${index}].name`, {
        required: "Name is required",
      })}
      value={producer.name}
      onChange={(e) => handleProducerChange(index, "name", e.target.value)}
      error={Boolean(errors?.producer?.[index]?.name)}
      helperText={errors?.producer?.[index]?.name?.message}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#ffffff",
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&:hover fieldset": {
            borderColor: "#ffde00",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#ffde00",
          },
        },
        "& .MuiInputLabel-root": {
          color: "rgba(255, 255, 255, 0.7)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#ffde00",
        },
      }}
    />

<TextField
  fullWidth
  placeholder="What is their role?"
  margin="normal"
  variant="outlined"
  {...register(`producer[${index}].role`)}
  value={producer.role}
  onChange={(e) => handleProducerChange(index, "role", e.target.value)}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={index === 0 ? addProducer : () => deleteProducer(index)}
          edge="end"
          aria-label={index === 0 ? "add producer" : "delete producer"}
          sx={{
            color: index === 0 ? "white" : "error.main",
            "&:hover": {
              backgroundColor:
                index === 0
                  ? theme.palette.primary.light
                  : theme.palette.error.light,
              transform: "scale(1.1)",
            },
          }}
        >
          {index === 0 ? (
            <AddCircleOutline fontSize="small" />
          ) : (
            <DeleteOutline fontSize="small" />
          )}
        </IconButton>
      </InputAdornment>
    ),
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
      "&:hover fieldset": {
        borderColor: "#ffde00",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#ffde00",
      },
    },
  }}
/>


  </Box>
))}

  </Box>
);

}