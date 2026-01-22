
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useLocationContext } from "./useLocationContext.jsx";

export default function LocationGate({ children }) {
  const { loadingGeo, errorGeo } = useLocationContext();

  if (errorGeo) {
    console.warn("Location error:", errorGeo);
  }

  return (
    <>
      {children}
      {loadingGeo && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(18,18,18,0.7)",
            zIndex: 2000,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.shadows[8],
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CircularProgress size={32} thickness={5} />
            <Box component="span" sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
              Preparing the experience…
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
