import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useTheme from "@mui/material/styles/useTheme";
import { Controller, useForm } from "react-hook-form";

const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "CONCERTS", label: "Concerts" },
  { value: "CLUB", label: "Club" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "PRIVATE", label: "Private" },
  { value: "OTHER", label: "Other" },
];

const BUDGET_RANGES = [
  { value: "RANGE_500_1000", label: "$500-1000" },
  { value: "RANGE_1000_3000", label: "$1000-3000" },
  { value: "RANGE_3000_5000", label: "$3000-5000" },
  { value: "RANGE_5000_PLUS", label: "$5000+" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const PERFORMANCE_TYPES = [
  { value: "DJ", label: "DJ" },
  { value: "LIVE", label: "Live" },
  { value: "ACOUSTIC", label: "Acoustic" },
  { value: "BACKING_TRACK", label: "Backing Track" },
];

const SET_LENGTHS = [
  { value: "MIN_30", label: "30 min" },
  { value: "MIN_60", label: "60 min" },
  { value: "MIN_90", label: "90 min" },
];

const getToday = () => new Date().toISOString().split("T")[0];

const defaultValues = {
  eventType: EVENT_TYPES[0].value,
  eventDate: getToday(),
  city: "",
  country: "",
  venue: "",
  budgetRange: BUDGET_RANGES[0].value,
  performanceType: PERFORMANCE_TYPES[0].value,
  setLength: SET_LENGTHS[1].value,
  message: "",
};

export const BookingArtistModal = ({
  open,
  onClose,
  artistName,
  artistId,
  songId,
  onSubmit,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { control, handleSubmit, reset } = useForm({ defaultValues });
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [bookingSubmitted, setBookingSubmitted] = React.useState(false);
  const feedbackMessage =
    "Your booking request has been sent and is pending. We'll keep following up until the artist replies.";

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const handleFormSubmit = async (values) => {

    if (!artistId) return;

    const payload = {
      artistId,
      songId,
      eventType: values.eventType,
      eventDate: values.eventDate,
      location: {
        city: values.city,
        country: values.country,
        venue: values.venue || "",
      },
      budgetRange: values.budgetRange,
      performanceType: values.performanceType,
      setLength: values.setLength,
      message: values.message,
    };

    setLoading(true);
    setError(null);
    try {
      await onSubmit?.(payload);
      setBookingSubmitted(true);
      setFeedbackOpen(true);
    } catch (submitError) {
      console.error("Booking request failed:", submitError);
      setError(submitError);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
    setBookingSubmitted(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book {artistName || "the artist"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Controller
            control={control}
            name="eventType"
            render={({ field }) => (
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Event type</InputLabel>
                <Select {...field} label="Event type">
                  {EVENT_TYPES.map((type) => (
                    <MenuItem value={type.value} key={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="eventDate"
            rules={{ required: "Event date is required" }}
            render={({ field, fieldState }) => (
              <TextField
                label="Event date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...field}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Controller
            control={control}
            name="city"
            rules={{ required: "City is required" }}
            render={({ field, fieldState }) => (
              <TextField label="City" fullWidth {...field} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
            )}
          />
          <Controller
            control={control}
            name="country"
            rules={{ required: "Country is required" }}
            render={({ field, fieldState }) => (
              <TextField label="Country" fullWidth {...field} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
            )}
          />
          </Box>
          <Controller
            control={control}
            name="venue"
            render={({ field }) => <TextField label="Venue" fullWidth {...field} />}
          />
          <Controller
            control={control}
            name="budgetRange"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Budget</InputLabel>
                <Select {...field} label="Budget">
                {BUDGET_RANGES.map((range) => (
                  <MenuItem value={range.value} key={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="performanceType"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Performance</InputLabel>
                <Select {...field} label="Performance">
                  {PERFORMANCE_TYPES.map((type) => (
                    <MenuItem value={type.value} key={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="setLength"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Set length</InputLabel>
                <Select {...field} label="Set length">
                  {SET_LENGTHS.map((len) => (
                    <MenuItem value={len.value} key={len.value}>
                      {len.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Message
            </Typography>
          <Controller
            control={control}
            name="message"
            render={({ field }) => (
              <TextField
                multiline
                minRows={3}
                fullWidth
                placeholder="Tell the artist about your event, vibe, and expectation."
                {...field}
              />
            )}
          />
          </Box>
          {error && (
            <Typography variant="body2" color="error">
              {error.message}
            </Typography>
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            We will forward your request to the artist and follow up with confirmation once they respond.
          </Typography>
        </Box>
      </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={bookingSubmitted}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={loading || bookingSubmitted}
          >
            Send booking request
          </Button>
        </DialogActions>
      <Dialog open={feedbackOpen} onClose={handleFeedbackClose} maxWidth="xs" fullWidth>
        <DialogTitle>Request sent</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{feedbackMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default BookingArtistModal;
