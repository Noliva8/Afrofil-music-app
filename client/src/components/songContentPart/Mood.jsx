import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { alpha, useTheme } from '@mui/material/styles';
import { Controller } from "react-hook-form";

const MAIN_MOODS = [
 "Happy",
    "Sad",
    "Romantic",
    "Calm",
    "Energetic",


    "Worship",
    "Praise",
    "Party",
    "Wedding",
    "Workout",
];



const SUB_MOODS = {
  
   Happy: [
  "Joyful",
  "Optimistic",
  "Playful",
  "Celebratory",
],
  

  Sad: [
  "Heartbreak",
  "Lonely",
  "Struggle",
  "Grief",
],
 
Romantic: [
  "Crush",
  "In Love",
  "Intimate",
  "Commitment",
],
  

  Calm: [
  "Peaceful",
  "Reflective",
  "Soothing",
],


Energetic: [
  "Hype",
  "Powerful",
  "Motivational",
  "Aggressive",
],

 Worship: [
  "Devotional",
  "Prayerful",
  "Meditative",
  "Surrender",
],

Praise: [
  "Thanksgiving",
  "Exaltation",
  "Testimony",
],

Party: [
  "Club",
  "Turn Up",
  "Festival",
],

Wedding: [
  "Gusaba",
  "Ceremony",
  "First Dance",
  "Reception",
],

Workout: [
  "Gym",
  "Running",
  "Training",
]

};

export default function Mood({ control, setValue, watch }) {
  const theme = useTheme();
  const selectedMoods = watch("mood") || [];

  const clearRemovedSubMoods = (previousMoods, nextMoods) => {
    if (!setValue) return;

    previousMoods
      .filter((mood) => !nextMoods.includes(mood))
      .forEach((mood) => {
        setValue(`subMoods.${mood}`, []);
      });
  };

  return (
    <Box mb={3}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
          Mood
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          How does your song feel? Pick up to 2.
        </Typography>
      </Box>

      <Controller
        name="mood"
        control={control}
        defaultValue={[]}
        render={({ field: { value, onChange } }) => (
          <Select
            multiple
            fullWidth
            displayEmpty
            value={value || []}
            onChange={(event) => {
              const currentValue = value || [];
              const nextValue = event.target.value;
              const normalizedValue = typeof nextValue === "string"
                ? nextValue.split(",").slice(0, 2)
                : nextValue.slice(0, 2);

              clearRemovedSubMoods(currentValue, normalizedValue);
              onChange(normalizedValue);
            }}
            renderValue={(selected) => {
              if (!selected.length) {
                return (
                  <Typography component="span" sx={{ color: theme.palette.text.secondary }}>
                    Select mood
                  </Typography>
                );
              }

              return (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {selected.map((mood) => (
                    <Chip
                      key={mood}
                      label={mood}
                      size="small"
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      onDelete={() => {
                        const nextValue = selected.filter((selectedMood) => selectedMood !== mood);
                        clearRemovedSubMoods(selected, nextValue);
                        onChange(nextValue);
                      }}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.14),
                        color: theme.palette.text.primary,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.26)}`,
                        "& .MuiChip-deleteIcon": {
                          color: theme.palette.text.secondary,
                          "&:hover": {
                            color: theme.palette.error.main,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              );
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
            sx={{
              minWidth: 220,
              width: "100%",
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              color: theme.palette.text.primary,
              borderRadius: "8px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.primary.main, 0.45),
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            {MAIN_MOODS.map((mood) => (
              <MenuItem
                key={mood}
                value={mood}
                disabled={(value || []).length >= 2 && !(value || []).includes(mood)}
              >
                <Checkbox checked={(value || []).includes(mood)} />
                <ListItemText primary={mood} />
              </MenuItem>
            ))}
          </Select>
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
