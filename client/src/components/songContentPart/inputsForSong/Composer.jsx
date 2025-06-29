import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";

export default function Composer({ register, errors, watch, setValue }) {
  const theme = useTheme();

  const [composers, setComposers] = useState([{ name: "", contribution: "" }]);
  const watchedComposers = watch("composer");

  useEffect(() => {
    if (Array.isArray(watchedComposers) && watchedComposers.length > 0) {
      setComposers(watchedComposers);
    }
  }, [watchedComposers]);

  const addComposer = () => {
    const updated = [...composers, { name: "", contribution: "" }];
    setComposers(updated);
    setValue("composer", updated);
  };

  const deleteComposer = (index) => {
    if (composers.length > 1) {
      const updated = composers.filter((_, i) => i !== index);
      setComposers(updated);
      setValue("composer", updated);
    }
  };

  const handleComposerChange = (index, field, value) => {
    const updated = [...composers];
    updated[index][field] = value;
    setComposers(updated);
    setValue("composer", updated);
  };

  return (
    <Box mb={2} sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 500, mb: 0.5 }}>
        Composers
      </Typography>

      {composers.map((composer, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            width: "100%",
            mb: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            fullWidth
            placeholder="Who composed this song ?"
            margin="normal"
            variant="outlined"
            {...register(`composer.${index}.name`, {
              required: "Composer name is required",
            })}
            value={composer.name}
            onChange={(e) => handleComposerChange(index, "name", e.target.value)}
            error={Boolean(errors?.composer?.[index]?.name)}
            helperText={errors?.composer?.[index]?.name?.message}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#ffffff",
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "#ffde00" },
                "&.Mui-focused fieldset": { borderColor: "#ffde00" },
              },
            }}
          />

          <TextField
            fullWidth
            placeholder="Contribution (Optional)"
            margin="normal"
            variant="outlined"
            {...register(`composer.${index}.contribution`)}
            value={composer.contribution}
            onChange={(e) => handleComposerChange(index, "contribution", e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={index === 0 ? addComposer : () => deleteComposer(index)}
                    edge="end"
                    aria-label={index === 0 ? "add composer" : "delete composer"}
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
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "#ffde00" },
                "&.Mui-focused fieldset": { borderColor: "#ffde00" },
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
