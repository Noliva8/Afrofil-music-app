import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicVideoIcon from '@mui/icons-material/MusicVideo';
import { GET_PRESIGNED_URL_DOWNLOAD, GET_PRESIGNED_URL_DELETE, GET_PRESIGNED_URL_DOWNLOAD_AUDIO } from '../../../../utils/mutations';
import { fetchPresignedUrls } from '../../../../utils/someSongsUtils/songsWithPresignedUrlHook';
import AudioPlayer from './TogglePlay';
import AudioControls from './AudioControls';
import EditModal from './EditSong/EditSongModal';
import SongRowActions from './SongRowActions';
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Tooltip from "@mui/material/Tooltip";




export default function SongsList({ songs = [], onEdit = () => {}, refetch, onDelete = () => {} }) {
  const [playingSongId, setPlayingSongId] = useState(null);
  const audioRefs = useRef({});
  const [artworkUrls, setArtworkUrls] = useState({});
  const [audioUrls, setAudioUrls] = useState({});






  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);
  const [getPresignedUrlDelete] = useMutation(GET_PRESIGNED_URL_DELETE);
  

const [volume, setVolume] = React.useState(1); 
const audioRef = useRef(null);


// for model to edit songs
// -------------------------

const [openEditModal, setOpenEditModal] = React.useState(false);
const [selectedSong, setSelectedSong] = React.useState(null);



const handleEdit = (song) => {
  setSelectedSong(song);
  setOpenEditModal(true);
};






useEffect(() => {
  if (playingSongId && audioRefs.current[playingSongId]) {
    audioRefs.current[playingSongId].volume = volume;
  }
}, [volume, playingSongId]);


useEffect(() => {
  async function runPresign() {
    const artUrls = {};
    const audUrls = {};

    // Manually presign each song (artwork + audio) for this list
    await Promise.all(
      (songs || []).map(async (song) => {
        const id = song._id || song.id;
        if (!id) return;

        // Artwork presign
        let artUrl = null;
        if (song.artwork) {
          try {
            const { data } = await getPresignedUrlDownload({
              variables: {
                bucket: 'afrofeel-cover-images-for-songs',
                key: typeof song.artwork === 'string'
                  ? decodeURIComponent(new URL(song.artwork).pathname.replace(/^\/+/, ''))
                  : song.artwork,
                region: 'us-east-2',
              },
            });
            artUrl = data?.getPresignedUrlDownload?.url || data?.getPresignedUrlDownload?.url || null;
          } catch (err) {
            artUrl = null;
          }
        }

        // Audio presign
        let audUrl = null;
        if (song.streamAudioFileUrl) {
          try {
            const { data } = await getPresignedUrlDownloadAudio({
              variables: {
                bucket: 'afrofeel-songs-streaming',
                key: `for-streaming/${decodeURIComponent(new URL(song.streamAudioFileUrl).pathname.split('/').pop())}`,
                region: 'us-west-2',
              },
            });
            audUrl = data?.getPresignedUrlDownloadAudio?.url || null;
          } catch (err) {
            audUrl = null;
          }
        }

        artUrls[id] = artUrl;
        audUrls[id] = audUrl;
      })
    );

    setArtworkUrls(artUrls);
    setAudioUrls(audUrls);
  }

  if (songs.length) {
    runPresign();
  }
}, [songs, getPresignedUrlDownload, getPresignedUrlDownloadAudio]);








const handleMakePublic = async (songId) => {
  // Your mutation to update visibility to public
};

const handleMakePrivate = async (songId) => {
  // Your mutation to update visibility to private
};

const handleDelete = async (songId) => {
  // Confirm with Swal or similar, then run delete mutation
};







  return (
    <Box
      sx={{
        width: "100%",
        padding: 2,
        maxHeight: "60vh",
        overflowY: "auto",
        bgcolor: "transparent",
      }}
    >
      {songs.length === 0 && (
        <Typography color="white">No songs available.</Typography>
      )}

      {songs.length > 0 && (
        <>
          {/* Header Row */}
         {/* Header Row */}
<Box sx={{ overflowX: "auto", whiteSpace: "nowrap", pb: 1, mb: 1 }}>
  <Box
    sx={{
      display: "flex",
      minWidth: "600px",
      color: "white",
      fontWeight: "bold",
      paddingBottom: "0.5rem",
    }}
  >
    <Box sx={{ width: "10%", textAlign: "center" }}>Thumbnail</Box>
    <Box sx={{ width: "25%", minWidth: "150px" }}>Title</Box>
    <Box sx={{ width: "15%", minWidth: "120px" }}>Album</Box>
    <Box sx={{ width: "10%", minWidth: "100px", textAlign: "center" }}>Play</Box>
    <Box sx={{ width: "10%", minWidth: "100px", textAlign: "center" }}></Box>
    <Box sx={{ width: "10%", minWidth: "100px", textAlign: "center" }}>Visibility</Box>
    <Box sx={{ width: "10%", textAlign: "center", display: { xs: "none", md: "block" },}}>Edit</Box>
    <Box sx={{ width: "10%", textAlign: "center", display: { xs: "none", md: "block" },}} > Actions</Box></Box>
</Box>


          {/* Song Rows */}

          <Box
            sx={{ display: "flex", flexDirection: "column", minWidth: "850px", gap: "0.75rem" }}
          >
            {songs.map((song) => (
              <Box
                key={song._id}
                sx={{
                  overflowX: "auto",
                  
                  whiteSpace: "nowrap",
                  "&::-webkit-scrollbar": { height: 4 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    minWidth: "600px",
                    alignItems: "center",
                    borderBottom: "1px solid #333",
                    py: 1,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  {/* Thumbnail */}
                  <Box
                    sx={{
                      width: "10%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                        backgroundColor: "var(--primary-background-color)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      {artworkUrls[song._id || song.id] ? (
                        <img
                          src={artworkUrls[song._id || song.id]}
                          alt={song.title || "Artwork"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <MusicVideoIcon sx={{ fontSize: 40, color: "white" }} />
                      )}
                    </Box>
                  </Box>

                  {/* Title */}
                  <Box
                    sx={{
                      width: "25%",
                      minWidth: "150px",
                      color: "white",
                      opacity: 0.5,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      paddingRight: 4,
                      textOverflow: "ellipsis",
                    }}
                  >
                    {song.title || ""}
                  </Box>

                  {/* Album */}
                  <Box
                    sx={{
                      width: "15%",
                      minWidth: "120px",
                      color: "white",
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {song.album?.title || "Unknown Album"}
                  </Box>

                  {/* Play */}
                  <Box
                    sx={{
                      width: "10%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <AudioPlayer
                      song={song}
                      audioUrl={audioUrls[song._id || song.id]}
                      playingSongId={playingSongId}
                      setPlayingSongId={setPlayingSongId}
                      setVolumeRef={(ref) => {
                        if (ref?.current) {
                          const songId = song._id || song.id;
                          audioRefs.current[songId] = ref.current;
                          ref.current.volume = volume;
                        }
                      }}
                    />
                  </Box>

                 
                  {/* Volume Control */}
                  <Box
                    sx={{
                      width: "10%",
                      minWidth: "100px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <AudioControls
                      songId={song._id}
                      playingSongId={playingSongId}
                      volume={volume}
                      setVolume={setVolume}
                    />
                  </Box>

                  {/* Visibility */}

                    {/* ✅ Visibility Status Icon */}
    <Box
      sx={{
        width: "10%",
        display: { xs: "none", md: "flex" },
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {song.visibility === "public" ? (
        <VisibilityIcon  sx={{color:"white"}} />
      ) : (
        <VisibilityOffIcon color="disabled" />
      )}
    </Box>







                  {/* Edit */}
                  <Box
                    sx={{
                      width: "10%",
                      display: { xs: "none", md: "flex" },
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <IconButton onClick={() => handleEdit(song)} color="info">
                      <EditIcon />
                    </IconButton>
                  </Box>



                  {/* Delete */}

                  
              <Box sx={{ width: "10%", display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
  <SongRowActions
    song={song}
    onMakePublic={handleMakePublic}
    onMakePrivate={handleMakePrivate}
    onDelete={handleDelete}
    refetch={refetch}
  />
</Box>




                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      <EditModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        song={selectedSong}
        refetch={refetch}
      />
    </Box>
  );
}
