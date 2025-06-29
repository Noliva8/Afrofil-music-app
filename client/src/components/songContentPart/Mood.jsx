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

// Mood and SubMood Options
const moodOptions = [
  "Party",
  "Chill",
  "Gospel",
  "Heartbreak",
  "Traditional",
  "Romantic",
  "Motivational",
  "Cultural",
];

const subMoodMap = {
  Gospel: ["Worship", "Praise", "Traditional Gospel"],
  Party: ["Amapiano", "Afrobeats", "Street Hop"],
  Chill: ["Lo-fi", "Acoustic"],
  Heartbreak: ["Breakup", "Lonely"],
  Traditional: ["Highlife", "Cultural Dance"],
  Romantic: ["Love Ballad", "Slow Jam"],
  Motivational: ["Uplifting", "Empowerment"],
  Cultural: ["Folklore", "Tribal Rhythms"],
};

export default function Mood({ control, watch }) {
  const selectedMoods = watch("mood") || [];

  return (
    <Box mb={3}>
      {/* Mood Selection */}
      <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
        How does your song feel? (Pick 1–2)
      </Typography>

      <Controller
        name="mood"
        control={control}
        defaultValue={[]}
        render={({ field: { value, onChange } }) => (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {moodOptions.map((mood) => {
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
                  sx={{ fontSize: "0.875rem", px: 1, py: 0.5 }}
                />
              );
            })}
          </Stack>
        )}
      />

      {/* Per-Mood SubMood Inputs */}
      {selectedMoods.map((mood) => (
        <Box key={mood} mt={3}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
            {mood} Sub-Moods
          </Typography>
          <Controller
            name={`subMoods.${mood}`}
            control={control}
            defaultValue={[]}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                multiple
                freeSolo
                options={subMoodMap[mood] || []}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Select or type for ${mood}`}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "background.paper",
                        borderRadius: 1,
                      },
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{ mr: 0.5 }}
                    />
                  ))
                }
              />
            )}
          />
        </Box>
      ))}
    </Box>
  );
}
