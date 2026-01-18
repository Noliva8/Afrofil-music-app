import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "text.primary",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          backgroundColor: "#ffffff",
          zIndex: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Afrofeel Terms
        </Typography>
        <Button
          component={Link}
          to="/artist/register"
          variant="outlined"
          sx={{ textTransform: "none" }}
        >
          Back to signup
        </Button>
      </Box>
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Terms and Conditions
        </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        These terms are a placeholder for Afrofeel&apos;s artist platform. By using
        the platform, you agree to create original work, respect rights holders,
        and keep your profile information accurate. Uploads must comply with local
        laws, and any misuse, infringement, or fraudulent activity may result in
        removal of content or account restrictions. We may update these terms over
        time to reflect product or policy changes.
      </Typography>
      <Typography variant="body1">
        This page is intentionally brief. Please replace this text with the final
        legal terms before production use.
      </Typography>
      </Box>
    </Box>
  );
}
