import { useState } from "react";
import { 
  Box, 
  TextField, 
  InputAdornment,
  Paper, 
  Typography,
  IconButton,
  Stack,
  useTheme
} from "@mui/material";
import {
  Group as GroupIcon,
  People as PeopleIcon,
  Album as AlbumIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Label,
} from "@mui/icons-material";
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";

export default function FeaturingArtist({ register, errors }) {
  const theme = useTheme();
  const [featuringArtists, setFeaturingArtists] = useState([""]);

  const addFeaturingArtist = () => {
    setFeaturingArtists([...featuringArtists, ""]);
  };

  const deleteFeaturingArtist = (index) => {
    setFeaturingArtists(featuringArtists.filter((_, i) => i !== index));
  };

  const handleArtistChange = (index, value) => {
    const updatedArtists = [...featuringArtists];
    updatedArtists[index] = value;
    setFeaturingArtists(updatedArtists);
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
      Featured Artists
    </Typography>

    {featuringArtists.map((artist, index) => (
      <Box
        key={index}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          width: "100%",
        }}
      >
        <TextField
          fullWidth
          placeholder="Enter featured artist name if any"
          margin="normal"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <GroupIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {index === 0 ? (
                  <IconButton
                    onClick={addFeaturingArtist}
                    edge="end"
                    aria-label="add artist"
                    sx={{
                      color: "white",
                      "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <AddCircleOutline fontSize="medium" />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() => deleteFeaturingArtist(index)}
                    edge="end"
                    color="error"
                    aria-label="delete artist"
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.error.light,
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <DeleteOutline fontSize="medium" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          {...register(`featuringArtist[${index}]`)}
          value={artist}
          onChange={(e) => handleArtistChange(index, e.target.value)}
          error={Boolean(errors?.featuringArtists?.[index])}
          helperText={errors?.featuringArtists?.[index]?.message}
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
      </Box>
    ))}
  </Box>
);

}