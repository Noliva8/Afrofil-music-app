
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

const MAIN_GENRES = [
  "Afrobeats",
  "Amapiano",
  "Afro Pop",
  "Afro-Fusion",
  "Afro-House",
  "Afro-R&B",
  "Hip Hop",
  "Gospel (African)",
  "R&B / Soul",
  "Pop",
  "Bongo Flava",
  "Ghanaian Drill (Asakaa)",
  "Naija Pop",
  "Coupe-Decale",
  "Gengetone",
  "Gqom",
  "Kwaito",
  "Azonto",
  "Reggaeton",
  "Dancehall",
  "Reggae",
  "Latin Pop",
  "Trap",
  "Drill (UK/US)",
  "Electronic",
  "K-Pop",
  "Highlife",
  "Soukous",
  "Rumba",
  "Zouk",
  "Kizomba",
  "Ragga",
  "Soca",
  "Jazz",
  "Blues",
  "Rock",
  "Alternative",
  "Traditional",
  "Fuji",
  "Juju",
  "Apala",
  "Mbalax",
  "Zouglou",
  "Rai",
  "Gnawa",
  "Taarab",
  "Maskandi",
  "Palmwine",
  "Folk",
  "Spoken Word",
];

export default function Genre({ control,Controller, errors }) {
  return (
    <Box
      mb={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start"
      }}
    >
      <Typography
        htmlFor="genre"
        sx={{
          color: "white",
          fontFamily: "Roboto",
          fontWeight: 500,
          fontSize: "16px",
          letterSpacing: "1px",
          mb: 2
        }}
      >
        Genre
      </Typography>

      <Controller
        name="genre"
        control={control}
        defaultValue=""
        rules={{ required: "Please select a genre" }}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            displayEmpty
            error={!!errors.genre}

 MenuProps={{
    PaperProps: {
      sx: {
        backgroundColor: "var(--secondary-background-color)",
        color: "#ffffff",         
      },
    },
  }}



            
            sx={{
              minWidth: 220,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              fontSize: "16px",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none"
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#ffde00"
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#ffde00"
              }
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{
                color: 'white'
              }}>Select a genre</Typography>
            </MenuItem>
            {MAIN_GENRES.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {errors.genre && (
        <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>
          {errors.genre.message}
        </Typography>
      )}
    </Box>
  );
}
