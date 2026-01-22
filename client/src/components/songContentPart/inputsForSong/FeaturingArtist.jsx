import { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import { Group as GroupIcon, AddCircleOutline, DeleteOutline } from "@mui/icons-material";

export default function FeaturingArtist({ register, errors, watch, setValue }) {
  const theme = useTheme();
  const [featuringArtists, setFeaturingArtists] = useState([""]);

  const watchedArtists = watch("featuringArtist");
  useEffect(() => {
    if (Array.isArray(watchedArtists) && watchedArtists.length > 0) {
      setFeaturingArtists(watchedArtists);
    }
  }, [watchedArtists]);

  const addFeaturingArtist = () => {
    const updated = [...featuringArtists, ""];
    setFeaturingArtists(updated);
    setValue("featuringArtist", updated);
  };

  const deleteFeaturingArtist = (index) => {
    if (featuringArtists.length > 1) {
      const updated = featuringArtists.filter((_, i) => i !== index);
      setFeaturingArtists(updated);
      setValue("featuringArtist", updated);
    }
  };

  const handleArtistChange = (index, value) => {
    const updated = [...featuringArtists];
    updated[index] = value;
    setFeaturingArtists(updated);
    setValue("featuringArtist", updated);
  };

  return (
    <Box mb={2} sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 500, mb: 0.5 }}>
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
                  <IconButton
                    onClick={index === 0 ? addFeaturingArtist : () => deleteFeaturingArtist(index)}
                    edge="end"
                    aria-label={index === 0 ? "add artist" : "delete artist"}
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
                      <AddCircleOutline fontSize="medium" />
                    ) : (
                      <DeleteOutline fontSize="medium" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register(`featuringArtist.${index}`)}
            value={artist}
            onChange={(e) => handleArtistChange(index, e.target.value)}
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
