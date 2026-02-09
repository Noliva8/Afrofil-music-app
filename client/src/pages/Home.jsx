
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
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';

import { useQuery } from '@apollo/client';
import {
  QUERY_DAILY_MIX,
  QUERY_RECENT_PLAYED,
   TRENDING_SONGS_PUBLICV2,
  NEW_UPLOADS_PUBLIC,
  SUGGESTED_SONGS_PUBLIC,
  SONG_OF_MONTH_PUBLIC,
  RADIO_STATIONS_PUBLIC,
} from '../utils/queries';
import { HORIZONTAL_LIMIT, COMPACT_LIMIT } from '../CommonSettings/songsRowNumberControl.js';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import RecommendedSongsRow from '../components/userComponents/Home/RecommendedSongsRow';
import SongOfMonth from '../components/homeFreePlanComponents/SongOfMonth';
import RadioStations from '../components/homeFreePlanComponents/RadioStations';
import { SongRowContainer } from '../components/otherSongsComponents/SongsRow';

import { SongRowContainerHero } from '../components/otherSongsComponents/SongRowHero.jsx';

import UserAuth from '../utils/auth';
import SongList from '../components/otherSongsComponents/ListSong.jsx';

// mui










// main Home
// --------





const Home = ({ upgradeToPremium }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Checkout Visibility
  // ------------------
  const [showCheckout, setShowCheckout] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const togglePlay = () => setIsPlaying((prev) => !prev);

  const {
    data: dailyMixData,
    loading: dailyMixLoading,
    error: dailyMixError,
  } = useQuery(QUERY_DAILY_MIX, {
    variables: { limit: HORIZONTAL_LIMIT },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  console.log("DEBUG HOME:", dailyMixData);

  const { data: recentPlayedData, loading: recentPlayedLoading } = useQuery(
    QUERY_RECENT_PLAYED,
    {
      variables: { limit: HORIZONTAL_LIMIT },
    },
  );

  const {
    data: trendingDataV2,
    loading: trendingLoadingV2,
    error: trendingErrorV2,
    refetch: refetchTrendingV2,
  } = useQuery(TRENDING_SONGS_PUBLICV2, {
    variables: { limit: HORIZONTAL_LIMIT },
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });

  console.log("does the error comes here?", trendingErrorV2);

  const {
    data: newUploadsData,
    loading: newUploadLoading,
    error: newUploadError,
    refetch: newUploadRefetch,
  } = useQuery(NEW_UPLOADS_PUBLIC, {
    variables: { limit: HORIZONTAL_LIMIT },
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });

  const { data: suggestedData } = useQuery(SUGGESTED_SONGS_PUBLIC, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
    variables: { limit: COMPACT_LIMIT },
  });

  const { data: songOfMonthData } = useQuery(SONG_OF_MONTH_PUBLIC, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const { data: radioStationsData } = useQuery(RADIO_STATIONS_PUBLIC, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  // simple and easy

  const recentSongs = recentPlayedData?.recentPlayedSongs ?? [];

  const mixTracks = dailyMixData?.AIDailyMix ?? [];
  console.log("ai mix", mixTracks);

  const {
    songsWithArtwork: recentSongsWithArtwork,
    loading: recentSongsLoading,
  } = useSongsWithPresignedUrls(recentSongs);

  const { songsWithArtwork, loading: artworkLoading } =
    useSongsWithPresignedUrls(mixTracks);

  const { songsWithArtwork: dailyMixWithArtwork } = useSongsWithPresignedUrls(
    dailyMixData?.dailyMix?.tracks,
  );

  console.log("daily mix ", dailyMixWithArtwork);

  const { songsWithArtwork: trendingSongsWithArtworkV2 } =
    useSongsWithPresignedUrls(trendingDataV2?.trendingSongsV2);

  const { songsWithArtwork: newUploadsWithArtwork } = useSongsWithPresignedUrls(
    newUploadsData?.newUploads,
  );
  const { songsWithArtwork: suggestedSongsWithArtwork } =
    useSongsWithPresignedUrls(suggestedData?.suggestedSongs);

  const songOfMonthSource = useMemo(
    () => (songOfMonthData?.songOfMonth ? [songOfMonthData.songOfMonth] : []),
    [songOfMonthData?.songOfMonth],
  );
  const { songsWithArtwork: songOfMonthWithArtwork } =
    useSongsWithPresignedUrls(songOfMonthSource);

  const radioStations = radioStationsData?.radioStations || [];

  const isLoggedIn = UserAuth.loggedIn();
  const profileName = UserAuth.getProfile?.()?.data?.username;
  const displayName = profileName ? profileName.split(/\s+/)[0] : "you";

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
      sx={{
        minHeight: "100vh",
        overflowX: "hidden",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.82,
        )} 100%)`,
        py: 5,
      }}
    >
     
       
       
            {isLoggedIn && (
              <>
                <SongRowContainerHero
                  header="Trending Now"
                  subHeader="The hottest tracks across Afrofeel right now"
                  songsWithArtwork={trendingSongsWithArtworkV2}
                  onCardClick={handleCardClick}
                />

                <SongRowContainer
                  header="Just Released"
                  subHeader="The Latest Songs, Right Now"
                  songsWithArtwork={newUploadsWithArtwork}
                  onCardClick={handleCardClick}
                  refetch={newUploadRefetch}
                  rowCode="newUpload"
                />

                <SongList
                  title="Recently played"
                  subtitle="Back to the tracks you loved most recently."
                  rowCode="recentlyPlayed"
                  songsList={recentSongsWithArtwork}
                  onCardClick={handleCardClick}
                  emptyMessage="You haven't played anything yet"
                  emptyDescription="Start listening and we'll surface these tracks again."
                />

                <SongOfMonth
                  songOfMonthWithArtwork={songOfMonthWithArtwork}
                  onCardClick={handleCardClick}
                />

                <SongList
                  title="Suggested songs"
                  subtitle="Based on your listening history and trending songs"
                  rowCode="suggestedSongs"
                  songsList={suggestedSongsWithArtwork}
                  onCardClick={handleCardClick}
                  emptyMessage="No songs available"
                  emptyDescription="Start listening to get recommendations"
                />

                <RadioStations stations={radioStations} />

                <RecommendedSongsRow
                  recentSongs={recentSongs}
                  existingTracks={
                    songsWithArtwork.length ? songsWithArtwork : mixTracks
                  }
                  username={displayName}
                />

                <SongsILike />

                {(dailyMixLoading || recentPlayedLoading || artworkLoading) && (
                  <Box sx={{ px: 1, pt: 1 }}>
                    <LinearProgress />
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Preparing a fresh mix for you...
                    </Typography>
                  </Box>
                )}

                <SongRowContainer
                  header={
                    dailyMixData?.dailyMix?.profileLabel ?? "AI Daily Mix"
                  }
                  subHeader="Daily AI mix"
                  songsWithArtwork={dailyMixWithArtwork}
                  onCardClick={handleCardClick}
                />

                <EventsSection />
              </>
            )}
     

          {!isMobile && <PromotedArtists />}
     
     

      <NowPlayingBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
      />

      {showCheckout && (
        <PremiumPromoModal
          onClose={() => setShowCheckout(false)}
          onSubscribe={(plan) => {
            console.log("Subscribed to:", plan);
            // TODO: update user context to 'premium'
            setShowCheckout(false);
          }}
        />
      )}
    </Box>
  );
};

export default Home;
