import React, { useMemo, useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
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
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import { useTheme } from "@mui/material/styles";
import {
  PlayArrow,
  Pause,
  MoreHoriz,
  Radio,
  Close,
  QueueMusic,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useLazyQuery, useApolloClient, useMutation } from "@apollo/client";
import { RADIO_STATION_SONGS } from "../../utils/queries";
import {
  useSongsWithPresignedUrls,
  getFullKeyFromUrlOrKey,
} from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../../utils/mutations";
import { keyframes } from "@mui/system";

// Animations
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

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

const RadioStationCard = ({ station, coverUrl, onOpen, onNavigate, avatars = [] }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  // Get station type color
  const getStationTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'artist': return theme.palette.primary.main;
      case 'genre': return theme.palette.secondary.main;
      case 'mood': return theme.palette.success.main;
      case 'era': return theme.palette.warning.main;
      case 'personal': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  const stationColor = getStationTypeColor(station.type);
  const isPlaying = false; // You might want to track this

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate?.(station)}
      sx={{
        minWidth: 280,
        maxWidth: 320,
        height: 360,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-8px)",
          borderColor: stationColor,
          boxShadow: `0 20px 40px ${alpha(stationColor, 0.15)}`,
          "& .play-button": {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${stationColor}, ${alpha(stationColor, 0.5)})`,
          opacity: 0.8,
        },
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(stationColor, 0.05)} 0%, transparent 50%)`,
          opacity: 0.3,
        }}
      />

      {/* Artwork */}
      <Box sx={{ position: "relative", height: 180, overflow: "hidden" }}>
        {coverUrl ? (
          <CardMedia
            component="img"
            image={coverUrl}
            alt={station.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: isHovered ? "brightness(0.9)" : "brightness(1)",
              transition: "filter 0.3s ease",
            }}
          />
        ) : (
          fallbackStationArt(station.name, theme)
        )}

        {/* Overlay with Play Button */}
        <Fade in={isHovered}>
          <Box
            className="play-button"
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transform: "translateY(10px)",
              transition: "all 0.3s ease",
            }}
          >
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                onOpen?.(station);
              }}
              sx={{
                backgroundColor: stationColor,
                color: theme.palette.getContrastText(stationColor),
                width: 56,
                height: 56,
                "&:hover": {
                  backgroundColor: stationColor,
                  transform: "scale(1.1)",
                  animation: `${pulse} 2s infinite`,
                },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>
        </Fade>

        {/* Station Type Badge */}
        <Chip
          label={station.type?.toUpperCase() || "RADIO"}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: alpha(stationColor, 0.2),
            color: stationColor,
            fontWeight: 700,
            fontSize: "0.7rem",
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(stationColor, 0.3)}`,
          }}
        />

        {/* Live Indicator */}
        {station.isLive && (
          <Chip
            label="LIVE"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: alpha(theme.palette.error.main, 0.2),
              color: theme.palette.error.main,
              fontWeight: 700,
              fontSize: "0.7rem",
              backdropFilter: "blur(10px)",
              animation: `${pulse} 1.5s infinite`,
            }}
          />
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ p: 2.5, height: "calc(100% - 180px)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Title and Description */}
          <Box sx={{ mb: 2, flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: "1.1rem",
                mb: 0.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {station.name}
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                color: alpha(theme.palette.text.primary, 0.7),
                fontSize: "0.85rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {station.description || "Personalized music mix"}
            </Typography>
          </Box>

          {/* Bottom Section - Avatars and Stats */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Artist Avatars */}
            {avatars.length > 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                  {avatars.map((src, index) => (
                    <Avatar
                      key={index}
                      src={src}
                      sx={{
                        border: `2px solid ${theme.palette.background.paper}`,
                        animation: `${float} 3s ease-in-out infinite`,
                        animationDelay: `${index * 0.5}s`,
                      }}
                    />
                  ))}
                </AvatarGroup>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
                  {avatars.length}+ artists
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Radio sx={{ fontSize: 20, color: alpha(theme.palette.text.primary, 0.6) }} />
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
                  Radio Station
                </Typography>
              </Box>
            )}

            {/* Stats */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {station.playCount > 0 && (
                <Tooltip title="Total plays">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PlayArrow sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.8) }}>
                      {station.playCount >= 1000 
                        ? `${(station.playCount / 1000).toFixed(1)}K` 
                        : station.playCount}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              <IconButton size="small" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
                <MoreHoriz />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
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
                                animation: `${pulse} 1.5s infinite`,
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
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [stationCards, setStationCards] = useState([]);
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

  // Fetch station covers (same as before)
  useEffect(() => {
    let alive = true;
    const resolveStations = async () => {
      if (!stations.length) {
        setStationCards([]);
        return;
      }

      const resolved = await Promise.all(
        stations.map(async (station) => {
          const coverValue = station.coverImage;
          const key = coverValue ? getFullKeyFromUrlOrKey(coverValue) : null;
          if (key) {
            try {
              const { data: presignData } = await getPresignedUrlDownload({
                variables: {
                  bucket: "afrofeel-cover-images-for-songs",
                  key,
                  region: "us-east-2",
                  expiresIn: 604800,
                },
              });
              const url = presignData?.getPresignedUrlDownload?.url;
              if (url) {
                return { ...station, coverUrl: url };
              }
            } catch (error) {
              console.error("Station cover presign failed:", error);
            }
          }
          return { ...station, coverUrl: null };
        })
      );

      if (alive) setStationCards(resolved);
    };

    resolveStations();
    return () => {
      alive = false;
    };
  }, [stations, getPresignedUrlDownload]);

  // Get avatars for each station
  const stationAvatars = useMemo(() => {
    const avatars = {};
    stations.forEach((station) => {
      const seedIds = (station.seeds || []).map((seed) => seed.seedId);
      const matches = stationSongs
        .filter((song) => seedIds.includes(song.id) || seedIds.includes(song.artistId))
        .map((song) => song.profilePictureUrl || song.artworkUrl)
        .filter(Boolean);
      avatars[station._id] = matches.slice(0, 3);
    });
    return avatars;
  }, [stations, stationSongs]);

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
    <Box sx={{ mb: 8, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          px: { xs: 1, sm: 2 },
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
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              mb: 0.5,
            }}
          >
            Radio Stations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: "0.95rem",
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
          gap: 3,
          overflowX: "auto",
          px: { xs: 1, sm: 2 },
          pb: 3,
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
        {stationCards.map((station) => (
          <RadioStationCard
            key={station._id}
            station={station}
            coverUrl={station.coverUrl}
            avatars={stationAvatars[station._id] || []}
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
