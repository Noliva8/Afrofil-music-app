import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Pause, PlayArrow } from '@mui/icons-material';
import { LikesComponent } from './like';
import UserAuth from '../../utils/auth.js'
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext.jsx';
import { eventBus } from '../../utils/Contexts/playerAdapters.js';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

const getArtistDisplayName = (song) =>
  song?.artistAka || song?.artist?.artistAka || song?.artistName || '';




// no hero
// -----
export function SongCard({
  song,
  isPlayingThisSong,
  onPlayPause,
  onOpenArtist,
  imgLoading = "eager",
}) {
  const theme = useTheme();
  const background = theme.palette.primary.background;
  const navigate = useNavigate();
  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  const { isAdPlaying } = useAudioPlayer();

  // State for title hover scroll
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const handlePlayAttempt = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (isAdPlaying) {
      try {
        eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
          message: "Playback will resume after the advertisement finishes."
        });
      } catch {}
      return;
    }
    onPlayPause();
  };

  const artworkUrl = song.artworkUrl || song.artwork || song.cover;

  return (


    <Box sx={{ 
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column',
   
      width: '100%',
      maxWidth: (theme) => ({
        xs: theme.customSizes?.musicCard?.xs ?? 140,
        sm: theme.customSizes?.musicCard?.sm ?? 160,
        md: theme.customSizes?.musicCard?.md ?? 180,
        lg: theme.customSizes?.musicCard?.lg ?? 200,
      }),
    }}>


      {/* Image Card */}
      <Card
      
  onClick={(e) => {
  if (e?.stopPropagation) e.stopPropagation();
  
  // Custom artist handler
  if (typeof onOpenArtist === 'function') {
    onOpenArtist(song);
    return;
  }
  
  // Navigate to song page within album context, passing song data
  if (song?.albumId && (song?.id || song?._id)) {
    navigate(`/album/${song.albumId}/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Fallback: standalone song page
  if (song?.id || song?._id) {
    navigate(`/song/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Last resort: artist page
  const artistId = song?.artistId || song?.artist?._id;
  if (artistId) {
    navigate(`/artist/${artistId}`);
  }
}}


        sx={{
          width: '100%',
          aspectRatio: '1 / 1', // Perfect square
          borderRadius: 3,
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: 'pointer',
          position: 'relative',
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
            "& .play-button": {
              opacity: 1,
              transform: "translateY(0)",
            }
          },
        }}
      >
        {/* Image */}
        <Box sx={{ position: "relative", width: '100%', height: '100%' }}>


          <Box
            component="img"
            width="100%"
            height="100%"
            loading={imgLoading}
            src={artworkUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='300' height='300' fill='%231a1a1a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='24' font-family='Arial'>No Cover</text></svg>"}
            alt={song.title}
            sx={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            onError={(e) => {
              e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='300' height='300' fill='%231a1a1a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='24' font-family='Arial'>No Cover</text></svg>";
            }}
          />

          {/* Now Playing Label */}
          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#E4C421",
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}
            >
              Now Playing
            </Typography>
          )}

          {/* Play/Pause Button - Appears on hover */}
          <IconButton
            className="play-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayAttempt(e);
            }}
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#E4C421",
              width: { xs: 36, sm: 40, md: 44 },
              height: { xs: 36, sm: 40, md: 44 },
              "&:hover": { 
                backgroundColor: "#F8D347",
                transform: 'scale(1.1) !important',
              },
              transition: 'all 0.2s ease',
              opacity: isPlayingThisSong ? 1 : 0,
              transform: isPlayingThisSong ? 'translateY(0)' : 'translateY(8px)',
              zIndex: 2,
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: "#000", fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            ) : (
              <PlayArrow sx={{ color: "#000", fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            )}
          </IconButton>

          {/* Semi-transparent overlay on hover */}
          <Box
            className="hover-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                opacity: 1,
              },
            }}
          />

          
        </Box>

      </Card>

      {/* Info Underneath the Card */}
      <Box sx={{ 
        mt: 2, 
        px: 0.5,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        
      }}>
        
       
       {/* Song Title with Hover Scroll (Marquee) */}
<Box
  onMouseEnter={() => setIsTitleHovered(true)}
  onMouseLeave={() => setIsTitleHovered(false)}
  sx={{
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "1.8em",
  }}
>
  {/* Normal (not hovered): ellipsis */}
  {!isTitleHovered && (
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: "bold",
        color: "white",
        lineHeight: 1.4,
        fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={song.title} 
    >
      {song.title}
    </Typography>
  )}

  {/* Hovered: animated marquee track */}
  {isTitleHovered && (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        willChange: "transform",
        animation: "titleMarquee 10s linear infinite",
        "@keyframes titleMarquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }, // because we duplicate content
        },
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: "bold",
          color: "white",
          lineHeight: 1.4,
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
          pr: 4, // spacing between duplicates
        }}
      >
        {song.title}
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: "bold",
          color: "white",
          lineHeight: 1.4,
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
          pr: 4,
        }}
        aria-hidden="true"
      >
        {song.title}
      </Typography>
    </Box>
  )}
</Box>


        {/* Artist Name and Likes */}
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} mb={0.75}>

          <Typography
            variant="body1"
            onClick={(e) => {
              e.stopPropagation();
              const artistId = song?.artistId || song?.artist?._id || song?.artist;
              if (artistId) navigate(`/artist/${artistId}`);
            }}
            sx={{
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
              mr: 1,
              '&:hover': { 
                color: "#E4C421",
                textDecoration: 'underline'
              },
            }}
          >
            {getArtistDisplayName(song)}
          </Typography>


          <Box sx={{ flexShrink: 0 }}>
            <LikesComponent song={song} currentUserId={userId} />
          </Box>

          
        </Box>

        {/* Plays & Duration */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant="body2"
            sx={{ 
              color: "#E4C421", 
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
            }}
          >
            {song.plays?.toLocaleString?.() || 0} plays
          </Typography>

          <Typography 
            variant="body2"
            sx={{ 
              color: "rgba(255,255,255,0.6)", 
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            {song.duration || '0:00'}
          </Typography>
        </Box>

      </Box>
    </Box>
  );
}


export function CompactSongCard({
  song,
  isPlayingThisSong = false,
  onPlayPause = () => {},
  currentUserId,
  onOpenArtist,
  imgLoading = 'eager',
}) {
  const navigate = useNavigate();
  const { isAdPlaying } = useAudioPlayer();

  // Title hover state (same behavior as SongCard)
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const handlePlayAttempt = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (isAdPlaying) {
      try {
        eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
          message: "Playback will resume after the advertisement finishes.",
        });
      } catch {}
      return;
    }
    onPlayPause();
  };

  const artworkUrl = song.artworkUrl || song.artwork || song.cover;

  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="300" height="300" fill="#1a1a1a"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#ffffff" font-size="24" font-family="Arial">No Cover</text>
      </svg>`
    );

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: "100%",
        maxWidth: (theme) => ({
          xs: theme.customSizes?.musicCard?.xs ?? 140,
          sm: theme.customSizes?.musicCard?.sm ?? 160,
          md: theme.customSizes?.musicCard?.md ?? 180,
          lg: theme.customSizes?.musicCard?.lg ?? 200,
        }),
      }}
    >
      {/* Image Card (same hover behavior as SongCard) */}
      <Card

   onClick={(e) => {
  if (e?.stopPropagation) e.stopPropagation();
  
  // Custom artist handler
  if (typeof onOpenArtist === 'function') {
    onOpenArtist(song);
    return;
  }
  
  // Navigate to song page within album context, passing song data
  if (song?.albumId && (song?.id || song?._id)) {
    navigate(`/album/${song.albumId}/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Fallback: standalone song page
  if (song?.id || song?._id) {
    navigate(`/song/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Last resort: artist page
  const artistId = song?.artistId || song?.artist?._id;
  if (artistId) {
    navigate(`/artist/${artistId}`);
  }
}}
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 3,
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          position: "relative",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
            "& .compact-play-button": {
              opacity: 1,
              transform: "translateY(0)",
            },
            "& .compact-hover-overlay": {
              opacity: 1,
            },
            // show likes container on hover
            "& .compact-likes-wrap": {
              opacity: 1,
            },
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Box
            component="img"
            width="100%"
            height="100%"
            loading={imgLoading}
            src={artworkUrl || FALLBACK}
            alt={song.title}
            sx={{ objectFit: "cover", objectPosition: "center" }}
            onError={(e) => {
              e.target.src = FALLBACK;
            }}
          />

          {/* Now Playing Label (kept compact) */}
          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#E4C421",
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                backdropFilter: "blur(4px)",
                zIndex: 2,
              }}
            >
              Now Playing
            </Typography>
          )}

          {/* Like button (appears on hover; stays clickable) */}
          <Box
            className="compact-likes-wrap"
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 3,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderRadius: "999px",
              px: 0.5,
              py: 0.25,
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <LikesComponent song={song} currentUserId={currentUserId} size="small" />
          </Box>

          {/* Play/Pause Button - same reveal style as SongCard */}
          <IconButton
            className="compact-play-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayAttempt(e);
            }}
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#E4C421",
              width: { xs: 34, sm: 38, md: 42 },
              height: { xs: 34, sm: 38, md: 42 },
              "&:hover": {
                backgroundColor: "#F8D347",
                transform: "scale(1.1) !important",
              },
              transition: "all 0.2s ease",
              opacity: isPlayingThisSong ? 1 : 0,
              transform: isPlayingThisSong ? "translateY(0)" : "translateY(8px)",
              zIndex: 2,
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: "#000", fontSize: { xs: "1.1rem", sm: "1.25rem" } }} />
            ) : (
              <PlayArrow sx={{ color: "#000", fontSize: { xs: "1.1rem", sm: "1.25rem" } }} />
            )}
          </IconButton>

          {/* Hover overlay */}
          <Box
            className="compact-hover-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
          />
        </Box>
      </Card>

      {/* Info Underneath (same spacing style as SongCard, but compact typography) */}
      <Box sx={{ mt: 2, px: 0.5, width: "100%" }}>
        {/* Title with same marquee behavior as SongCard */}
        <Box
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          sx={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "1.6em",
          }}
        >
          {!isTitleHovered && (
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "bold",
                color: "white",
                lineHeight: 1.3,
                fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={song.title}
            >
              {song.title}
            </Typography>
          )}

          {isTitleHovered && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                willChange: "transform",
                animation: "compactTitleMarquee 10s linear infinite",
                "@keyframes compactTitleMarquee": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                  pr: 4,
                }}
              >
                {song.title}
              </Typography>
              <Typography
                variant="subtitle2"
                aria-hidden="true"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                  pr: 4,
                }}
              >
                {song.title}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Artist + Likes row (compact) */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography
            variant="body2"
            onClick={(e) => {
              e.stopPropagation();
              const artistId = song?.artistId || song?.artist?._id || song?.artist;
              if (artistId) navigate(`/artist/${artistId}`);
            }}
            sx={{
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              cursor: "pointer",
              flex: 1,
              minWidth: 0,
              mr: 1,
              "&:hover": { color: "#E4C421", textDecoration: "underline" },
            }}
          >
            {getArtistDisplayName(song)}
          </Typography>

          {/* keep LikesComponent here too if you want it always visible under card */}
          <Box sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}>
            <LikesComponent song={song} currentUserId={currentUserId} size="small" />
          </Box>
        </Box>

        {/* Plays & Duration */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#E4C421",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500,
            }}
          >
            {song.plays?.toLocaleString?.() || 0} plays
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            {song.duration || "0:00"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}






// hero
// -----

export function SongCardHero({
  song,
  isPlayingThisSong,
  onPlayPause,
  onOpenArtist,

  // optional overrides object (kept for backward compatibility)
  heroProps,

  // defaults
  imgLoading = "lazy",
  imgDecoding = "async",
  imgFetchPriority = "auto",
  heroVariant = false,
}) {
  const navigate = useNavigate();
  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  const { isAdPlaying } = useAudioPlayer();
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const handlePlayAttempt = (e) => {
    e?.stopPropagation?.();
    if (isAdPlaying) {
      try {
        eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
          message: "Playback will resume after the advertisement finishes.",
        });
      } catch {}
      return;
    }
    onPlayPause?.();
  };

  const artworkUrl = song?.artworkUrl || song?.artwork || song?.cover || null;

  // ✅ Merge defaults + overrides (heroProps wins)
  const mergedImg = {
    loading: heroProps?.imgLoading ?? imgLoading,
    decoding: heroProps?.imgDecoding ?? imgDecoding,
    fetchpriority: heroProps?.imgFetchPriority ?? imgFetchPriority,
  };

  const FALLBACK_SVG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='300' height='300' fill='%231a1a1a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='24' font-family='Arial'>No Cover</text></svg>";

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: (theme) => ({
          xs: theme.customSizes?.musicCard?.xs ?? 140,
          sm: theme.customSizes?.musicCard?.sm ?? 160,
          md: theme.customSizes?.musicCard?.md ?? 180,
          lg: theme.customSizes?.musicCard?.lg ?? 200,
        }),
      }}
    >
      <Card
        onClick={(e) => {
          e?.stopPropagation?.();

          // Custom handler
          if (typeof onOpenArtist === "function") {
            onOpenArtist(song);
            return;
          }

          // Navigate to album-song
          if (song?.albumId && (song?.id || song?._id)) {
            navigate(`/album/${song.albumId}/${song.id || song._id}`, {
              state: { song },
            });
            return;
          }

          // Navigate to song
          if (song?.id || song?._id) {
            navigate(`/song/${song.id || song._id}`, { state: { song } });
            return;
          }

          // Fallback: artist
          const artistId = song?.artistId || song?.artist?._id;
          if (artistId) navigate(`/artist/${artistId}`);
        }}
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 3,
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          position: "relative",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
            "& .play-button": {
              opacity: 1,
              transform: "translateY(0)",
            },
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Box
            component="img"
            width="100%"
            height="100%"
            loading={mergedImg.loading}
            decoding={mergedImg.decoding}
            fetchpriority={mergedImg.fetchpriority}
            src={artworkUrl || FALLBACK_SVG}
            alt={song?.title || "Song artwork"}
            sx={{ objectFit: "cover", objectPosition: "center" }}
            onError={(e) => {
              // prevent infinite loop if fallback fails
              if (e?.currentTarget?.src !== FALLBACK_SVG) {
                e.currentTarget.src = FALLBACK_SVG;
              }
            }}
          />

          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#E4C421",
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                backdropFilter: "blur(4px)",
                zIndex: 2,
              }}
            >
              Now Playing
            </Typography>
          )}

          <IconButton
            className="play-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayAttempt(e);
            }}
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#E4C421",
              width: { xs: 36, sm: 40, md: 44 },
              height: { xs: 36, sm: 40, md: 44 },
              "&:hover": {
                backgroundColor: "#F8D347",
                transform: "scale(1.1) !important",
              },
              transition: "all 0.2s ease",
              opacity: isPlayingThisSong ? 1 : 0,
              transform: isPlayingThisSong ? "translateY(0)" : "translateY(8px)",
              zIndex: 2,
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: "#000", fontSize: { xs: "1.2rem", sm: "1.4rem" } }} />
            ) : (
              <PlayArrow sx={{ color: "#000", fontSize: { xs: "1.2rem", sm: "1.4rem" } }} />
            )}
          </IconButton>

          <Box
            className="hover-overlay"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              opacity: 0,
              transition: "opacity 0.2s ease",
              pointerEvents: "none",
              ".MuiCard-root:hover &": { opacity: 1 },
            }}
          />
        </Box>
      </Card>

      {/* Info under card */}
      <Box
        sx={{
          mt: 2,
          px: 0.5,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title marquee */}
        <Box
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          sx={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "1.8em",
          }}
        >
          {!isTitleHovered && (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                color: "white",
                lineHeight: 1.4,
                fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={song?.title || ""}
            >
              {song?.title || "Untitled"}
            </Typography>
          )}

          {isTitleHovered && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                willChange: "transform",
                animation: "titleMarquee 10s linear infinite",
                "@keyframes titleMarquee": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.4,
                  fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
                  pr: 4,
                }}
              >
                {song?.title || "Untitled"}
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.4,
                  fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
                  pr: 4,
                }}
                aria-hidden="true"
              >
                {song?.title || "Untitled"}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Artist + likes */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography
            variant="body1"
            onClick={(e) => {
              e.stopPropagation();
              const artistId = song?.artistId || song?.artist?._id || song?.artist;
              if (artistId) navigate(`/artist/${artistId}`);
            }}
            sx={{
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: "1rem", sm: "1.1rem", md: "1.3rem" },
              cursor: "pointer",
              flex: 1,
              minWidth: 0,
              mr: 1,
              "&:hover": { color: "#E4C421", textDecoration: "underline" },
            }}
          >
            {getArtistDisplayName(song)}
          </Typography>

          <Box sx={{ flexShrink: 0 }}>
            <LikesComponent song={song} currentUserId={userId} />
          </Box>
        </Box>

        {/* Plays + duration */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#E4C421",
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500,
            }}
          >
            {song?.plays?.toLocaleString?.() || 0} plays
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" },
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            {song?.duration || "0:00"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}


export function CompactSongCardHero({
  song,
  isPlayingThisSong = false,
  onPlayPause = () => {},
  currentUserId,
  onOpenArtist,
  imgLoading = 'eager',
  imgDecoding = 'async',
  imgFetchPriority = 'auto',
}) {
  const navigate = useNavigate();
  const { isAdPlaying } = useAudioPlayer();

  // Title hover state (same behavior as SongCard)
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const handlePlayAttempt = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (isAdPlaying) {
      try {
        eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
          message: "Playback will resume after the advertisement finishes.",
        });
      } catch {}
      return;
    }
    onPlayPause();
  };

  const artworkUrl = song.artworkUrl || song.artwork || song.cover;

  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="300" height="300" fill="#1a1a1a"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#ffffff" font-size="24" font-family="Arial">No Cover</text>
      </svg>`
    );

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: "100%",
        maxWidth: (theme) => ({
          xs: theme.customSizes?.musicCard?.xs ?? 140,
          sm: theme.customSizes?.musicCard?.sm ?? 160,
          md: theme.customSizes?.musicCard?.md ?? 180,
          lg: theme.customSizes?.musicCard?.lg ?? 200,
        }),
      }}
    >
      {/* Image Card (same hover behavior as SongCard) */}
      <Card

   onClick={(e) => {
  if (e?.stopPropagation) e.stopPropagation();
  
  // Custom artist handler
  if (typeof onOpenArtist === 'function') {
    onOpenArtist(song);
    return;
  }
  
  // Navigate to song page within album context, passing song data
  if (song?.albumId && (song?.id || song?._id)) {
    navigate(`/album/${song.albumId}/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Fallback: standalone song page
  if (song?.id || song?._id) {
    navigate(`/song/${song.id || song._id}`, { 
      state: { song } 
    });
    return;
  }
  
  // Last resort: artist page
  const artistId = song?.artistId || song?.artist?._id;
  if (artistId) {
    navigate(`/artist/${artistId}`);
  }
}}
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 3,
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          position: "relative",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
            "& .compact-play-button": {
              opacity: 1,
              transform: "translateY(0)",
            },
            "& .compact-hover-overlay": {
              opacity: 1,
            },
            // show likes container on hover
            "& .compact-likes-wrap": {
              opacity: 1,
            },
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Box
            component="img"
            width="100%"
            height="100%"
            loading={imgLoading}
            decoding={imgDecoding}
            fetchpriority={imgFetchPriority}
            src={artworkUrl || FALLBACK}
            alt={song.title}
            sx={{ objectFit: "cover", objectPosition: "center" }}
            onError={(e) => {
              e.target.src = FALLBACK;
            }}
          />

          {/* Now Playing Label (kept compact) */}
          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#E4C421",
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                backdropFilter: "blur(4px)",
                zIndex: 2,
              }}
            >
              Now Playing
            </Typography>
          )}

          {/* Like button (appears on hover; stays clickable) */}
          <Box
            className="compact-likes-wrap"
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 3,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderRadius: "999px",
              px: 0.5,
              py: 0.25,
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <LikesComponent song={song} currentUserId={currentUserId} size="small" />
          </Box>

          {/* Play/Pause Button - same reveal style as SongCard */}
          <IconButton
            className="compact-play-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayAttempt(e);
            }}
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#E4C421",
              width: { xs: 34, sm: 38, md: 42 },
              height: { xs: 34, sm: 38, md: 42 },
              "&:hover": {
                backgroundColor: "#F8D347",
                transform: "scale(1.1) !important",
              },
              transition: "all 0.2s ease",
              opacity: isPlayingThisSong ? 1 : 0,
              transform: isPlayingThisSong ? "translateY(0)" : "translateY(8px)",
              zIndex: 2,
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: "#000", fontSize: { xs: "1.1rem", sm: "1.25rem" } }} />
            ) : (
              <PlayArrow sx={{ color: "#000", fontSize: { xs: "1.1rem", sm: "1.25rem" } }} />
            )}
          </IconButton>

          {/* Hover overlay */}
          <Box
            className="compact-hover-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
          />
        </Box>
      </Card>

      {/* Info Underneath (same spacing style as SongCard, but compact typography) */}
      <Box sx={{ mt: 2, px: 0.5, width: "100%" }}>
        {/* Title with same marquee behavior as SongCard */}
        <Box
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          sx={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "1.6em",
          }}
        >
          {!isTitleHovered && (
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "bold",
                color: "white",
                lineHeight: 1.3,
                fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={song.title}
            >
              {song.title}
            </Typography>
          )}

          {isTitleHovered && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                willChange: "transform",
                animation: "compactTitleMarquee 10s linear infinite",
                "@keyframes compactTitleMarquee": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                  pr: 4,
                }}
              >
                {song.title}
              </Typography>
              <Typography
                variant="subtitle2"
                aria-hidden="true"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
                  pr: 4,
                }}
              >
                {song.title}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Artist + Likes row (compact) */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography
            variant="body2"
            onClick={(e) => {
              e.stopPropagation();
              const artistId = song?.artistId || song?.artist?._id || song?.artist;
              if (artistId) navigate(`/artist/${artistId}`);
            }}
            sx={{
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              cursor: "pointer",
              flex: 1,
              minWidth: 0,
              mr: 1,
              "&:hover": { color: "#E4C421", textDecoration: "underline" },
            }}
          >
            {getArtistDisplayName(song)}
          </Typography>

          {/* keep LikesComponent here too if you want it always visible under card */}
          <Box sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}>
            <LikesComponent song={song} currentUserId={currentUserId} size="small" />
          </Box>
        </Box>

        {/* Plays & Duration */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#E4C421",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500,
            }}
          >
            {song.plays?.toLocaleString?.() || 0} plays
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            {song.duration || "0:00"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
