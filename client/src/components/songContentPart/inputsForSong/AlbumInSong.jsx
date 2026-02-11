import { useState, lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import useTheme from "@mui/material/styles/useTheme";
import Select from "@mui/material/Select";

// Icons
import Add from "@mui/icons-material/Add";
import LibraryMusic from "@mui/icons-material/LibraryMusic";



const CustomAlbum = lazy(
  () => import("../../homeFreePlanComponents/albumContent/CustomAlbum")
);


export default function AlbumSong({ 
  albumToSelect, 
  Controller,
  setValue,
  control,
  albums, 
  handleAlbumChange, 
  refetchAlbums,
  register, 
  errors, 
  refetch 
}) {
  const theme = useTheme();
  const [albumOpen, setAlbumOpen] = useState(false);

  const handleOpen = () => setAlbumOpen(true);
  const displayAlbumTitle = (title) =>
    title === "Unknown" || title === "Uncategorized" ? "Single" : title;

  return (
    <Box sx={{ width: '100%' }}>
    

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
      
        Album 
      </Typography>

<Controller
  name="album"
  control={control}
  defaultValue=""
  rules={{ required: "Album is required" }}
  render={({ field, fieldState }) => (
    <>
      <Select
        {...field}
        fullWidth
        displayEmpty
        value={albums.some(a => a._id === field.value) ? field.value : ''}
        onChange={(e) => {
          field.onChange(e);
          handleAlbumChange(e);
        }}
        error={!!fieldState.error}

MenuProps={{
    PaperProps: {
      sx: {
        backgroundColor: "var(--secondary-background-color)", 
        color: "#ffffff",        
      },
    },
  }}

        input={
          <OutlinedInput
            startAdornment={
              <InputAdornment position="start">
                <LibraryMusic
                  color="action"
                  sx={{ mr: 1, color: theme.palette.text.secondary }}
                />
              </InputAdornment>
            }
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
          />
        }
      >
        <MenuItem value="" disabled>
          <Typography sx={{color: "#ffffff"}}>Choose from your albums</Typography>
        </MenuItem>

        {albums.map((album) => (
          <MenuItem
            key={album._id}
            value={album._id}
            sx={{
            
              color: "white",
              py: 1.5,
              "&:hover": {
                backgroundColor: "#2e64c5",
              },
            }}
          >
            <Typography variant="subtitle1">{displayAlbumTitle(album.title)}</Typography>
          </MenuItem>
        ))}
      </Select>

      {fieldState.error && (
        <Typography
          variant="subtitle2"
          color="error"
          sx={{ mt: 1 }}
        >
          {fieldState.error.message}
        </Typography>
      )}
    </>
  )}
/>


      

          {/* <TextField
            select
            fullWidth
           {...register('album', {required: 'Album is required'})}
           error={!!errors.album}
  helperText={errors.album?.message || ''}

            variant="outlined"

    margin="normal"

            value={albumToSelect?._id || ""}
            onChange={handleAlbumChange}
            InputProps={{
              startAdornment: (
                <LibraryMusic 
                  color="action" 
                  sx={{ 
                    mr: 1,
                    color: theme.palette.text.secondary
                  }} 
                />
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
        "& .MuiInputLabel-root": {
          color: "rgba(255, 255, 255, 0.7)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#ffde00",
        },
      }}
          >
            <MenuItem value="" disabled>
              <Typography color="textSecondary">
                Choose from your albums
              </Typography>
            </MenuItem>

            {albums.map((album) => (
              <MenuItem 
                key={album._id} 
                value={album._id}
                sx={{
                  backgroundColor: '#1f3839',
                  color: 'white',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: '#2e64c5'
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{album.title}</Typography>
                
                </Box>
              </MenuItem>
            ))}
          </TextField> */}




          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: '20px',
            alignItems: 'center',
            pt: 1
          }}>
            <Typography variant="body2" xs={{ color:'var(--primary-font-color)'}}>
              {albums.length} {albums.length === 1 ? 'album' : 'albums'} available
            </Typography>

            <Button
              onClick={handleOpen}
              startIcon={<Add />}
              variant="contained"
             
              sx={{ 
                borderRadius: '12px',
                color: 'var(--primary-background-color)',
                backgroundColor: "var(--button-color)",
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                   backgroundColor: 'var(--secondary-background-color)',
                   color: 'white'
                   
                }
              }}
            >
              Create New Album
            </Button>
          </Box>
        </Box>
   

      <Suspense fallback={<div />}>
        <CustomAlbum 
          albumOpen={albumOpen} 
          setAlbumOpen={setAlbumOpen} 
          refetchAlbums={refetchAlbums} 
        />
      </Suspense>
    </Box>
  );
}
