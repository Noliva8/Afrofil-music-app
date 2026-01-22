import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from "@mui/material/styles";
import { SitemarkIcon } from "../themeCustomization/customIcon";

export default function SplashScreen() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "grid",
        placeItems: "center",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.common.white,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          px: 2,
        }}
      >
        <SitemarkIcon
          sx={{
            width: 64,
            height: 64,
            color: theme.palette.primary.main,
          }}
        />
        <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: "0.2em" }}>
          AfroFeel
        </Typography>
        <Typography variant="subtitle1" sx={{ letterSpacing: "0.2em" }}>
          Feel the Music
        </Typography>
      </Box>
    </Box>
  );
}
