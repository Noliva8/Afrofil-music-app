import crypto from "crypto";
import { Song } from "../../../models/Artist/index_artist.js";
import { trendIndexZSet } from "../Redis/keys.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

const parseDurationToSeconds = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) return 0;
    if (cleaned.includes(":")) {
      const [minutes, seconds] = cleaned.split(":");
      const mins = Number(minutes) || 0;
      const secs = Number(seconds) || 0;
      const total = mins * 60 + secs;
      return Number.isFinite(total) ? total : 0;
    }
    const parsed = Number(cleaned.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const buildProcessedSong = (song) => {
  if (!song) return null;
  const moodArray = ensureArray(song.mood);
  const subMoodArray = ensureArray(song.subMoods);
  const releaseYear = song.album?.releaseDate
    ? new Date(song.album.releaseDate).getFullYear()
    : song.albumReleaseYear || "";
  const composerList = ensureArray(song.composer).map((item) =>
    typeof item === "string" ? item : item?.name || ""
  ).filter(Boolean);
  const producerList = ensureArray(song.producer).map((item) =>
    typeof item === "string" ? item : item?.name || ""
  ).filter(Boolean);
  const creditsList = composerList
    .map((name) => `Composer: ${name}`)
    .concat(producerList.map((name) => `Producer: ${name}`));
  const durationSecondsValue = Math.round(
    parseDurationToSeconds(song.duration ?? song.durationSeconds)
  );
  const artist = song.artist || {};
  const albumId = song.album?._id || song.albumId || song.album || "";
  const safeId = String(song._id ?? song.id ?? song.songId ?? crypto.randomUUID());

  return {
    id: safeId,
    title: song.title || "",
    artistAka: artist.artistAka || "",
    artistId: String(artist._id || artist.id || artist || ""),
    artistBio: artist.bio || "",
    country: artist.country || "",
    albumId: String(albumId || ""),
    albumTitle: song.album?.title || song.albumTitle || "Single",
    albumReleaseYear: releaseYear ? String(releaseYear) : "",
    genre: song.genre || "",
    mood: moodArray.join(", "),
    subMood: subMoodArray.join(", "),
    plays: Number(song.playCount ?? 0),
    downloadCount: Number(song.downloadCount ?? 0),
    artistFollowers: Array.isArray(artist.followers) ? artist.followers.length : 0,
    artistDownloadCounts: Number(artist.artistDownloadCounts || 0),
    playCount: Number(song.playCount ?? 0),
    shareCount: Number(song.shareCount ?? 0),
    likesCount: Number(song.likesCount ?? song.likedByUsers?.length ?? 0),
    likedByMe: Boolean(song.likedByMe),
    durationSeconds:
      Number.isFinite(durationSecondsValue) && durationSecondsValue >= 0
        ? durationSecondsValue
        : 0,
    artworkKey: song.artworkKey || song.artwork || "",
    artworkBlur: song.artworkBlur || song.artworkBlurHash || "",
    artworkColor: song.artworkColor || "",
    profilePictureKey: artist.profileImage || "",
    coverImageKey: song.coverImage || artist.coverImage || "",
    albumCoverImageKey: song.album?.albumCoverImage || "",
    streamAudioFileKey: song.audioStreamKey || song.streamAudioFileUrl || "",
    audioUrl: song.audioUrl || song.streamAudioFileUrl || "",
    streamAudioFileUrl: song.streamAudioFileUrl || "",
    artwork: song.artworkKey || "",
    coverImage: song.coverImage || artist.coverImage || "",
    lyrics: song.lyrics || "",
    credits: creditsList.join(", "),
    label: song.label || "",
    featuringArtist: ensureArray(song.featuringArtist).map((item) =>
      typeof item === "string" ? item : item?.artistAka || item?.name || ""
    ).filter(Boolean),
    composer: composerList,
    producer: producerList,
  };
};

const enrichSongDocument = (song) => {
  if (!song) return null;
  return {
    ...song,
    artistFollowers: Array.isArray(song.artist?.followers) ? song.artist.followers.length : 0,
    mood: ensureArray(song.mood),
    subMoods: ensureArray(song.subMoods),
    composer: ensureArray(song.composer),
    producer: ensureArray(song.producer),
    likesCount: song.likedByUsers?.length || song.likesCount || 0,
    downloadCount: song.downloadCount || 0,
    playCount: song.playCount || 0,
    shareCount: song.shareCount || 0,
    artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
  };
};

const MAX_TRENDING_LIMIT = 50;

const fetchTrendingSongDocs = async (limit = 20) => {
  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.min(Math.max(Math.floor(limit), 1), MAX_TRENDING_LIMIT)
      : 20;

  const client = await getRedis();
  const trendingSongIds = await client.zRange(trendIndexZSet, 0, safeLimit - 1, { REV: true });
  const orderedIds = trendingSongIds.filter(Boolean);

  let orderedSongs = [];
  if (orderedIds.length) {
    const songs = await Song.find({ _id: { $in: orderedIds } })
      .populate({ path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' })
      .populate({ path: 'album', select: 'title releaseDate albumCoverImage' })
      .lean();

    const songMap = new Map(songs.map((song) => [String(song._id), song]));
    orderedSongs = orderedIds
      .map((id) => songMap.get(id))
      .filter(Boolean)
      .map(enrichSongDocument);
  }

  const existingIds = new Set(orderedSongs.map((song) => String(song._id ?? song.id ?? song.songId ?? "")));
  if (orderedSongs.length >= safeLimit) {
    return orderedSongs.slice(0, safeLimit);
  }

  const remaining = safeLimit - orderedSongs.length;
  const fallbackQuery = existingIds.size
    ? { _id: { $nin: Array.from(existingIds) } }
    : {};

  const fallbackSongs = await Song.find(fallbackQuery)
    .sort({ trendingScore: -1, createdAt: -1 })
    .limit(remaining)
    .populate({ path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' })
    .populate({ path: 'album', select: 'title releaseDate albumCoverImage' })
    .lean();

  if (fallbackSongs.length) {
    const commands = fallbackSongs
      .filter((song) => !orderedIds.includes(String(song._id)))
      .map((song) => ({ score: song.trendingScore || 1000, value: String(song._id) }));
    if (commands.length) {
      client.zAdd(trendIndexZSet, commands).catch(() => {});
    }
  }

  const enrichedFallback = fallbackSongs.map(enrichSongDocument).filter(Boolean);
  return [...orderedSongs, ...enrichedFallback].slice(0, safeLimit);
};

export const trendingSongs = async (_parent, { limit }) => fetchTrendingSongDocs(limit);



export const processedTrendingSongs = async () => {
  const songs = await fetchTrendingSongDocs();
  return songs.map(buildProcessedSong).filter(Boolean);
};
