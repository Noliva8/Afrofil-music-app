import { useState } from "react";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { alpha, useTheme } from '@mui/material/styles';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation } from "@apollo/client";
import { TOGGLE_VISIBILITY, GET_PRESIGNED_URL_DELETE, DELETE_SONG } from "../../../../utils/mutations";

const decodeFilenameFromUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const pathname = new URL(value).pathname;
    const candidate = pathname.split("/").pop();
    return candidate ? decodeURIComponent(candidate) : null;
  } catch {
    const segments = String(value).split("/");
    const candidate = segments[segments.length - 1];
    return candidate ? decodeURIComponent(candidate) : null;
  }
};


export default function SongRowActions({ song, onDelete, refetch }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [toggleVisibility] = useMutation(TOGGLE_VISIBILITY);

const [getDeleteUrl] = useMutation(GET_PRESIGNED_URL_DELETE);
const [deleteSong] = useMutation(DELETE_SONG);


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggleVisibility = async (newStatus) => {
    try {
      await toggleVisibility({
        variables: {
          songId: song._id,
          visibility: newStatus,
        },
      });
      if (refetch) await refetch();
    } catch (error) {
      console.error("Failed to toggle visibility:", error.message);
    }
    handleClose();
  };


const handleDelete = async () => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone. The song will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    // 1. Delete AUDIO
    const audioKey = decodeFilenameFromUrl(song.audio);
    if (audioKey) {
      const { data } = await getDeleteUrl({
        variables: {
          bucket: "afrofeel-audio-files",
          key: audioKey,
          region: "us-east-2",
        },
      });
      await fetch(data.getPresignedUrlDelete.urlToDelete, { method: "DELETE" });
    }

    // 2. Delete ARTWORK
    const artworkKey = decodeFilenameFromUrl(song.artwork);
    if (artworkKey) {
      const { data } = await getDeleteUrl({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key: artworkKey,
          region: "us-east-2",
        },
      });
      await fetch(data.getPresignedUrlDelete.urlToDelete, { method: "DELETE" });
    }

    // 3. Delete from DB
    await deleteSong({ variables: { songId: song._id } });
    refetch(); // optional: re-fetch songs list
    Swal.fire("Deleted!", "The song has been permanently removed.", "success");
  } catch (err) {
    console.error("❌ Failed to delete song:", err);
    Swal.fire("Error", "Something went wrong while deleting the song.", "error");
  }

  handleClose();
};

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: theme.palette.text.secondary,
          "&:hover": {
            color: theme.palette.text.primary,
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: "8px",
          },
        }}
      >
        <MenuItem onClick={() => handleToggleVisibility("public")}>
          <ListItemIcon>
            <PublicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Make Public</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleToggleVisibility("private")}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Make Private</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "red" }} />
          </ListItemIcon>
          <ListItemText sx={{ color: "red" }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
