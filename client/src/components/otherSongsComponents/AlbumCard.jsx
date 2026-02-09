import { useState } from "react";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useNavigate } from "react-router-dom";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="300" height="300" fill="#1a1a1a"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#ffffff" font-size="24" font-family="Arial">No Cover</text>
    </svg>`
  );

function getArtistName(album) {
  return (
    album?.artist?.artistAka ||
    album?.artist?.fullName ||
    album?.artistName ||
    "Unknown Artist"
  );
}

function getReleaseYear(album) {
  if (album?.releaseYear) return album.releaseYear;
  if (album?.releaseDate) {
    try {
      return new Date(album.releaseDate).getFullYear();
    } catch {}
  }
  return null;
}

export function AlbumCard({ album, albumCover, onOpenAlbum, onOpenArtist }) {
  const navigate = useNavigate();
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  if (!album) return null;

  const id = album._id || album.id;
  const title = album.title || "Untitled Album";
  const artistName = getArtistName(album);
  const releaseYear = getReleaseYear(album);

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
      <Card
        onClick={(e) => {
          if (e?.stopPropagation) e.stopPropagation();
          if (typeof onOpenAlbum === "function") {
            onOpenAlbum(album);
            return;
          }
          if (id) navigate(`/album/${id}`);
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
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Box
            component="img"
            src={albumCover || FALLBACK}
            alt={title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            onError={(e) => {
              e.target.src = FALLBACK;
            }}
          />

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
              "&:hover": {
                opacity: 1,
              },
            }}
          />
        </Box>
      </Card>

      <Box
        sx={{
          mt: 2,
          px: 0.5,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
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
              title={title}
            >
              {title}
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
                {title}
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
                {title}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          variant="body1"
          onClick={(e) => {
            if (e?.stopPropagation) e.stopPropagation();
            if (typeof onOpenArtist === "function") {
              onOpenArtist(album);
              return;
            }
            const artistId = album?.artist?._id || album?.artist?.id;
            if (artistId) navigate(`/artist/${artistId}`);
          }}
          sx={{
            color: "rgba(255,255,255,0.7)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: "1rem", sm: "1.1rem", md: "1.3rem" },
            cursor: "pointer",
            "&:hover": {
              color: "#E4C421",
              textDecoration: "underline",
            },
          }}
        >
          {artistName}
        </Typography>

        {releaseYear && (
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.55)",
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" },
              fontWeight: 500,
              mt: 0.25,
            }}
          >
            {releaseYear}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function CompactAlbumCard({ album, albumCover, onOpenAlbum, onOpenArtist }) {
  const navigate = useNavigate();
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  if (!album) return null;

  const id = album._id || album.id;
  const title = album.title || "Untitled Album";
  const artistName = getArtistName(album);
  const releaseYear = getReleaseYear(album);

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
      <Card
        onClick={(e) => {
          if (e?.stopPropagation) e.stopPropagation();
          if (typeof onOpenAlbum === "function") {
            onOpenAlbum(album);
            return;
          }
          if (id) navigate(`/album/${id}`);
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
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <Box
            component="img"
            src={albumCover || FALLBACK}
            alt={title}
            sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            onError={(e) => {
              e.target.src = FALLBACK;
            }}
          />

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
              "&:hover": {
                opacity: 1,
              },
            }}
          />
        </Box>
      </Card>

      <Box
        sx={{
          mt: 1.5,
          px: 0.5,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
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
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={title}
            >
              {title}
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
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  pr: 3,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.3,
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  pr: 3,
                }}
                aria-hidden="true"
              >
                {title}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          variant="body2"
          onClick={(e) => {
            if (e?.stopPropagation) e.stopPropagation();
            if (typeof onOpenArtist === "function") {
              onOpenArtist(album);
              return;
            }
            const artistId = album?.artist?._id || album?.artist?.id;
            if (artistId) navigate(`/artist/${artistId}`);
          }}
          sx={{
            color: "rgba(255,255,255,0.7)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: "0.9rem", sm: "1rem" },
            cursor: "pointer",
            "&:hover": {
              color: "#E4C421",
              textDecoration: "underline",
            },
          }}
        >
          {artistName}
        </Typography>

        {releaseYear && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.55)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            {releaseYear}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
