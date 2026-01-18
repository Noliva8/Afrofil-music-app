import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { SEARCH_CATALOG } from "../utils/queries";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../utils/mutations";
import {
  getFullKeyFromUrlOrKey,
  useSongsWithPresignedUrls,
} from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";

function SectionHeader({ title, subtitle }) {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 900, color: theme.palette.text.primary }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const rawQuery = (params.query || searchParams.get("q") || "").trim();

  const { data, loading, error } = useQuery(SEARCH_CATALOG, {
    variables: { query: rawQuery, limit: 12 },
    skip: !rawQuery,
  });

  const songs = data?.searchCatalog?.songs ?? [];
  const artists = data?.searchCatalog?.artists ?? [];
  const albums = data?.searchCatalog?.albums ?? [];

  const { songsWithArtwork, loading: presignLoading } = useSongsWithPresignedUrls(
    songs
  );

  const displaySongs = useMemo(
    () => processSongs(songsWithArtwork),
    [songsWithArtwork]
  );

  const normalizedQuery = useMemo(() => rawQuery.toLowerCase(), [rawQuery]);
  const queryTokens = useMemo(() => {
    const stop = new Set(["by", "feat", "ft", "featuring", "the", "a", "an"]);
    return normalizedQuery
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !stop.has(token));
  }, [normalizedQuery]);

  const filteredSongs = useMemo(() => {
    if (!normalizedQuery) return displaySongs;
    return (displaySongs || []).filter((song) => {
      const haystack = [
        song.title,
        song.artistName,
        song.albumName,
        song.genre,
        song.mood,
        song.subMood,
        song.label,
        ...(song.producer || []).map((p) => p?.name),
        ...(song.composer || []).map((c) => c?.name),
        ...(song.featuringArtist || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!queryTokens.length) return haystack.includes(normalizedQuery);
      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [displaySongs, normalizedQuery, queryTokens]);

  const filteredArtists = useMemo(() => {
    if (!normalizedQuery) return artists;
    return (artists || []).filter((artist) => {
      const haystack = [
        artist.artistAka,
        artist.fullName,
        artist.country,
        artist.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!queryTokens.length) return haystack.includes(normalizedQuery);
      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [artists, normalizedQuery, queryTokens]);

  const filteredAlbums = useMemo(() => {
    if (!normalizedQuery) return albums;
    return (albums || []).filter((album) => {
      const haystack = [
        album.title,
        album.artist?.artistAka,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!queryTokens.length) return haystack.includes(normalizedQuery);
      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [albums, normalizedQuery, queryTokens]);

  const [activeTab, setActiveTab] = useState("top");
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [artistImages, setArtistImages] = useState({});
  const [albumImages, setAlbumImages] = useState({});
  const artistSignatureRef = useRef("");
  const albumSignatureRef = useRef("");

  const artistIdsSignature = useMemo(() => {
    return filteredArtists
      .map((artist) => String(artist?._id || ""))
      .filter(Boolean)
      .sort()
      .join("|");
  }, [filteredArtists]);

  const albumIdsSignature = useMemo(() => {
    return filteredAlbums
      .map((album) => String(album?._id || ""))
      .filter(Boolean)
      .sort()
      .join("|");
  }, [filteredAlbums]);

  useEffect(() => {
    if (artistIdsSignature === artistSignatureRef.current) return;
    artistSignatureRef.current = artistIdsSignature;

    if (!filteredArtists.length) {
      setArtistImages((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    let alive = true;
    const presign = async () => {
      const entries = await Promise.all(
        filteredArtists.map(async (artist) => {
          const raw = artist?.profileImage;
          const key = raw ? getFullKeyFromUrlOrKey(raw) : null;
          if (!key) return null;
          try {
            const { data: resp } = await getPresignedUrlDownload({
              variables: {
                bucket: "afrofeel-profile-picture",
                key,
                region: "us-west-2",
                expiresIn: 604800,
              },
            });
            const url = resp?.getPresignedUrlDownload?.url;
            if (!url) return null;
            return [String(artist._id), url];
          } catch {
            return null;
          }
        })
      );

      if (!alive) return;
      setArtistImages(Object.fromEntries(entries.filter(Boolean)));
    };

    presign();
    return () => {
      alive = false;
    };
  }, [artistIdsSignature, filteredArtists, getPresignedUrlDownload]);

  useEffect(() => {
    if (albumIdsSignature === albumSignatureRef.current) return;
    albumSignatureRef.current = albumIdsSignature;

    if (!filteredAlbums.length) {
      setAlbumImages((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    let alive = true;
    const presign = async () => {
      const entries = await Promise.all(
        filteredAlbums.map(async (album) => {
          const raw = album?.albumCoverImage;
          const key = raw ? getFullKeyFromUrlOrKey(raw) : null;
          if (!key) return null;
          try {
            const { data: resp } = await getPresignedUrlDownload({
              variables: {
                bucket: "afrofeel-cover-images-for-songs",
                key,
                region: "us-east-2",
                expiresIn: 604800,
              },
            });
            const url = resp?.getPresignedUrlDownload?.url;
            if (!url) return null;
            return [String(album._id), url];
          } catch {
            return null;
          }
        })
      );

      if (!alive) return;
      setAlbumImages(Object.fromEntries(entries.filter(Boolean)));
    };

    presign();
    return () => {
      alive = false;
    };
  }, [albumIdsSignature, filteredAlbums, getPresignedUrlDownload]);

  const isEmpty =
    rawQuery &&
    !loading &&
    !presignLoading &&
    !filteredSongs.length &&
    !filteredArtists.length &&
    !filteredAlbums.length;

  const topProducers = useMemo(() => {
    const countMap = new Map();
    (filteredSongs || []).forEach((song) => {
      (song?.producer || []).forEach((producer) => {
        const name = producer?.name?.trim();
        if (!name) return;
        countMap.set(name, (countMap.get(name) || 0) + 1);
      });
    });
    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [filteredSongs]);

  const topComposers = useMemo(() => {
    const countMap = new Map();
    (filteredSongs || []).forEach((song) => {
      (song?.composer || []).forEach((composer) => {
        const name = composer?.name?.trim();
        if (!name) return;
        countMap.set(name, (countMap.get(name) || 0) + 1);
      });
    });
    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [filteredSongs]);

  const tabCounts = useMemo(() => {
    return {
      top: filteredSongs.length + filteredArtists.length + filteredAlbums.length + topProducers.length + topComposers.length,
      songs: filteredSongs.length,
      artists: filteredArtists.length,
      albums: filteredAlbums.length,
      producers: topProducers.length,
      composers: topComposers.length,
    };
  }, [filteredAlbums.length, filteredArtists.length, filteredSongs.length, topComposers.length, topProducers.length]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.85
        )} 100%)`,
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Search
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            {rawQuery ? `Results for "${rawQuery}"` : "Start typing to discover songs, artists, and albums."}
          </Typography>
        </Box>

        {rawQuery && (
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  alignItems: "flex-start",
                },
              }}
            >
              <Tab value="top" label={`Top search (${tabCounts.top})`} />
              <Tab value="songs" label={`Songs (${tabCounts.songs})`} />
              <Tab value="artists" label={`Artists (${tabCounts.artists})`} />
              <Tab value="albums" label={`Albums (${tabCounts.albums})`} />
              <Tab value="producers" label={`Producers (${tabCounts.producers})`} />
              <Tab value="composers" label={`Composers (${tabCounts.composers})`} />
            </Tabs>
          </Box>
        )}

        {!rawQuery && (
          <Card
            sx={{
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.divider, 0.35)}`,
              background: alpha(theme.palette.background.paper, 0.6),
              p: 3,
            }}
          >
            <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              Use the search bar to find songs, artists, and albums across Afrofeel.
            </Typography>
          </Card>
        )}

        {rawQuery && loading && (
          <Typography sx={{ color: theme.palette.text.secondary }}>
            Searching...
          </Typography>
        )}

        {rawQuery && error && (
          <Typography sx={{ color: theme.palette.error.main }}>
            Search failed. Please try again.
          </Typography>
        )}

        {isEmpty && (
          <Typography sx={{ color: theme.palette.text.secondary }}>
            No results found. Try a different search.
          </Typography>
        )}

        {(activeTab === "top" || activeTab === "songs") && filteredSongs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <SectionHeader
              title="Songs"
              subtitle="Top matches from the catalog"
            />
            <Stack spacing={2}>
              {filteredSongs.map((song) => {
                const albumId = song.albumId || song.album?._id;
                const songLink = albumId
                  ? `/album/${albumId}/${song.id}`
                  : `/song/${song.id}`;

                return (
                  <Card
                    key={song.id}
                    onClick={() => navigate(songLink)}
                    sx={{
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 12px 28px ${alpha(
                          theme.palette.common.black,
                          0.18
                        )}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          variant="rounded"
                          src={song.artworkUrl || ""}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800 }}
                            noWrap
                          >
                            {song.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary }}
                            noWrap
                          >
                            {song.artistName || "Unknown Artist"} • {song.albumName}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {song.duration}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {(activeTab === "top" || activeTab === "artists") && filteredArtists.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <SectionHeader
              title="Artists"
              subtitle="Creators matching your search"
            />
            <Grid container spacing={2}>
              {filteredArtists.map((artist) => (
                <Grid key={artist._id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    onClick={() => navigate(`/artist/${artist._id}`)}
                    sx={{
                      borderRadius: 3,
                      cursor: "pointer",
                      height: "100%",
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 12px 28px ${alpha(
                          theme.palette.common.black,
                          0.18
                        )}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={1.5} alignItems="center">
                        <Avatar
                          src={artistImages[artist._id] || ""}
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        >
                          {(artist.artistAka || artist.fullName || "A")
                            .slice(0, 1)
                            .toUpperCase()}
                        </Avatar>
                        <Box sx={{ textAlign: "center", minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                            {artist.artistAka || artist.fullName || "Unknown Artist"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }} noWrap>
                            {artist.country || artist.region || "Africa"}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {(activeTab === "top" || activeTab === "albums") && filteredAlbums.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <SectionHeader
              title="Albums"
              subtitle="Full projects matching your search"
            />
            <Grid container spacing={2}>
              {filteredAlbums.map((album) => (
                <Grid key={album._id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    onClick={() => navigate(`/album/${album._id}`)}
                    sx={{
                      borderRadius: 3,
                      cursor: "pointer",
                      height: "100%",
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 12px 28px ${alpha(
                          theme.palette.common.black,
                          0.18
                        )}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={1.5}>
                        <Avatar
                          variant="rounded"
                          src={albumImages[album._id] || ""}
                          sx={{
                            width: "100%",
                            height: 160,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                            {album.title || "Untitled Album"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }} noWrap>
                            {album.artist?.artistAka || "Unknown Artist"}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {(activeTab === "top" || activeTab === "producers") && topProducers.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <SectionHeader
              title="Producers"
              subtitle="Most common producer credits in the results"
            />
            <Grid container spacing={2}>
              {topProducers.map((producer) => (
                <Grid key={producer.name} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      height: "100%",
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                          {producer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {producer.count} credits
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {(activeTab === "top" || activeTab === "composers") && topComposers.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <SectionHeader
              title="Composers"
              subtitle="Most common composer credits in the results"
            />
            <Grid container spacing={2}>
              {topComposers.map((composer) => (
                <Grid key={composer.name} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      height: "100%",
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
                          {composer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {composer.count} credits
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
