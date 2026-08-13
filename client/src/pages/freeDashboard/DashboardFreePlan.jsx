import { lazy, Suspense, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ButtonBase from '@mui/material/ButtonBase';
import SongsList from './DashbordComponents/SongList/SongList';
import CountUp from 'react-countup';
import { useQuery } from "@apollo/client";
import { ARTIST_SUPPORT_REVENUE, SONG_OF_ARTIST } from '../../utils/queries';
import FeedbackModal from '../../components/FeedbackModal.jsx';

const LazyTotalSongCharts = lazy(
  () => import('./DashbordComponents/Charts/TotalSongsCharts')
);
const LazySongCountChart = lazy(
  () => import('./DashbordComponents/Charts/SongCountChart')
);
const LazyTopLikedSongs = lazy(
  () => import('./DashbordComponents/Charts/TopLikeSongs')
);



export default function DashboardFreePlan() {

 const { data, loading, error, refetch } = useQuery(SONG_OF_ARTIST, {
  fetchPolicy: 'network-only',
});
 const { data: supportRevenueData } = useQuery(ARTIST_SUPPORT_REVENUE, {
  fetchPolicy: 'network-only',
});


  const songs = data?.songsOfArtist || [];
  const fanSupportAmount =
    (supportRevenueData?.artistSupportRevenue?.totalArtistAmount || 0) / 100;
  const totalRevenue = fanSupportAmount;

// build uploads per month
const uploadsPerMonth = {};
songs.forEach(song => {
  const date = new Date(song.createdAt);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  uploadsPerMonth[key] = (uploadsPerMonth[key] || 0) + 1;
});

// get last 6 months
function getLast6Months() {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(key);
  }

  return months;
}

const last6Months = getLast6Months();

const chartData = last6Months.map(month => ({
  date: month,
  uploads: uploadsPerMonth[month] || 0
}));

const topLikedSongsData = songs
  .map((song) => ({
    title: song.title || "Untitled",
    likes: Number(song.likesCount ?? song.likedByUsers?.length ?? 0) || 0,
  }))
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 5);

const totalPlayCount = songs.reduce(
  (total, song) => total + (Number(song.playCount ?? song.plays ?? 0) || 0),
  0
);

const topPlayedSongsData = songs
  .map((song) => ({
    title: song.title || "Untitled",
    plays: Number(song.playCount ?? song.plays ?? 0) || 0,
  }))
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 5);

const platformMonetizationEligible = songs.length > 1000 && totalPlayCount > 10000;
const revenueCards = [
  {
    title: "Fan support",
    value: `$${fanSupportAmount.toFixed(2)}`,
    status: "Eligible",
    detail:
      "Fan support shows your artist share from confirmed support payments. We calculate this from the confirmed support amount: 80% goes to the artist and 20% is kept by the platform. Taxes may apply depending on the supporter country, artist country, and platform requirements.",
  },
  {
    title: "Ad based revenue",
    value: platformMonetizationEligible ? "$0.00" : "Not eligible",
    status: platformMonetizationEligible ? "Eligible" : "Not eligible",
    detail:
      "Ad based revenue will open when the platform catalogue has enough music and listening activity to support stable advertiser demand.",
  },
  {
    title: "Public performance",
    value: "Pending",
    status: "Pending",
    detail:
      "Public performance revenue is pending while reporting and rights workflows are being prepared.",
  },
  {
    title: "Premium subscription",
    value: platformMonetizationEligible ? "$0.00" : "Not eligible",
    status: platformMonetizationEligible ? "Eligible" : "Not eligible",
    detail:
      "Premium subscription revenue will open when the platform catalogue and listener base are large enough to distribute subscription revenue fairly.",
  },
];





function handleEditSong() {
  
}

function handleDeleteSong() {
  // Show confirmation dialog and delete logic here
}

const [selectedRevenueCard, setSelectedRevenueCard] = useState(null);
const [cashoutMessage, setCashoutMessage] = useState(null);

const handleCashoutClick = () => {
  if (totalRevenue < 50) {
    setCashoutMessage(
      `Cash out is available once your available revenue reaches $50. Your current available revenue is $${totalRevenue.toFixed(2)}.`
    );
    return;
  }

  setCashoutMessage(
    "Cash out setup is available. Next we will connect your payout account and collect the information needed to send payments."
  );
};








  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        marginTop: { xs: "4rem", lg: "2.5rem" },
        px: { xs: 1, sm: 2, md: 4 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Typography variant="h4" gutterBottom color="white" sx={{ fontWeight: 700 }}>
        Dashboard
      </Typography>


{/* Grid system 1 */}
{/* -------------- */}

      <Grid2 container spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="stretch">

    {/* Total Songs */}
        <Grid2 size={{ xs: 12, md: 6, lg: 4 }} sx={{ minWidth: 0 }}>

          <Paper
            elevation={3}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--secondary-background-color)",
              p: { xs: 2, md: 3 },
              borderRadius: "10px",
              gap: "1rem",
              minHeight: { xs: 280, md: 360 },
            }}
          >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total songs :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        {loading ? (
          <Typography color="white">Loading chart...</Typography>
        ) : error ? (
          <Typography color="red">Error loading songs</Typography>
        ) : (
          <>
       


        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: "white" }}>
            <CountUp start={0} end={songs.length} duration={3} />
          </Typography>
        </Box>



      

                 <Box sx={{ flexGrow: 1, height: 'auto' }}>
              <Suspense fallback={<Typography color="white">Loading chart...</Typography>}>
                <LazyTotalSongCharts data={chartData} refetch={refetch} />
              </Suspense>
            </Box>
          </>
        )}
      </Paper>
    </Grid2>


    {/* Total Play Counts */}
        <Grid2 size={{ xs: 12, md: 6, lg: 4 }} sx={{ minWidth: 0 }}>

          <Paper
            elevation={3}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--secondary-background-color)",
              p: { xs: 2, md: 3 },
              borderRadius: "10px",
              gap: "1rem",
              minHeight: { xs: 240, md: 260 },
            }}
          >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total play counts :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: "white" }}>
            <CountUp start={0} end={totalPlayCount} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Suspense fallback={<Typography color="white">Loading chart...</Typography>}>
            <LazySongCountChart data={topPlayedSongsData} />
          </Suspense>
        </Box>
      </Paper>
    </Grid2>

    {/* Total Likes */}
        <Grid2 size={{ xs: 12, md: 6, lg: 4 }} sx={{ minWidth: 0 }}>
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: { xs: 2, md: 3 },
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total likes :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: "white" }}>
            <CountUp start={0} end={songs.length * 5} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {/* You can later add a Likes Chart here */}
             <Suspense fallback={<Typography color="white">Loading recommendations...</Typography>}>
               <LazyTopLikedSongs data={topLikedSongsData} />
             </Suspense>
        </Box>

     
      </Paper>
    </Grid2>





    {/* Group 2 */}
    <Grid2 size={{ xs: 12 }} sx={{ minWidth: 0 }}>
      <Paper
        elevation={3}
        sx={{
          
          backgroundColor: "var(--secondary-background-color)",
          p: { xs: 2, md: 3 },
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          Song list:
        </Typography>
         <Divider sx={{ width: "100%" }} />



<SongsList songs={songs} onEdit={handleEditSong} refetch={refetch} onDelete={handleDeleteSong} />

      </Paper>
    </Grid2>

    <Grid2 size={{ xs: 12 }} sx={{ minWidth: 0 }}>
      <Paper
        elevation={3}
        sx={{
          backgroundColor: "var(--secondary-background-color)",
          p: { xs: 2, md: 3 },
          borderRadius: "10px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography variant="h5" gutterBottom color="white">
              Revenue
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
              Fan support is available now. Other revenue features unlock when the platform catalogue and listening activity are large enough.
            </Typography>
          </Box>
          <Chip
            label={platformMonetizationEligible ? "Platform monetization ready" : "Platform monetization building"}
            color={platformMonetizationEligible ? "success" : "default"}
            sx={{
              color: platformMonetizationEligible ? undefined : "rgba(255,255,255,0.72)",
              bgcolor: platformMonetizationEligible ? undefined : "rgba(255,255,255,0.08)",
            }}
          />
        </Box>

        <Divider sx={{ width: "100%", my: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {revenueCards.map((card) => (
            <ButtonBase
              key={card.title}
              onClick={() => setSelectedRevenueCard(card)}
              sx={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                p: { xs: 1.5, md: 2 },
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: "rgba(255,255,255,0.035)",
                minWidth: 0,
                textAlign: "left",
                alignItems: "stretch",
                width: "100%",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.22)",
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>
                {card.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  mt: 1,
                  wordBreak: "break-word",
                }}
              >
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.52)", mt: 1 }}>
                {card.status}
              </Typography>
            </ButtonBase>
          ))}
        </Box>

        <Box
          sx={{
            mt: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            pt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
            Total revenue
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 900 }}>
              ${totalRevenue.toFixed(2)}
            </Typography>
            <ButtonBase
              onClick={handleCashoutClick}
              sx={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "999px",
                px: 1.5,
                py: 0.5,
                color: "#111",
                bgcolor: "#fff",
                fontSize: "0.78rem",
                fontWeight: 800,
                lineHeight: 1.4,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.9)",
                },
              }}
            >
              Cash out
            </ButtonBase>
          </Box>
        </Box>
      </Paper>
    </Grid2>

  </Grid2>
  <FeedbackModal
    open={Boolean(selectedRevenueCard)}
    onClose={() => setSelectedRevenueCard(null)}
    title={selectedRevenueCard?.title || "Revenue details"}
    message={selectedRevenueCard?.detail || ""}
  />
  <FeedbackModal
    open={Boolean(cashoutMessage)}
    onClose={() => setCashoutMessage(null)}
    title="Cash out"
    message={cashoutMessage || ""}
  />
</Box>

  );
}
