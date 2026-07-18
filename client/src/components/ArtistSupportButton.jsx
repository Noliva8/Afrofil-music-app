import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
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
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";
import {
  CREATE_ARTIST_SUPPORT,
  CREATE_ARTIST_SUPPORT_MOBILE_MONEY,
  CONFIRM_ARTIST_SUPPORT_MOBILE_MONEY,
} from "../utils/mutations";
import UserAuth from "../utils/auth";
import { useStripePromise } from "../utils/stripeLoader";
import FeedbackModal from "./FeedbackModal.jsx";
import { ARTIST_SUPPORT_SONG_STATS } from "../utils/queries";






const SUPPORT_REQUIREMENTS = {
  playCount: 1,
  shareCount: 1,
  likesCount: 1,
};

const MIN_SUPPORT_AMOUNT = 1;
const MAX_SUPPORT_AMOUNT = 500;
const SUPPORT_PRESETS = [5, 10, 20, 100];

const PAYMENT_METHODS = {
  CARD: "card",
  MOBILE_MONEY: "mobile_money",
};

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

const getPaymentErrorMessage = (error) =>
  error?.graphQLErrors?.[0]?.message ||
  error?.networkError?.result?.errors?.[0]?.message ||
  error?.message ||
  "Payment failed. Please try again.";

const isRwandaValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "rwanda" || normalized === "rw";
};

const getCachedGeoCountry = () => {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem("af_geo_v3") || "null");
    return cached?.countryCode || cached?.country || null;
  } catch {
    return null;
  }
};

const SupportSummary = ({ song }) => {
  const artist = song?.artist;
  const artistName = artist?.artistAka || "artist";
  const supportImage = song?.artworkPresignedUrl || song?.artwork || artist?.profileImage;

  return (
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
  );
};


const PaymentMethodChoice = ({ song, onChoose, onClose }) => (
  <>
    <DialogContent>
      <SupportSummary song={song} />
      <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
        Choose payment method
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
        }}
      >
        <Button
          type="button"
          variant="outlined"
          startIcon={<CreditCardRoundedIcon />}
          onClick={() => onChoose(PAYMENT_METHODS.CARD)}
          sx={{ justifyContent: "center", textTransform: "none", py: 1.4, ...whiteButtonSx }}
        >
          Card
        </Button>
        <Button
          type="button"
          variant="outlined"
          startIcon={<PhoneAndroidRoundedIcon />}
          onClick={() => onChoose(PAYMENT_METHODS.MOBILE_MONEY)}
          sx={{ justifyContent: "center", textTransform: "none", py: 1.4, ...whiteButtonSx }}
        >
          Mobile Money
        </Button>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
    </DialogActions>
  </>
);
const MobileMoneyFlutterwaveLauncher = ({
  paymentConfig,
  supportId,
  onClosePaymentFlow,
  onCloseDialog,
  onNotice,
  onSuccess,
}) => {
  const [confirmArtistSupportMobileMoney] = useMutation(CONFIRM_ARTIST_SUPPORT_MOBILE_MONEY);
  const handleFlutterPayment = useFlutterwave(paymentConfig);
  const launchedRef = useRef(false);

  useEffect(() => {
    if (!paymentConfig || launchedRef.current) {
      return;
    }

    launchedRef.current = true;

    handleFlutterPayment({
      callback: async (response) => {
        try {
          const status = String(response?.status || "").trim().toLowerCase();
          if (status && status !== "successful") {
            throw new Error(response?.statusMessage || "Mobile Money payment was not completed.");
          }

          const flutterwaveTransactionId =
            response?.transaction_id || response?.transactionId || response?.id;

          if (!flutterwaveTransactionId) {
            throw new Error("Flutterwave did not return a transaction id.");
          }

          const { data, errors } = await confirmArtistSupportMobileMoney({
            variables: {
              supportId,
              flutterwaveTransactionId: String(flutterwaveTransactionId),
            },
          });

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (!data?.confirmArtistSupportMobileMoney) {
            throw new Error("Could not confirm the Mobile Money support payment.");
          }

          onNotice({
            severity: "success",
            message: "Mobile Money payment completed. The artist has been credited and notified.",
          });
          onClosePaymentFlow?.();
          onCloseDialog?.();
          onSuccess?.();
        } catch (error) {
          onNotice({
            severity: "error",
            message: getPaymentErrorMessage(error),
          });
        } finally {
          closePaymentModal();
        }
      },
      onClose: () => {
        launchedRef.current = false;
        onClosePaymentFlow?.();
      },
    });
  }, [confirmArtistSupportMobileMoney, handleFlutterPayment, onClosePaymentFlow, onNotice, onSuccess, paymentConfig, supportId]);

  return null;
};



const MobileMoneySupportForm = ({ song, songId, canUseMobileMoney, onBack, onClose, onNotice, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [paymentFlow, setPaymentFlow] = useState(null);
  const [createArtistSupportMobileMoney, { loading }] = useMutation(CREATE_ARTIST_SUPPORT_MOBILE_MONEY);

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const selectedAmount = isCustomAmount ? customAmount : amount;
    const numericAmount = Number(selectedAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      onNotice({ severity: "error", message: "Enter a valid Mobile Money amount." });
      return;
    }

    if (!phoneNumber.trim()) {
      onNotice({ severity: "error", message: "Enter your Mobile Money phone number." });
      return;
    }

    if (!phoneNumber.trim().startsWith("07")) {
      onNotice({
        severity: "error",
        message: "Mobile Money number must start with 07.",
      });
      return;
    }

    try {
      const { data, errors } = await createArtistSupportMobileMoney({
        variables: {
          songId,
          amount: numericAmount,
          phoneNumber: phoneNumber.trim(),
        },
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const paymentConfig = data?.createArtistSupportMobileMoney;
      if (!paymentConfig?.tx_ref || !paymentConfig?.supportId) {
        throw new Error("Mobile Money setup failed before Flutterwave was ready.");
      }

      setPaymentFlow(paymentConfig);
    } catch (error) {
      onNotice({
        severity: "error",
        message: getPaymentErrorMessage(error),
      });
    }
  };

  const handleClose = () => {
    setPaymentFlow(null);
    closePaymentModal();
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <SupportSummary song={song} />
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
          {[500, 1000, 2000, 5000].map((preset) => {
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
                {preset}
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
            inputProps={{ min: 1, step: "1" }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.75 }}>RWF</Typography>,
            }}
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
          What is your phone number?
        </Typography>
        <TextField
          autoFocus={!isCustomAmount}
          fullWidth
          label="Mobile Money phone number"
          placeholder="07..."
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          sx={{ mb: 2 }}
        />
        <Alert severity={canUseMobileMoney ? "info" : "warning"}>
          Only available for Rwandan numbers for now.
        </Alert>

        {paymentFlow && (
          <MobileMoneyFlutterwaveLauncher
            paymentConfig={paymentFlow}
            supportId={paymentFlow.supportId}
            onClosePaymentFlow={() => setPaymentFlow(null)}
            onCloseDialog={handleClose}
            onNotice={onNotice}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setPaymentFlow(null);
            onBack?.();
          }}
          disabled={loading}
        >
          Back
        </Button>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || Boolean(paymentFlow)}
          sx={{ bgcolor: "#fff", color: "#111", fontWeight: 700 }}
        >
          {loading || paymentFlow ? "Preparing..." : "Continue"}
        </Button>
      </DialogActions>
    </form>
  );
};


const ArtistSupportPaymentForm = ({ song, songId, onClose, onNotice, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("5");
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  const [createArtistSupport, { loading }] = useMutation(CREATE_ARTIST_SUPPORT);

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
      const { data, errors } = await createArtistSupport({
        variables: {
          songId,
          amount: numericAmount,
        },
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const clientSecret = data?.createArtistSupport?.clientSecret;
      if (!clientSecret) {
        throw new Error("Payment setup failed before Stripe returned a client secret.");
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
        message: getPaymentErrorMessage(error),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <SupportSummary song={song} />

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const stripePromise = useStripePromise();
  const { data, loading: statsLoading } = useQuery(ARTIST_SUPPORT_SONG_STATS, {
    variables: { songId },
    skip: !songId,
    fetchPolicy: "cache-first",
  });

  const song = data?.publicSong;
  const canSupport = useMemo(() => isSongEligibleForArtistSupport(song), [song]);
  const canUseMobileMoney = useMemo(() => {
    const profile = UserAuth.getProfile?.()?.data || {};
    return [profile.country, profile.countryCode, getCachedGeoCountry()].some(isRwandaValue);
  }, []);

  if (statsLoading || !canSupport || !songId) {
    return null;
  }

  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedPaymentMethod(null);
    setAmountOpen(true);
  };

  const handleCloseAmount = (event) => {
    event?.stopPropagation?.();
    setAmountOpen(false);
    setSelectedPaymentMethod(null);
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
        <DialogTitle>
          {selectedPaymentMethod === PAYMENT_METHODS.CARD
            ? "Pay with card"
            : selectedPaymentMethod === PAYMENT_METHODS.MOBILE_MONEY
              ? "Mobile Money"
              : "Support artist"}
        </DialogTitle>
        {!selectedPaymentMethod && (
          <PaymentMethodChoice
            song={song}
            onChoose={setSelectedPaymentMethod}
            onClose={handleCloseAmount}
          />
        )}

        {selectedPaymentMethod === PAYMENT_METHODS.CARD && (
          !stripePromise ? (
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
          )
        )}

        {selectedPaymentMethod === PAYMENT_METHODS.MOBILE_MONEY && (
          <MobileMoneySupportForm
            song={song}
            songId={songId}
            canUseMobileMoney={canUseMobileMoney}
            onBack={() => setSelectedPaymentMethod(null)}
            onClose={handleCloseAmount}
            onNotice={setNotice}
            onSuccess={() => setSuccessOpen(true)}
          />
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
