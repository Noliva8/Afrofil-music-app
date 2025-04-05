import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { useState } from "react";
import CustomAlbum from "../../homeFreePlanComponents/albumContent/CustomAlbum";

export default function AlbumSong({ albumToSelect, albums, handleAlbumChange, register, errors, refetch }) {

  // Fixed the state variable to set the correct state
  const [albumOpen, setAlbumOpen] = useState(false);

  // Update to handle the opening of the album creation modal
  const handleOpen = () => setAlbumOpen(true); // Changed from setOpen to setAlbumOpen

  if (!albums.length) return <p>Loading albums...</p>;

  return (
    <>
      <Paper
        sx={{
          width: "98%",
          display: "flex",
          backgroundColor: "var(--secondary-background-color)",
          margin: "0 auto",
          marginTop: "10px",
          padding: "1rem",
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
            textWrap: "nowrap",
            fontFamily: "roboto",
            fontWeight: "500",
            textShadow: "revert-layer",
            fontSize: "18px",
            textSpacing: "2px",
          }}
        >
          Album
        </label>

        {/* Use register from parent component */}
        <select
          {...register("album", { required: "Please select an album" })} // Using register from the parent
          name="album"
          id="album"
          value={albumToSelect?._id || ""}
          onChange={handleAlbumChange}
          style={{
            minWidth: "220px",
            width: "100%",
            padding: "10px",
            backgroundColor: "var(--secondary-background-color)",
            color: "white",
            border: "1px solid white",
            borderRadius: "6px",
            fontSize: "16px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="" disabled hidden>
            Select an album
          </option>
          {albums.map((album) => (
            <option
              key={album._id}
              value={album._id}
              style={{
                backgroundColor: "var(--secondary-background-color)",
                color: "white",
                fontSize: "14px",
                padding: "8px",
              }}
            >
              {album.title}
            </option>
          ))}
        </select>

        {/* Display validation errors */}
        {errors.album && (
          <span style={{ color: "red", fontSize: "14px" }}>
            {errors.album.message}
          </span>
        )}

        {/* Create Album Button */}
        <Button
          variant="contained"
          sx={{
            bgcolor: "var(--secondary-background-color)",
            color: "white",
            "&:hover": { bgcolor: "gray" },
          }}
          onClick={handleOpen} // Fixed to trigger the correct handler
        >
          Create Album
        </Button>
      </Paper>

      {/* CustomAlbum modal that opens when albumOpen is true */}
      <CustomAlbum albumOpen={albumOpen} setAlbumOpen={setAlbumOpen} handleOpen={handleOpen} refetch={refetch} />
    </>
  );
}
