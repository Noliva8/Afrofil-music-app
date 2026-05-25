import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { alpha, useTheme } from "@mui/material/styles";

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

    (songsWithArtwork || []).forEach((song) => {
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
        current.plays += Number(song.playCount || song.plays || song.fullOriginal?.playCount || 0);
        map.set(key, current);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.plays - a.plays || b.tracks - a.tracks)
      .slice(0, 6);
  }, [songsWithArtwork]);

  if (!topProducers.length) {
    return (
      <Box component="section" sx={{ my: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          Top Producers
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          No producer data yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ my: 4 }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ mb: 1.5, px: { xs: 0.5, sm: 0 } }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          Top Producers
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          by plays
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,
          px: { xs: 0.5, sm: 0 },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {topProducers.map((producer, index) => (
          <Box
            key={producer.name}
            sx={{
              flex: "0 0 auto",
              width: { xs: 180, sm: 200 },
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.25,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.text.primary, 0.045),
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: index === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.22),
                color: index === 0 ? theme.palette.primary.contrastText : theme.palette.primary.main,
                fontSize: "0.9rem",
                fontWeight: 800,
              }}
            >
              {getInitials(producer.name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {producer.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {producer.tracks} tracks • {producer.plays.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
