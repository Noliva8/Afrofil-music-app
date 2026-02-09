import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid2 from "@mui/material/Grid2";
import Avatar from '@mui/material/Avatar';
import useTheme from '@mui/material/styles/useTheme';
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export default function TopProducer({ songsWithArtwork = [] }) {
  const theme = useTheme();

  const topProducers = useMemo(() => {
    const map = new Map();
    const songs = processSongs(songsWithArtwork);

    songs.forEach((song) => {
      const producers = Array.isArray(song.producer)
        ? song.producer
        : Array.isArray(song.fullOriginal?.producer)
          ? song.fullOriginal.producer
          : [];

      producers.forEach((producer) => {
        const name = typeof producer === "string" ? producer : producer?.name;
        if (!name) return;
        const key = name.trim().toLowerCase();
        if (!key) return;
        const current = map.get(key) || {
          name: name.trim(),
          tracks: 0,
          plays: 0,
        };
        current.tracks += 1;
        current.plays += Number(song.playCount || song.plays || 0);
        map.set(key, current);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.plays - a.plays || b.tracks - a.tracks)
      .slice(0, 5);
  }, [songsWithArtwork]);

  if (!topProducers.length) {
    return (
      <Grid2 size={{ xs: 12, md: 4 }}>
        <Typography
          variant="h5"
          sx={{ mb: 3, fontWeight: 600, color: "#ffffff" }}
        >
          🎛️ Top Producers
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 2, fontSize: "0.9rem" }}>
          Ranked by total plays and number of tracks across trending songs.
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
          No producer data yet.
        </Typography>
      </Grid2>
    );
  }

  return (
    <Grid2 size={{ xs: 12, md: 4 }}>
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: 600, color: "#ffffff" }}
      >
        🎛️ Top Producers
      </Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 2, fontSize: "0.9rem" }}>
        Ranked by total plays and number of tracks across trending songs.
      </Typography>

      {topProducers.map((producer) => (
        <Box
          key={producer.name}
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            p: 1.5,
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
          }}
        >
          <Avatar
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            {getInitials(producer.name)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {producer.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {producer.tracks} tracks • {producer.plays.toLocaleString()} plays
            </Typography>
          </Box>
        </Box>
      ))}
    </Grid2>
  );
}
