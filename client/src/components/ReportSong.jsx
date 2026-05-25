import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import { REPORT_SONG } from "../utils/mutations";

const REPORT_REASONS = [
  { value: "infringement", label: "Infringement" },
  { value: "explicit_or_harmful_content", label: "Explicit or harmful content" },
  { value: "misleading_metadata", label: "Misleading metadata" },
  { value: "other", label: "Other" },
];

export default function ReportSong({ open, onClose, song, onReported }) {
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reportSong, { loading }] = useMutation(REPORT_SONG);

  const songId = song?._id || song?.id;
  const songTitle = song?.title || "this song";
  const artistName = useMemo(() => {
    if (song?.artistName) return song.artistName;
    if (song?.artist?.artistAka) return song.artist.artistAka;
    if (song?.artist?.fullName) return song.artist.fullName;
    return "";
  }, [song]);

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!songId) {
      setErrorMessage("Song could not be identified.");
      return;
    }
    if (!reason) {
      setErrorMessage("Choose a reason before submitting.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data } = await reportSong({
        variables: { songId, reason },
      });
      setSuccessMessage("Report submitted.");
      onReported?.(data?.reportSong);
      setTimeout(handleClose, 700);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to report song.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Report song</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, pt: 0.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Why do you report this song?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {songTitle}{artistName ? ` by ${artistName}` : ""}
            </Typography>
          </Box>

          <FormControl>
            <RadioGroup value={reason} onChange={(event) => setReason(event.target.value)}>
              {REPORT_REASONS.map((item) => (
                <FormControlLabel
                  key={item.value}
                  value={item.value}
                  control={<Radio />}
                  label={item.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !reason}>
          {loading ? "Submitting..." : "Submit report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
