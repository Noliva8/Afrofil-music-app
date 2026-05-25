import React, { useMemo, useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { useTheme } from "@mui/material/styles";
import {
  PlayArrow,
  Pause,
  Radio,
  Close,
  QueueMusic,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useLazyQuery, useApolloClient, useMutation } from "@apollo/client";
import { RADIO_STATION_SONGS } from "../../utils/queries";
import {
  getFullKeyFromUrlOrKey,
  useSongsWithPresignedUrls,
} from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../../utils/mutations";

const fallbackStationArt = (name, theme) => {
  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];
  
  const gradient = gradientColors[name.length % gradientColors.length];
  
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Radio sx={{ color: "white", fontSize: 48, opacity: 0.8 }} />
    </Box>
  );
};

const getUsableCoverUrl = (coverImage) => {
  if (!coverImage || typeof coverImage !== "string") return null;
  if (/^https?:\/\//i.test(coverImage) || coverImage.startsWith("blob:")) {
    return coverImage;
  }
  return null;
};

const RadioStationCard = ({ station, onOpen, onNavigate }) => {
  const theme = useTheme();
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [coverFailed, setCoverFailed] = useState(false);
  const [signedCoverUrl, setSignedCoverUrl] = useState(null);
  const stationColor = theme.palette.primary.main;
  const coverUrl = signedCoverUrl || getUsableCoverUrl(station.coverImage);

  useEffect(() => {
    let alive = true;
    setCoverFailed(false);
    setSignedCoverUrl(null);

    const coverKey = getFullKeyFromUrlOrKey(station.coverImage);
    if (!coverKey || String(station.coverImage || "").startsWith("data:")) {
      return undefined;
    }

    getPresignedUrlDownload({
      variables: {
        bucket: "afrofeel-cover-images-for-songs",
        key: coverKey,
        region: "us-east-2",
      },
    })
      .then(({ data }) => {
        if (alive) {
          setSignedCoverUrl(data?.getPresignedUrlDownload?.url || null);
        }
      })
      .catch((error) => {
        console.warn("Station cover presign failed:", error?.message || error);
      });

    return () => {
      alive = false;
    };
  }, [station.coverImage, getPresignedUrlDownload]);

  return (
    <Box
      onClick={() => onNavigate?.(station)}
      sx={{
        flex: "0 0 218px",
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "transform 160ms ease, border-color 160ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: alpha(stationColor, 0.45),
        },
      }}
    >
      <Box sx={{ position: "relative", height: 122, overflow: "hidden" }}>
        {coverUrl && !coverFailed ? (
          <Box
            component="img"
            src={coverUrl}
            alt={station.name}
            onError={() => setCoverFailed(true)}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          fallbackStationArt(station.name, theme)
        )}
        <IconButton
          aria-label={`Play ${station.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.(station);
          }}
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 42,
            height: 42,
            backgroundColor: stationColor,
            color: theme.palette.getContrastText(stationColor),
            boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.22)}`,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          <PlayArrow />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: "0.98rem",
            lineHeight: 1.2,
            mb: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {station.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: alpha(theme.palette.text.primary, 0.64),
            fontSize: "0.8rem",
            lineHeight: 1.35,
            minHeight: 34,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {station.description || station.type || "Radio station"}
        </Typography>
      </Box>
    </Box>
  );
};

// Station Dialog Component
const StationDialog = ({ 
  open, 
  onClose, 
  station, 
  songs, 
  loading, 
  onPlayStation, 
  onPlaySong,
  currentTrack,
  isPlaying,
  theme 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(20px)",
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }
      }}
    >
      <DialogTitle sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {station?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                Radio Station • {songs.length} songs
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Description */}
        {station?.description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: alpha(theme.palette.text.primary, 0.7), 
              mb: 3,
              lineHeight: 1.6 
            }}
          >
            {station.description}
          </Typography>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
              Loading station songs...
            </Typography>
          </Box>
        )}

        {/* Empty State */}
        {!loading && songs.length === 0 && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <QueueMusic sx={{ fontSize: 48, color: alpha(theme.palette.text.primary, 0.3), mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 1, color: alpha(theme.palette.text.primary, 0.7) }}>
              No songs in this station yet
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.5) }}>
              Songs will be added based on station rules
            </Typography>
          </Box>
        )}

        {/* Songs List */}
        {songs.length > 0 && (
          <List disablePadding>
            {songs.slice(0, 10).map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <React.Fragment key={song.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySong(song);
                        }}
                        sx={{
                          color: isCurrent ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7),
                          backgroundColor: isCurrent ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        {isCurrent && isPlaying ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    }
                    sx={{
                      px: 0,
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.action.hover, 0.05),
                        borderRadius: 1,
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={song.artworkUrl}
                        variant="rounded"
                        sx={{ width: 48, height: 48, borderRadius: 1.5 }}
                      >
                        {song.title?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: isCurrent ? theme.palette.primary.main : theme.palette.text.primary,
                            fontSize: "0.95rem",
                          }}
                        >
                          {song.title}
                          {isCurrent && (
                            <Box
                              component="span"
                              sx={{
                                display: "inline-block",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: theme.palette.primary.main,
                                ml: 1,
                              }}
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component={RouterLink}
                          to={`/artist/${song.artistId}`}
                          onClick={(e) => e.stopPropagation()}
                          variant="body2"
                          sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            textDecoration: "none",
                            "&:hover": {
                              color: theme.palette.primary.main,
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {song.artistName}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < Math.min(songs.length, 10) - 1 && (
                    <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Button
          onClick={onClose}
          sx={{
            color: alpha(theme.palette.text.primary, 0.7),
            borderColor: alpha(theme.palette.divider, 0.3),
          }}
        >
          Close
        </Button>
        <Button
          onClick={onPlayStation}
          variant="contained"
          startIcon={<PlayArrow />}
          disabled={songs.length === 0}
          sx={{
            backgroundColor: theme.palette.primary.main,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          }}
        >
          Play Station
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Component
export default function RadioStations({ stations = [] }) {
  const theme = useTheme();
  const client = useApolloClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeStation, setActiveStation] = useState(null);
  const [loadSongs, { data, loading }] = useLazyQuery(RADIO_STATION_SONGS, {
    fetchPolicy: "network-only",
  });

  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

  const stationSongsRaw = useMemo(
    () => data?.radioStationSongs || [],
    [data?.radioStationSongs]
  );
  const { songsWithArtwork: stationSongsWithArtwork } = useSongsWithPresignedUrls(
    stationSongsRaw
  );

  const stationSongs = useMemo(
    () => processSongs(stationSongsWithArtwork).filter((song) => song.audioUrl),
    [stationSongsWithArtwork]
  );

  const handleOpen = (station) => {
    setActiveStation(station);
    setOpen(true);
    loadSongs({ variables: { stationId: station._id } });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePlayStation = () => {
    if (!stationSongs.length) return;
    const firstSong = stationSongs[0];
    onPlaySong(firstSong);
  };

  const onPlaySong = (song) => {
    const isCurrent = currentTrack?.id === song.id;
    if (isCurrent) {
      isPlaying
        ? pause()
        : handleTrendingSongPlay({
            song,
            incrementPlayCount,
            handlePlaySong,
            trendingSongs: stationSongs,
            client,
          });
      return;
    }
    handleTrendingSongPlay({
      song,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: stationSongs,
      client,
    });
  };

  if (!stations.length) return null;

  return (
    <Box sx={{ mb: 5, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          px: { xs: 0.5, sm: 1 },
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              mb: 0.5,
            }}
          >
            Radio Stations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: "0.84rem",
              maxWidth: 600,
            }}
          >
            Curated stations for every mood and moment
          </Typography>
        </Box>
      </Box>

      {/* Stations Grid */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          px: { xs: 0.5, sm: 1 },
          pb: 2,
          "&::-webkit-scrollbar": {
            height: 6,
            backgroundColor: alpha(theme.palette.divider, 0.1),
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(theme.palette.primary.main, 0.3),
            borderRadius: 3,
          },
        }}
      >
        {stations.map((station) => (
          <RadioStationCard
            key={station._id}
            station={station}
            onOpen={handleOpen}
            onNavigate={(item) => navigate(`/radio/${item._id}`)}
          />
        ))}
      </Box>

      {/* Station Dialog */}
      <StationDialog
        open={open}
        onClose={handleClose}
        station={activeStation}
        songs={stationSongs}
        loading={loading}
        onPlayStation={handlePlayStation}
        onPlaySong={onPlaySong}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        theme={theme}
      />
    </Box>
  );
}
