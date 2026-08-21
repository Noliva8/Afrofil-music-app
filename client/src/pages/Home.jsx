
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsSection from '../components/userComponents/Home/EventsSection';
import PromotedArtists from '../components/userComponents/Home/PromotedArtists';
import NowPlayingBar from '../components/userComponents/Home/NowPlayingBar';
import '../pages/CSS/CSS-HOME-FREE-PLAN/home.css';
import PremiumPromoModal from '../components/userComponents/Home/Premium/PremiumPromoModal';
import { SongsILike } from '../components/homeFreePlanComponents/SongsIlikeBlock';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useQuery } from '@apollo/client';
import {
  QUERY_DAILY_MIX,
  QUERY_RECENT_PLAYED,
   TRENDING_SONGS_PUBLICV2,
  NEW_UPLOADS_PUBLIC,
  SUGGESTED_SONGS_PUBLIC,
  SONG_OF_THE_WEEK_PUBLIC,
  SONGS_COMPETING_THIS_WEEK_PUBLIC,
  RADIO_STATIONS_PUBLIC,
} from '../utils/queries';
import { HORIZONTAL_LIMIT, COMPACT_LIMIT } from '../CommonSettings/songsRowNumberControl.js';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import RecommendedSongsRow from '../components/userComponents/Home/RecommendedSongsRow';
import SongOfTheWeek from '../components/homeFreePlanComponents/SongOfTheWeek';
import RadioStations from '../components/homeFreePlanComponents/RadioStations';
import { SongRowContainer } from '../components/otherSongsComponents/SongsRow';

import UserAuth from '../utils/auth';
import SongList from '../components/otherSongsComponents/ListSong.jsx';

// mui










// main Home
// --------





const Home = ({ upgradeToPremium }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loadDeferredHome, setLoadDeferredHome] = useState(false);

  // Checkout Visibility
  // ------------------
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => setLoadDeferredHome(true), { timeout: 1600 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => setLoadDeferredHome(true), 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const isMobile = windowWidth < 768;
  const togglePlay = () => setIsPlaying((prev) => !prev);

  const {
    data: dailyMixData,
    loading: dailyMixLoading,
    error: dailyMixError,
  } = useQuery(QUERY_DAILY_MIX, {
    variables: { limit: HORIZONTAL_LIMIT },
    skip: !loadDeferredHome,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { data: recentPlayedData, loading: recentPlayedLoading } = useQuery(
    QUERY_RECENT_PLAYED,
    {
      variables: { limit: 6 },
    },
  );

  const {
    data: trendingDataV2,
    loading: trendingLoadingV2,
    error: trendingErrorV2,
    refetch: refetchTrendingV2,
  } = useQuery(TRENDING_SONGS_PUBLICV2, {
    variables: { limit: HORIZONTAL_LIMIT },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const {
    data: newUploadsData,
    loading: newUploadLoading,
    error: newUploadError,
    refetch: newUploadRefetch,
  } = useQuery(NEW_UPLOADS_PUBLIC, {
    variables: { limit: HORIZONTAL_LIMIT },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { data: suggestedData } = useQuery(SUGGESTED_SONGS_PUBLIC, {
    skip: !loadDeferredHome,
    notifyOnNetworkStatusChange: true,
    variables: { limit: COMPACT_LIMIT },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { data: songOfTheWeekData } = useQuery(SONG_OF_THE_WEEK_PUBLIC, {
    skip: !loadDeferredHome,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const { data: competitionData } = useQuery(SONGS_COMPETING_THIS_WEEK_PUBLIC, {
    skip: !loadDeferredHome,
    variables: { limit: HORIZONTAL_LIMIT },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { data: radioStationsData } = useQuery(RADIO_STATIONS_PUBLIC, {
    skip: !loadDeferredHome,
    variables: { limit: 8 },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  // simple and easy

  const recentSongs = recentPlayedData?.recentPlayedSongs ?? [];

  const mixTracks = dailyMixData?.AIDailyMix ?? [];

  const {
    songsWithArtwork: recentSongsWithArtwork,
    loading: recentSongsLoading,
  } = useSongsWithPresignedUrls(recentSongs, { includeRelatedImages: false });

  const { songsWithArtwork, loading: artworkLoading } =
    useSongsWithPresignedUrls(mixTracks);

  const { songsWithArtwork: dailyMixWithArtwork } = useSongsWithPresignedUrls(
    loadDeferredHome ? dailyMixData?.dailyMix?.tracks : undefined,
  );

  const { songsWithArtwork: trendingSongsWithArtworkV2 } =
    useSongsWithPresignedUrls(trendingDataV2?.trendingSongsV2);

  const { songsWithArtwork: newUploadsWithArtwork } = useSongsWithPresignedUrls(
    newUploadsData?.newUploads,
  );
  const { songsWithArtwork: suggestedSongsWithArtwork } =
    useSongsWithPresignedUrls(loadDeferredHome ? suggestedData?.suggestedSongs : undefined);

  const songOfTheWeekSource = useMemo(
    () => (songOfTheWeekData?.songOfTheWeek ? [songOfTheWeekData.songOfTheWeek] : []),
    [songOfTheWeekData?.songOfTheWeek],
  );
  const { songsWithArtwork: songOfTheWeekWithArtwork } =
    useSongsWithPresignedUrls(loadDeferredHome ? songOfTheWeekSource : undefined);
  const { songsWithArtwork: competingThisWeekWithArtwork } =
    useSongsWithPresignedUrls(loadDeferredHome ? competitionData?.songsCompetingThisWeek : undefined);

  const radioStations = radioStationsData?.radioStations || [];

  const isLoggedIn = UserAuth.loggedIn();
  const profileName = UserAuth.getProfile?.()?.data?.username;
  const displayName = profileName ? profileName.split(/\s+/)[0] : "you";
  const hasListeningHistory = recentSongs.length > 0;
  const dailyMixTitle = dailyMixData?.dailyMix?.profileLabel ?? "AI Daily Mix";
  const suggestedTitle = hasListeningHistory ? "Picked from your taste" : "Suggested songs";
  const suggestedSubtitle = hasListeningHistory
    ? "More tracks shaped by what you have been playing."
    : "A starting point based on what is moving across Afrofeel.";
  const hasSuggestedSongs = suggestedSongsWithArtwork.length > 0;

  // added
  const handleCardClick = (song) => {
    const albumId = song?.albumId || song?.album?._id || song?.album;
    const songId = song?.id || song?._id;
    if (albumId && songId) {
      navigate(`/album/${albumId}/${songId}`, { state: { song } });
      return;
    }
    if (songId) {
      navigate(`/song/${songId}`, { state: { song } });
    }
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        overflowX: "hidden",
        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 38%, ${theme.palette.background.default} 100%)`,
        py: { xs: 2, md: 4 },
      })}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1680,
          mx: "auto",
          display: "flex",
          alignItems: "flex-start",
          gap: { lg: 2.5, xl: 3 },
          px: { xs: 0.5, sm: 1.5, lg: 2.5 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
            {isLoggedIn && (
              <>
                {hasListeningHistory ? (
                  <>
                    <SongList
                      title={`Continue listening, ${displayName}`}
                      subtitle="Your recent tracks are first because this home is tuned to you."
                      rowCode="recentlyPlayed"
                      songsList={recentSongsWithArtwork}
                      onCardClick={handleCardClick}
                      loading={recentPlayedLoading || recentSongsLoading}
                      lightweight
                      emptyMessage="You haven't played anything yet"
                      emptyDescription="Start listening and we'll surface these tracks again."
                    />

                    {loadDeferredHome && (
                      <>
                        <SongRowContainer
                          header={dailyMixTitle}
                          subHeader="A daily mix shaped by your listening pattern."
                          songsWithArtwork={dailyMixWithArtwork}
                          onCardClick={handleCardClick}
                        />

                        {hasSuggestedSongs && (
                          <SongList
                            title={suggestedTitle}
                            subtitle={suggestedSubtitle}
                            rowCode="suggestedSongs"
                            songsList={suggestedSongsWithArtwork}
                            onCardClick={handleCardClick}
                            emptyMessage="No songs available"
                            emptyDescription="Keep listening to improve these recommendations."
                          />
                        )}
                      </>
                    )}

                    <SongRowContainer
                      header="Trending around you"
                      subHeader="Rotating hits from the wider Flolup catalogue"
                      songsWithArtwork={trendingSongsWithArtworkV2}
                      onCardClick={handleCardClick}
                      rowCode="trending"
                    />

                    <SongRowContainer
                      header="Fresh releases"
                      subHeader="New music rotated for wider exposure"
                      songsWithArtwork={newUploadsWithArtwork}
                      onCardClick={handleCardClick}
                      refetch={newUploadRefetch}
                      rowCode="newUpload"
                    />
                  </>
                ) : (
                  <>
                    <SongRowContainer
                      header="Start with fresh releases"
                      subHeader="New music rotated so more artists get early exposure"
                      songsWithArtwork={newUploadsWithArtwork}
                      onCardClick={handleCardClick}
                      refetch={newUploadRefetch}
                      rowCode="newUpload"
                    />

                    <SongRowContainer
                      header="Trending now"
                      subHeader="A rotating view of what listeners are playing"
                      songsWithArtwork={trendingSongsWithArtworkV2}
                      onCardClick={handleCardClick}
                      rowCode="trending"
                    />

                    {loadDeferredHome && hasSuggestedSongs && (
                      <SongList
                        title={suggestedTitle}
                        subtitle={suggestedSubtitle}
                        rowCode="suggestedSongs"
                        songsList={suggestedSongsWithArtwork}
                        onCardClick={handleCardClick}
                        emptyMessage="No songs available"
                        emptyDescription="Start listening to get recommendations."
                      />
                    )}

                  </>
                )}

                {loadDeferredHome && (
                  <>
                    <RadioStations stations={radioStations} />

                    <RecommendedSongsRow
                      recentSongs={recentSongs}
                      existingTracks={
                        songsWithArtwork.length ? songsWithArtwork : mixTracks
                      }
                      username={displayName}
                    />

                    <SongsILike />

                    <SongOfTheWeek
                      songOfTheWeekWithArtwork={songOfTheWeekWithArtwork}
                      onCardClick={handleCardClick}
                    />

                    <SongRowContainer
                      header="This Week's Race"
                      subHeader="Live standings from weekly plays, likes, and shares."
                      songsWithArtwork={competingThisWeekWithArtwork}
                      onCardClick={handleCardClick}
                      rowCode="songsCompetingThisWeek"
                      emptyMessage="Songs in the race are coming"
                      emptyDescription="The weekly race restarts after Friday. Songs will appear here as soon as they get plays, likes, or shares this week."
                    />

                    {(dailyMixLoading || recentPlayedLoading || artworkLoading) && (
                      <Box sx={{ px: 1, pt: 1 }}>
                        <LinearProgress />
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          Preparing a fresh mix for you...
                        </Typography>
                      </Box>
                    )}

                    <EventsSection />
                  </>
                )}
              </>
            )}
        </Box>

        {!isMobile && <PromotedArtists />}
      </Box>

      <NowPlayingBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
      />

      {showCheckout && (
        <PremiumPromoModal
          onClose={() => setShowCheckout(false)}
          onSubscribe={(plan) => {
            // TODO: update user context to 'premium'
            setShowCheckout(false);
          }}
        />
      )}
    </Box>
  );
};

export default Home;
