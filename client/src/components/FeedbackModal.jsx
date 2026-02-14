import PropTypes from "prop-types";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

const FeedbackModal = ({
  open,
  onClose,
  title,
  message,
  link,
  linkLabel = "Learn more",
  keepMounted = true,
}) => {
  const theme = useTheme();
  return (
    <Modal
      open={open}
      onClose={onClose}
      keepMounted={keepMounted}
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description"
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 420 },
          borderRadius: 3,
          p: 3,
          outline: "none",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography id="feedback-modal-title" variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <IconButton size="small" aria-label="close" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Divider sx={{ borderColor: theme.palette.divider }} />
          <Typography
            id="feedback-modal-description"
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            {message}
          </Typography>
          {link?.href && (
            <Button
              variant="contained"
              href={link.href}
              target={link.target || "_blank"}
              rel="noreferrer"
              sx={{
                background: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  background: theme.palette.primary.dark,
                },
              }}
            >
              {link.label || linkLabel}
            </Button>
          )}
        </Stack>
      </Paper>
    </Modal>
  );
};

FeedbackModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  link: PropTypes.shape({
    href: PropTypes.string,
    label: PropTypes.string,
    target: PropTypes.string,
  }),
  linkLabel: PropTypes.string,
  keepMounted: PropTypes.bool,
};

export default FeedbackModal;
