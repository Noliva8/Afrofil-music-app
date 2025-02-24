import { useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";

export default function AlbumSong({ albumToSelect, handleAlbumChange, albums, register, errors}) {


console.log("albumToSelectonnnne:", albumToSelect);
console.log("MenuItem values twoooo:", albums.map(a => a._id));



  const addAlbum = async () => {
    const newAlbum = prompt("Enter new album name:");
    if (newAlbum) {
      console.log(`Album created: ${newAlbum}`);
      await refetch(); // Refresh album list after adding a new album
    }
  };







  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "start", md: "center" },
            gap: "10px",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <label
            htmlFor="album"
            style={{
              color: "white",
              minWidth: "150px",
              fontFamily: "roboto",
              fontWeight: "500",
              fontSize: "18px",
            }}
          >
            Album
          </label>

          <TextField
            select
            id="album"
            name="album"
            fullWidth
            sx={{
              minWidth: "200px",
              bgcolor: "var(--secondary-background-color)",
              color: "white",
              "& .MuiInputLabel-root": { color: "white" },
              "& .MuiInputBase-root": { color: "white" },
            }}
            value={albumToSelect?._id || ""}
            onChange={handleAlbumChange}
            {...register("album", { required: "Album selection is required" })}
            error={!!errors.album}
            helperText={errors.album ? errors.album.message : ""}
          >
            {albums.map((album) => (
              <MenuItem key={album._id} value={album._id}>
                {album.title} 
              </MenuItem>

              
            ))}
          </TextField>
        </Box>

        <Button
          variant="contained"
          sx={{
            bgcolor: "var(--secondary-background-color)",
            color: "white",
            "&:hover": { bgcolor: "gray" },
          }}
          onClick={addAlbum}
        >
          Create Album
        </Button>
      </Stack>
    </>
  );
}