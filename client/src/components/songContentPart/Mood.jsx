import React from "react";
import {
  Box,
  Typography,
  Chip,
  Autocomplete,
  TextField,
  Stack,
} from "@mui/material";
import { Controller } from "react-hook-form";

const MAIN_MOODS = [
  "Party",
  "Chill",
  "Love",
  "Focus",
  "Workout",
  "Spiritual",
  "Street",
  "Sad",
  "Happy",
  "Late Night",
];

const SUB_MOODS = {
  Party: ["Turn Up", "Club", "Dance", "Festival", "Wedding", "Carnival", "Hype"],
  Chill: ["Smooth", "Laid Back", "Relaxing", "Easy Listening", "Acoustic", "Sunday Chill"],
  Love: ["Romantic", "Heartfelt", "Valentine", "Intimate", "Crush", "Breakup"],
  Focus: ["Study", "Work", "Concentration", "Background", "Instrumental", "Creative"],
  Workout: ["Gym", "Run", "Cardio", "High Energy", "Motivation"],
  Spiritual: ["Worship", "Praise", "Prayer", "Meditation", "Inspirational"],
  Street: ["Hustle", "Street Vibes", "Trap", "Drill", "Underground"],
  Sad: ["Emotional", "Heartbreak", "Lonely", "Reflective", "Melancholy"],
  Happy: ["Feel Good", "Positive", "Uplifting", "Joyful", "Celebration"],
  "Late Night": ["After Hours", "Midnight Drive", "Moody", "Low Key", "Smooth R&B"],
};

export default function Mood({ control, watch }) {
  const selectedMoods = watch("mood") || [];

  return (
    <Box mb={3}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Mood
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          How does your song feel? Pick up to 2.
        </Typography>
      </Box>

      <Controller
        name="mood"
        control={control}
        defaultValue={[]}
        render={({ field: { value, onChange } }) => (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            {MAIN_MOODS.map((mood) => {
              const selected = value.includes(mood);
              return (
                <Chip
                  key={mood}
                  label={mood}
                  clickable
                  color={selected ? "primary" : "default"}
                  onClick={() => {
                    const updated = selected
                      ? value.filter((m) => m !== mood)
                      : [...value, mood].slice(0, 2); // Max 2 moods
                    onChange(updated);
                  }}
                  disabled={value.length >= 2 && !selected}
                  sx={{
                    fontSize: "0.875rem",
                    px: 1,
                    py: 0.5,
                    borderColor: selected ? "primary.main" : "rgba(255,255,255,0.2)",
                    color: selected ? "primary.contrastText" : "white",
                    backgroundColor: selected ? "primary.main" : "rgba(255,255,255,0.06)",
                    "&:hover": {
                      backgroundColor: selected ? "primary.dark" : "rgba(255,255,255,0.12)",
                    },
                  }}
                />
              );
            })}
          </Stack>
        )}
      />

      {/* Per-Mood SubMood Inputs */}
      {selectedMoods.map((mood) => (
        <Box key={mood} mt={3}>
          <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.8)", mb: 1 }}>
            {mood} sub-moods
          </Typography>
          <Controller
            name={`subMoods.${mood}`}
            control={control}
            defaultValue={[]}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                multiple
                freeSolo
                options={SUB_MOODS[mood] || []}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Select or type for ${mood}`}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderRadius: 1,
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255,255,255,0.4)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "white",
                      },
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    const { key: tagKey, ...rest } = tagProps || {};
                    return (
                      <Chip
                        key={tagKey ?? `${option}-${index}`}
                        label={option}
                        size="small"
                        {...rest}
                        sx={{
                          mr: 0.5,
                          backgroundColor: "rgba(255,255,255,0.12)",
                          color: "white",
                        }}
                      />
                    );
                  })
                }
              />
            )}
          />
        </Box>
      ))}
    </Box>
  );
}
