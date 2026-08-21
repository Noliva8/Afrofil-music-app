import { lazy, Suspense, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ButtonBase from '@mui/material/ButtonBase';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material/styles';
import SongsList from './DashbordComponents/SongList/SongList';
import CountUp from 'react-countup';
import { useMutation, useQuery } from "@apollo/client";
import { ARTIST_PROFILE, ARTIST_REWARD_REVENUE, ARTIST_SUPPORT_REVENUE, SONG_OF_ARTIST } from '../../utils/queries';
import { PROCESS_ARTIST_CASHOUT } from '../../utils/mutations';
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
 const theme = useTheme();

 const { data, loading, error, refetch } = useQuery(SONG_OF_ARTIST, {
  fetchPolicy: 'network-only',
});
 const { data: supportRevenueData, refetch: refetchSupportRevenue } = useQuery(ARTIST_SUPPORT_REVENUE, {
  fetchPolicy: 'network-only',
});
 const { data: rewardRevenueData, refetch: refetchRewardRevenue } = useQuery(ARTIST_REWARD_REVENUE, {
  fetchPolicy: 'network-only',
});
 const { data: artistProfileData } = useQuery(ARTIST_PROFILE, {
  fetchPolicy: 'cache-first',
});


  const songs = data?.songsOfArtist || [];
  const artistFullName = artistProfileData?.artistProfile?.fullName || "";
  const fanSupportAmount =
    (supportRevenueData?.artistSupportRevenue?.totalArtistAmount || 0) / 100;
  const rewardAmount = rewardRevenueData?.artistRewardRevenue?.availableRewardAmountUsd || 0;
  const rewardCount = rewardRevenueData?.artistRewardRevenue?.rewardCount || 0;
  const totalRevenue = fanSupportAmount + rewardAmount;

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
    title: "Rewards",
    value: `$${rewardAmount.toFixed(2)}`,
    status: rewardCount > 0 ? `${rewardCount} reward${rewardCount === 1 ? "" : "s"}` : "No rewards yet",
    detail:
      "Rewards show Song of the Week bonus earnings converted from RWF to USD. Rewards are created after a weekly winner is selected.",
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
const [cashoutOpen, setCashoutOpen] = useState(false);
const [cashoutFullName, setCashoutFullName] = useState("");
const [cashoutPhone, setCashoutPhone] = useState("");
const [cashoutResultMessage, setCashoutResultMessage] = useState(null);
const [processArtistCashout, { loading: processingCashout }] = useMutation(PROCESS_ARTIST_CASHOUT);
const normalizeCashoutName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
const normalizeCashoutPhone = (value) => String(value || "").trim().replace(/[\s-]/g, "");
const isValidCashoutPhone = (value) => /^(?:0\d{9}|\+250\d{9})$/.test(normalizeCashoutPhone(value));
const isCashoutNameMatched =
  normalizeCashoutName(cashoutFullName) === normalizeCashoutName(artistFullName);
const canProcessCashout = isCashoutNameMatched && isValidCashoutPhone(cashoutPhone);

const handleCashoutClick = () => {
  setCashoutOpen(true);
};

const handleCashoutClose = () => {
  setCashoutOpen(false);
};

const handleProcessCashout = async () => {
  try {
    const { data: cashoutData } = await processArtistCashout({
      variables: {
        fullName: cashoutFullName,
        phoneNumber: cashoutPhone,
      },
    });
    const cashout = cashoutData?.processArtistCashout;

    setCashoutOpen(false);
    setCashoutFullName("");
    setCashoutPhone("");
    await Promise.all([refetchSupportRevenue(), refetchRewardRevenue()]);
    setCashoutResultMessage(
      cashout
        ? `${cashout.message} Amount to pay after 4% processing fee: $${cashout.payoutAmountUsd.toFixed(2)}.`
        : "Cash out request received."
    );
  } catch (cashoutError) {
    setCashoutResultMessage(cashoutError.message || "Failed to process cash out.");
  }
};

const panelSx = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: alpha(theme.palette.background.paper, 0.88),
  color: theme.palette.text.primary,
  p: { xs: 2, md: 3 },
  borderRadius: "8px",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: theme.shadows[2],
};

const dividerSx = {
  width: "100%",
  borderColor: alpha(theme.palette.text.primary, 0.1),
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
      <Typography
        component="h1"
        sx={{
          mb: 0.75,
          fontWeight: 900,
          fontSize: { xs: "1.8rem", md: "2.35rem" },
          color: theme.palette.text.primary,
          letterSpacing: 0,
        }}
      >
        Dashboard
      </Typography>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          maxWidth: 720,
          lineHeight: 1.55,
        }}
      >
        Track your music activity, manage uploaded songs, and review available revenue.
      </Typography>


{/* Grid system 1 */}
{/* -------------- */}

      <Grid2 container spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="stretch">

    {/* Total Songs */}
        <Grid2 size={{ xs: 12, md: 6, lg: 4 }} sx={{ minWidth: 0 }}>

          <Paper
            elevation={3}
            sx={{
              ...panelSx,
              gap: "1rem",
              minHeight: { xs: 280, md: 360 },
            }}
          >
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
          Total songs
        </Typography>

        <Divider sx={dividerSx} />

        {loading ? (
          <Typography sx={{ color: theme.palette.text.secondary }}>Loading chart...</Typography>
        ) : error ? (
          <Typography color="error">Error loading songs</Typography>
        ) : (
          <>
       


        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: theme.palette.text.primary, fontWeight: 900 }}>
            <CountUp start={0} end={songs.length} duration={3} />
          </Typography>
        </Box>



      

                 <Box sx={{ flexGrow: 1, height: 'auto' }}>
              <Suspense fallback={<Typography sx={{ color: theme.palette.text.secondary }}>Loading chart...</Typography>}>
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
              ...panelSx,
              gap: "1rem",
              minHeight: { xs: 240, md: 260 },
            }}
          >
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
          Total play counts
        </Typography>

        <Divider sx={dividerSx} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: theme.palette.text.primary, fontWeight: 900 }}>
            <CountUp start={0} end={totalPlayCount} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Suspense fallback={<Typography sx={{ color: theme.palette.text.secondary }}>Loading chart...</Typography>}>
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
          ...panelSx,
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
          Total likes
        </Typography>

        <Divider sx={dividerSx} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, color: theme.palette.text.primary, fontWeight: 900 }}>
            <CountUp start={0} end={songs.length * 5} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {/* You can later add a Likes Chart here */}
             <Suspense fallback={<Typography sx={{ color: theme.palette.text.secondary }}>Loading recommendations...</Typography>}>
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
          ...panelSx,
          height: "auto",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
          Song list
        </Typography>
         <Divider sx={dividerSx} />



<SongsList songs={songs} onEdit={handleEditSong} refetch={refetch} onDelete={handleDeleteSong} />

      </Paper>
    </Grid2>

    <Grid2 size={{ xs: 12 }} sx={{ minWidth: 0 }}>
      <Paper
        elevation={3}
        sx={{
          ...panelSx,
          height: "auto",
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
            <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
              Revenue
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Fan support is available now. Other revenue features unlock when the platform catalogue and listening activity are large enough.
            </Typography>
          </Box>
          <Chip
            label={platformMonetizationEligible ? "Platform monetization ready" : "Platform monetization building"}
            color={platformMonetizationEligible ? "success" : "default"}
            sx={{
              color: platformMonetizationEligible ? undefined : theme.palette.text.secondary,
              bgcolor: platformMonetizationEligible ? undefined : alpha(theme.palette.text.primary, 0.08),
            }}
          />
        </Box>

        <Divider sx={{ ...dividerSx, my: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {revenueCards.map((card) => (
            <ButtonBase
              key={card.title}
              onClick={() => setSelectedRevenueCard(card)}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                borderRadius: "8px",
                p: { xs: 1.5, md: 2 },
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: alpha(theme.palette.background.default, 0.46),
                minWidth: 0,
                textAlign: "left",
                alignItems: "stretch",
                width: "100%",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  borderColor: alpha(theme.palette.primary.main, 0.42),
                  bgcolor: alpha(theme.palette.background.default, 0.62),
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                {card.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 800,
                  mt: 1,
                  wordBreak: "break-word",
                }}
              >
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                {card.status}
              </Typography>
            </ButtonBase>
          ))}
        </Box>

        <Box
          sx={{
            mt: 2,
            borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            pt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
            Total revenue
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 900 }}>
              ${totalRevenue.toFixed(2)}
            </Typography>
            <ButtonBase
              onClick={handleCashoutClick}
              sx={{
                border: `1px solid ${alpha(theme.palette.text.primary, 0.18)}`,
                borderRadius: "999px",
                px: 1.5,
                py: 0.5,
                color: theme.palette.common.black,
                bgcolor: theme.palette.common.white,
                fontSize: "0.78rem",
                fontWeight: 800,
                lineHeight: 1.4,
                "&:hover": {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
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
  <Dialog
    open={cashoutOpen}
    onClose={handleCashoutClose}
    fullWidth
    maxWidth="xs"
  >
    <DialogTitle sx={{ fontWeight: 800 }}>
      Cash out
    </DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        fullWidth
        label="Full name"
        value={cashoutFullName}
        onChange={(event) => setCashoutFullName(event.target.value)}
        margin="dense"
        error={Boolean(cashoutFullName.trim()) && !isCashoutNameMatched}
        helperText={
          Boolean(cashoutFullName.trim()) && !isCashoutNameMatched
            ? "Enter the full name on your artist account."
            : " "
        }
      />
      <TextField
        fullWidth
        label="Payout phone number"
        value={cashoutPhone}
        onChange={(event) => setCashoutPhone(event.target.value)}
        placeholder="078... or +250..."
        margin="dense"
        type="tel"
        inputMode="tel"
        error={Boolean(cashoutPhone.trim()) && !isValidCashoutPhone(cashoutPhone)}
        helperText={
          Boolean(cashoutPhone.trim()) && !isValidCashoutPhone(cashoutPhone)
            ? "Use 078... or +250... with 9 digits after the prefix."
            : " "
        }
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={handleCashoutClose} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={handleProcessCashout}
        variant="contained"
        disabled={!canProcessCashout || processingCashout}
      >
        {processingCashout ? "Processing..." : "Process payment"}
      </Button>
    </DialogActions>
  </Dialog>
  <FeedbackModal
    open={Boolean(cashoutResultMessage)}
    onClose={() => setCashoutResultMessage(null)}
    title="Cash out"
    message={cashoutResultMessage || ""}
  />
</Box>

  );
}
