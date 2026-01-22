// Home.jsx (modularized entry)
import { useState, useEffect, useMemo } from 'react';
import UserMobileHeader from '../components/userComponents/Home/UserMobileHeader';
import PlaylistSection from '../components/userComponents/Home/PlaylistSection';
import EventsSection from '../components/userComponents/Home/EventsSection';
import PromotedArtists from '../components/userComponents/Home/PromotedArtists';
import NowPlayingBar from '../components/userComponents/Home/NowPlayingBar';
import '../pages/CSS/CSS-HOME-FREE-PLAN/home.css';
import PremiumCheckout from '../components/userComponents/Home/Premium/PremiumCheckout';
import PremiumCheckoutPage from '../components/userComponents/Home/Premium/PremiumCheckoutPage';
import PremiumPromoModal from '../components/userComponents/Home/Premium/PremiumPromoModal';
import { SongsILike } from '../components/homeFreePlanComponents/SongsIlikeBlock';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
import { BsStars } from 'react-icons/bs';

import { generateDailyMix } from '../utils/aiMix';
import { useQuery, useApolloClient } from '@apollo/client';
import {
  QUERY_DAILY_MIX,
  QUERY_RECENT_PLAYED,
  TRENDING_SONGS_PUBLIC,
  NEW_UPLOADS_PUBLIC,
  SUGGESTED_SONGS_PUBLIC,
  SONG_OF_MONTH_PUBLIC,
  RADIO_STATIONS_PUBLIC,
} from '../utils/queries';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext.jsx';
import { usePlayCount } from '../utils/handlePlayCount';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import { handleTrendingSongPlay } from '../utils/plabackUtls/handleSongPlayBack.js';
import DailyMixSection from '../components/userComponents/Home/DailyMixSection';
import { useDeduplicatedMix } from '../utils/hooks/useDeduplicatedMix';
import RecommendedSongsRow from '../components/userComponents/Home/RecommendedSongsRow';
import MainMenu from '../components/MainMenu';
import UserAuth from '../utils/auth';






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
 

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const togglePlay = () => setIsPlaying((prev) => !prev);


  const { data: dailyMixData, loading: dailyMixLoading, error: dailyMixError } = useQuery(QUERY_DAILY_MIX, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });





  const { data: recentPlayedData, loading: recentPlayedLoading } = useQuery(QUERY_RECENT_PLAYED, {
    variables: { limit: 12 },
  });

  const {
    data: trendingData,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useQuery(TRENDING_SONGS_PUBLIC, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const { data: newUploadsData } = useQuery(NEW_UPLOADS_PUBLIC, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const { data: suggestedData } = useQuery(SUGGESTED_SONGS_PUBLIC, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
  });
  const { data: songOfMonthData } = useQuery(SONG_OF_MONTH_PUBLIC, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const { data: radioStationsData } = useQuery(RADIO_STATIONS_PUBLIC, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const dedupResult = useDeduplicatedMix(dailyMixData, recentPlayedData);
  const { mixProfileLabel, visibleMixQueue, recentSongs, isProcessing } = dedupResult;
  const mixError = dailyMixError?.message;
  const client = useApolloClient();
  const { currentTrack, isPlaying: isTrackPlaying, handlePlaySong, pause } = useAudioPlayer();
  const { incrementPlayCount } = usePlayCount();
  const { songsWithArtwork, loading: artworkLoading } = useSongsWithPresignedUrls(visibleMixQueue);
  const mixQueue = songsWithArtwork.length ? songsWithArtwork : visibleMixQueue;
  const mixLoading = (dailyMixLoading || recentPlayedLoading || isProcessing || artworkLoading);

  const { songsWithArtwork: trendingSongsWithArtwork } = useSongsWithPresignedUrls(trendingData?.trendingSongs);
  const { songsWithArtwork: newUploadsWithArtwork } = useSongsWithPresignedUrls(newUploadsData?.newUploads);
  const { songsWithArtwork: suggestedSongsWithArtwork } = useSongsWithPresignedUrls(
    suggestedData?.suggestedSongs
  );
  const songOfMonthSource = useMemo(
    () => (songOfMonthData?.songOfMonth ? [songOfMonthData.songOfMonth] : []),
    [songOfMonthData?.songOfMonth]
  );
  const { songsWithArtwork: songOfMonthWithArtwork } = useSongsWithPresignedUrls(songOfMonthSource);
  const radioStations = radioStationsData?.radioStations || [];
  const isLoggedIn = UserAuth.loggedIn();
  const profileName = UserAuth.getProfile?.()?.data?.username;
  const displayName = profileName ? profileName.split(/\s+/)[0] : 'you';

  const handleTrackPlay = async (track) => {
    const trackId = String(track.id || track._id || track.songId || '');
    const currentlySelected = currentTrack?.id === trackId;

    if (currentlySelected && isTrackPlaying) {
      pause();
      return;
    }

      await handleTrendingSongPlay({
        song: track,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: mixQueue,
        client,
      });
  };


  return (
    <Box
         sx={{
           minHeight: "100vh",
           overflowX: "hidden",
           background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
             theme.palette.background.paper,
             0.82
           )} 100%)`,
           py: 5
         }}
       >


      <Box className="content-wrapper">

        <Box className="main-content-grid">
          <Box className="main-content-column">
            {mixLoading && (
              <Box sx={{ px: 1, pt: 1 }}>
                <LinearProgress />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Preparing a fresh mix for you...
                </Typography>
              </Box>
            )}
            <DailyMixSection
              mixProfileLabel={mixProfileLabel}
              mixQueue={mixQueue}
              currentTrack={currentTrack}
              isTrackPlaying={isTrackPlaying}
              handleTrackPlay={handleTrackPlay}
              mixError={mixError}
              loading={mixLoading}
            />
            <PlaylistSection
              currentSong={currentSong}
              setCurrentSong={setCurrentSong}
              setIsPlaying={setIsPlaying}
              songs={recentSongs}
              loading={recentPlayedLoading}
            />
            {isLoggedIn && (
              <MainMenu
                songsWithArtwork={trendingSongsWithArtwork}
                newUploadsWithArtwork={newUploadsWithArtwork}
                suggestedSongsWithArtwork={suggestedSongsWithArtwork}
                songOfMonthWithArtwork={songOfMonthWithArtwork}
                radioStations={radioStations}
                refetch={refetchTrending}
              />
            )}
            <RecommendedSongsRow
              recentSongs={recentSongs}
              existingTracks={mixQueue}
              username={displayName}
            />

              <SongsILike />
              <EventsSection />
            </Box>

          {!isMobile && <PromotedArtists />}
        </Box>
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
            console.log('Subscribed to:', plan);
            // TODO: update user context to 'premium'
            setShowCheckout(false);
          }}
        />
      )}
    </Box>

  );
};

export default Home;
