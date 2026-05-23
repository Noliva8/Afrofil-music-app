import { useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import { CREATE_ARTIST_SUPPORT } from "../utils/mutations";
import { useStripePromise } from "../utils/stripeLoader";
import FeedbackModal from "./FeedbackModal.jsx";

const ARTIST_SUPPORT_SONG_STATS = gql`
  query ArtistSupportSongStats($songId: ID!) {
    publicSong(songId: $songId) {
      _id
      title
      artwork
      artworkPresignedUrl
      playCount
      shareCount
      likesCount
      artist {
        _id
        artistAka
        profileImage
      }
    }
  }
`;


const SUPPORT_REQUIREMENTS = {
  playCount: 1,
  shareCount: 1,
  likesCount: 1,
};
const MIN_SUPPORT_AMOUNT = 1;
const MAX_SUPPORT_AMOUNT = 500;
const SUPPORT_PRESETS = [5, 10, 20, 100];

const whiteButtonSx = {
  borderColor: "rgba(255,255,255,0.55)",
  color: "#fff",
  "&:hover": {
    borderColor: "#fff",
    bgcolor: "rgba(255,255,255,0.12)",
  },
};

const selectedWhiteButtonSx = {
  borderColor: "#fff",
  bgcolor: "#fff",
  color: "#111",
  "&:hover": {
    borderColor: "#fff",
    bgcolor: "#fff",
  },
};

const getCount = (song, key, fallback) => {
  const value = song?.[key] ?? fallback;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const isSongEligibleForArtistSupport = (song = {}) => {
  const playCount = getCount(song, "playCount", song.views);
  const shareCount = getCount(song, "shareCount", 0);
  const likesCount = getCount(song, "likesCount", 0);

  return (
    playCount >= SUPPORT_REQUIREMENTS.playCount &&
    shareCount >= SUPPORT_REQUIREMENTS.shareCount &&
    likesCount >= SUPPORT_REQUIREMENTS.likesCount
  );
};

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#f8f4ec",
      fontSize: "16px",
      "::placeholder": {
        color: "rgba(248,244,236,0.55)",
      },
    },
    invalid: {
      color: "#ff8a80",
    },
  },
};


const ArtistSupportPaymentForm = ({ song, songId, onClose, onNotice, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("5");
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  const artist = song?.artist;
  const artistName = artist?.artistAka || "artist";
  const supportImage = song?.artworkPresignedUrl || song?.artwork || artist?.profileImage;

  const [createArtistSupport, { loading }] = useMutation(CREATE_ARTIST_SUPPORT, {
    onError: (error) => {
      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Could not start artist support payment.";

      onNotice({ severity: "error", message });
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!stripe || !elements || loading) return;

    const selectedAmount = isCustomAmount ? customAmount : amount;
    const numericAmount = Number(selectedAmount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < MIN_SUPPORT_AMOUNT ||
      numericAmount > MAX_SUPPORT_AMOUNT
    ) {
      onNotice({
        severity: "error",
        message: `Enter an amount between $${MIN_SUPPORT_AMOUNT} and $${MAX_SUPPORT_AMOUNT}.`,
      });
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      onNotice({ severity: "error", message: "Card form is not ready." });
      return;
    }

    try {
      const { data } = await createArtistSupport({
        variables: {
          songId,
          amount: numericAmount,
        },
      });

      const clientSecret = data?.createArtistSupport?.clientSecret;
      if (!clientSecret) {
        throw new Error("Payment client secret unavailable.");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
        },
      });

      if (result.error) {
        onNotice({
          severity: "error",
          message: result.error.message || "Payment failed.",
        });
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        onClose();
        onSuccess();
      }
    } catch (error) {
      onNotice({
        severity: "error",
        message: error?.message || "Payment failed. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Avatar
            src={supportImage || undefined}
            alt={artistName}
            variant="rounded"
            sx={{ width: 64, height: 64, bgcolor: "rgba(244,196,48,0.18)" }}
          >
            {artistName?.[0]?.toUpperCase?.() || "A"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              Support {artistName}
            </Typography>
            {song?.title && (
              <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
                {song.title}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
          Choose an amount
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 1,
            mb: 1.5,
          }}
        >
          {SUPPORT_PRESETS.map((preset) => {
            const selected = !isCustomAmount && Number(amount) === preset;
            return (
              <Button
                key={preset}
                type="button"
                variant={selected ? "contained" : "outlined"}
                onClick={() => {
                  setIsCustomAmount(false);
                  setAmount(String(preset));
                }}
                sx={{
                  minWidth: 0,
                  px: 1,
                  fontWeight: 700,
                  ...(selected ? selectedWhiteButtonSx : whiteButtonSx),
                }}
              >
                ${preset}
              </Button>
            );
          })}
        </Box>

        <Button
          type="button"
          variant={isCustomAmount ? "contained" : "outlined"}
          onClick={() => setIsCustomAmount(true)}
          fullWidth
          sx={{
            mb: isCustomAmount ? 1.5 : 2,
            textTransform: "none",
            ...(isCustomAmount ? selectedWhiteButtonSx : whiteButtonSx),
          }}
        >
          Custom amount
        </Button>

        {isCustomAmount && (
          <TextField
            autoFocus
            fullWidth
            label="Custom amount"
            type="number"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            inputProps={{
              min: MIN_SUPPORT_AMOUNT,
              max: MAX_SUPPORT_AMOUNT,
              step: "1",
            }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.75 }}>$</Typography>,
            }}
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
          Pay with credit card
        </Typography>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8,
            padding: 14,
          }}
        >
          <CardElement options={cardElementOptions} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !stripe || !elements}
          sx={{
            bgcolor: "#fff",
            color: "#111",
            fontWeight: 700,
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.9)",
            },
          }}
        >
          {loading ? "Processing..." : "Support artist"}
        </Button>
      </DialogActions>
    </form>
  );
};

const ArtistSupportButton = ({ songId }) => {
  const [notice, setNotice] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const stripePromise = useStripePromise();
  const { data, loading: statsLoading } = useQuery(ARTIST_SUPPORT_SONG_STATS, {
    variables: { songId },
    skip: !songId,
    fetchPolicy: "cache-first",
  });

  const song = data?.publicSong;
  const canSupport = useMemo(() => isSongEligibleForArtistSupport(song), [song]);

  if (statsLoading || !canSupport || !songId) {
    return null;
  }

  const handleClick = (event) => {
    event.stopPropagation();
    setAmountOpen(true);
  };

  const handleCloseAmount = (event) => {
    event?.stopPropagation?.();
    setAmountOpen(false);
  };

  return (
    <>
      <IconButton
        aria-label="Support artist"
        onClick={handleClick}
        sx={{
          color: "#f7d55c",
          backgroundColor: "rgba(244,196,48,0.12)",
          border: "1px solid rgba(244,196,48,0.28)",
          borderRadius: 2,
          p: { xs: 1.2, sm: 1.5 },
          "&:hover": {
            backgroundColor: "rgba(244,196,48,0.2)",
            transform: "scale(1.05)",
          },
          "&.Mui-disabled": {
            color: "rgba(247,213,92,0.45)",
            backgroundColor: "rgba(244,196,48,0.08)",
          },
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          minWidth: { xs: 70, sm: 80 },
        }}
      >
        <VolunteerActivismRoundedIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }} />
        <Typography
          variant="caption"
          sx={{
            color: "inherit",
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Support
        </Typography>
      </IconButton>

      <Dialog
        open={amountOpen}
        onClose={handleCloseAmount}
        onClick={(event) => event.stopPropagation()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Support artist</DialogTitle>
        {!stripePromise ? (
          <DialogContent sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </DialogContent>
        ) : (
          <Elements stripe={stripePromise}>
            <ArtistSupportPaymentForm
              song={song}
              songId={songId}
              onClose={handleCloseAmount}
              onNotice={setNotice}
              onSuccess={() => setSuccessOpen(true)}
            />
          </Elements>
        )}
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3500}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <FeedbackModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Support received"
        message="We received your support payment. The artist balance will update after payment confirmation."
      />
    </>
  );
};

export default ArtistSupportButton;
