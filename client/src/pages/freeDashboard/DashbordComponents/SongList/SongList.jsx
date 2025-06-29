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
  async function fetchPresignedUrls() {
    const artUrls = {};
    const audUrls = {};

    for (const song of songs) {
      const getArtworkKey = (url) => {
        try {
          const parsed = new URL(url);
          return decodeURIComponent(parsed.pathname.split('/').pop());
        } catch {
          return url;
        }
      };

      const getAudioKey = (url) => {
        try {
          const parsed = new URL(url);
          return decodeURIComponent(parsed.pathname.split('/').pop());
        } catch {
          return url;
        }
      };

      // 🎨 Fetch artwork presigned URL
      if (song.artwork) {
        const artworkKey = getArtworkKey(song.artwork);
        try {
          const { data: artworkData } = await getPresignedUrlDownload({
            variables: {
              bucket: 'afrofeel-cover-images-for-songs',
              key: artworkKey,
              region: 'us-east-2',
              expiresIn: 604800,
            },
          });

          artUrls[song._id] = artworkData.getPresignedUrlDownload;
        } catch (error) {
          console.error('❌ Error fetching artwork URL for', song.title, error);
          artUrls[song._id] = null;
        }
      } else {
        artUrls[song._id] = null;
      }

      // 🎵 Fetch audio presigned URL using new function
      if (song.streamAudioFileUrl) {
        const audioKey = getAudioKey(song.streamAudioFileUrl);
        try {
          const { data: audioData } = await getPresignedUrlDownloadAudio({
            variables: {
              bucket: 'afrofeel-songs-streaming',
              key: `for-streaming/${audioKey}`,  // <-- add prefix here
              region: 'us-west-2',
            },
          });

          console.log(audioData.getPresignedUrlDownloadAudio.url);

          audUrls[song._id] = audioData.getPresignedUrlDownloadAudio.url;
        } catch (error) {
          console.error('❌ Error fetching audio URL for', song.title, error);
          audUrls[song._id] = null;
        }
      } else {
        audUrls[song._id] = null;
      }
    }

    setArtworkUrls(artUrls);
    setAudioUrls(audUrls);

    console.log('🎨 Artwork URLs:', artUrls);
    console.log('🎵 Audio URLs:', audUrls);
  }

  if (songs.length) {
    fetchPresignedUrls();
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
                      {artworkUrls[song._id]?.urlToDownload ? (
                        <img
                          src={artworkUrls[song._id].urlToDownload}
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
                      audioUrl={audioUrls[song._id]}
                      playingSongId={playingSongId}
                      setPlayingSongId={setPlayingSongId}
                      setVolumeRef={(ref) => {
                        if (ref?.current) {
                          audioRefs.current[song._id] = ref.current;
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
