import { useState } from "react";
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  Divider
} from "@mui/material";
import { AddCircleOutline, Delete } from "@mui/icons-material";

export default function Composer({ register, errors }) {
  const theme = useTheme();
  const [composers, setComposers] = useState([{ name: "", contribution: "" }]);

  const addComposer = () => {
    setComposers([...composers, { name: "", contribution: "" }]);
  };

  const deleteComposer = (index) => {
    if (composers.length > 1) {
      setComposers(composers.filter((_, i) => i !== index));
    }
  };

  const handleComposerChange = (index, field, value) => {
    const updatedComposers = [...composers];
    updatedComposers[index][field] = value;
    setComposers(updatedComposers);
  };

  return (

   <Box sx={{ width: '100%' }}>
    {composers.map((composer, index) => (
      <Box
        mb={2}
        key={index}

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
            {index === 0 ? 'Primary Composer' : `Additional Composer`}
          </Typography>



        <Box spacing={2}
         sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: 'center',
      gap: 2,
      width: "100%",
      mb: 2,
      flexDirection: { xs: "column", sm: "row" }, // Responsive layout
    }}
        
        >

          <TextField
            fullWidth
            margin="normal"
            placeholder="Who composed the song ?"
            variant="outlined"
            {...register(`composer[${index}].name`, {
              required: 'Composer name is required',
            })}
            value={composer.name}
            onChange={(e) =>
              handleComposerChange(index, 'name', e.target.value)
            }
            error={Boolean(errors?.composer?.[index]?.name)}
            helperText={errors?.composer?.[index]?.name?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#ffde00',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffde00',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#ffde00',
              },
            }}
          />

         <TextField
  fullWidth
  placeholder="Contribution (Optional)"
  variant="outlined"
  {...register(`composer[${index}].contribution`)}
  value={composer.contribution}
  onChange={(e) =>
    handleComposerChange(index, 'contribution', e.target.value)
  }
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        {index === 0 ? (
          <IconButton
            onClick={addComposer}
            edge="end"

            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.primary.light,
                transform: 'scale(1.1)',
              },
            }}

          >
            <AddCircleOutline fontSize="small"/>
          </IconButton>
        ) : (
          <IconButton
            onClick={() => deleteComposer(index)}
            edge="end"
            color="error"
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.error.light,
              },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
      </InputAdornment>
    ),
  }}
  sx={{
    
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: '#ffde00',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ffde00',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#ffde00',
    },
  }}
/>

        </Box>
      </Box>
    ))}
  </Box>
  );
}