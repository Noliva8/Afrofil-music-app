import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

const CATEGORY_OPTIONS = [
  { value: "SECULAR", label: "Secular" },
  { value: "RELIGIOUS", label: "Religious" },
  { value: "INSTRUMENTAL", label: "Instrumental" },
];

const SPEED_OPTIONS = [
  { value: "SLOW", label: "Slow" },
  { value: "MEDIUM", label: "Medium" },
  { value: "FAST", label: "Fast" },
];

function MetadataSelect({ Controller, control, errors, name, label, placeholder, options }) {
  const theme = useTheme();

  return (
    <Box
      mb={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 500,
          mb: 2,
        }}
      >
        {label}
      </Typography>

      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            displayEmpty
            error={!!errors?.[name]}
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
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {errors?.[name] && (
        <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>
          {errors[name].message}
        </Typography>
      )}
    </Box>
  );
}

export default function SongCategorySpeed({ Controller, control, errors }) {
  return (
    <>
      <MetadataSelect
        Controller={Controller}
        control={control}
        errors={errors}
        name="songCategory"
        label="Song Category"
        placeholder="Select a category"
        options={CATEGORY_OPTIONS}
      />
      <MetadataSelect
        Controller={Controller}
        control={control}
        errors={errors}
        name="speed"
        label="Speed"
        placeholder="Select speed"
        options={SPEED_OPTIONS}
      />
    </>
  );
}
