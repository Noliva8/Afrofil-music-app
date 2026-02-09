import { useMemo } from "react";
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useQuery } from "@apollo/client";
import { QUERY_USER_PLAYLISTS } from "../utils/queries";
import UserAuth from "../utils/auth";

export const AddButton = ({
  handleAddToPlaylist = () => {},
  handleRemoveFromPlaylist,
  track,
  sx = {},
}) => {
  const songId = track?._id || track?.id || null;
  const isLoggedIn = Boolean(UserAuth?.getProfile?.()?.data?._id);

  const { data } = useQuery(QUERY_USER_PLAYLISTS, {
    variables: { limit: 50 },
    skip: !isLoggedIn,
    fetchPolicy: "cache-first",
  });

  const playlists = data?.userPlaylists || [];
  const isInPlaylist = useMemo(() => {
    if (!songId) return false;
    return playlists.some((playlist) =>
      playlist.songs?.some((song) => String(song._id || song.id) === String(songId))
    );
  }, [playlists, songId]);

  const handleClick = (event) => {
    event.stopPropagation();
    if (isInPlaylist && typeof handleRemoveFromPlaylist === "function") {
      handleRemoveFromPlaylist(track);
      return;
    }
    handleAddToPlaylist(track);
  };

  const { display, ...restSx } = sx || {};
  return (
    <Box
      sx={{
        display: display ?? { xs: "none", md: "flex" },
        justifyContent: "center",
        ...restSx,
      }}
    >
      <IconButton
        size="medium"
        onClick={handleClick}
        sx={{
          color: "text.secondary",
          backgroundColor: "action.hover",
          width: 48,
          height: 48,
          borderRadius: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            color: "primary.main",
            backgroundColor: "rgba(228,196,33,0.15)",
            transform: "scale(1.1) rotate(90deg)",
          },
        }}
      >
        {isInPlaylist ? (
          <CheckCircleIcon sx={{ fontSize: "1.4rem", color: "success.main" }} />
        ) : (
          <AddIcon sx={{ fontSize: "1.4rem" }} />
        )}
      </IconButton>
    </Box>
  );
};
