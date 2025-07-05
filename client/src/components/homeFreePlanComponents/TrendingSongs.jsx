import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import { PlayArrow, Pause } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import { Button } from "@mui/material";

export default function TrendingSongs({
  songsWithArtwork,
  playingSongId,
  onSongPlay,
  isPlaying,
  nowPlaying
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const trendingSongs =
    songsWithArtwork?.map((song) => ({
      id: song._id, // ✅ make this consistent with nowPlaying.songId
      title: song.title,
      artistName: song.artist?.artistAka || "Unknown Artist",
      country: song.artist?.country || "",
      plays: song.playCount || 0,
      likesCount: song.likedByUsers?.length || 0,
      duration: formatDuration(song.duration || 0),
      cover: song.artworkUrl || song.artwork || "https://via.placeholder.com/300x300?text=No+Cover",
      genre: song.genre,
      audioUrl: song.audioUrl,
      fullOriginal: song,
    })) || [];

  const sortedTrendingSongs = [...trendingSongs]
    .sort((a, b) => (b.trendingScore || b.plays) - (a.trendingScore || a.plays))
    .slice(0, 20);

  return (
    <>
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 800,
          textAlign: "center",
          fontSize: { xs: "1.8rem", md: "2.5rem" },
          background: "linear-gradient(90deg, #E4C421, #B25035)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        🔥 Trending Now
      </Typography>

      <Grid2 container spacing={4} justifyContent="center" sx={{ mb: 8 }}>
        {sortedTrendingSongs.map((song) => {
          const isCurrent = nowPlaying.songId === song.id;
          const isPlayingThisSong = isCurrent && nowPlaying.isPlaying;

          return (
            <Grid2
              key={song.id}
              xs={12}
              sm={6}
              md={4}
              lg={3}
              xl={2.4}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Card
                sx={{
                  width: "100%",
                  maxWidth: 300,
                  height: 380,
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
                  },
                }}
              >
                {/* Image */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src={song.cover}
                    alt={song.title}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x300?text=No+Cover&font=roboto";
                    }}
                  />

                  {isPlayingThisSong && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 12,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "#E4C421",
                        fontWeight: 600,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: "0.7rem",
                        zIndex: 1,
                      }}
                    >
                      Now Playing
                    </Typography>
                  )}

                  <IconButton
                    onClick={() => onSongPlay(song.fullOriginal)}
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      backgroundColor: "#E4C421",
                      "&:hover": {
                        backgroundColor: "#F8D347",
                      },
                      zIndex: 1,
                    }}
                  >
                    {isPlayingThisSong ? (
                      <Pause sx={{ color: "#000", fontSize: "1.5rem" }} />
                    ) : (
                      <PlayArrow sx={{ color: "#000", fontSize: "1.5rem" }} />
                    )}
                  </IconButton>
                </Box>

                {/* Text Content */}
                <CardContent
                  sx={{
                    flexGrow: 1,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        color: "white",
                        mb: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "1rem",
                      }}
                    >
                      {song.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        mb: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "0.85rem",
                      }}
                    >
                      {song.artistName}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      {song.country && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.7rem",
                          }}
                        >
                          {song.country}
                        </Typography>
                      )}
                      {song.genre && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.7rem",
                          }}
                        >
                          • {song.genre}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: "auto",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#E4C421",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    >
                      {song.plays.toLocaleString()} plays
                    </Typography>

                    <Button
                      variant="text"
                      size="small"
                      sx={{
                        color: "#E4C421",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        minWidth: 0,
                        p: 0.5,
                      }}
                    >
                      {song.likesCount.toLocaleString()} ♥
                    </Button>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {song.duration}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
          );
        })}
      </Grid2>
    </>
  );
}
