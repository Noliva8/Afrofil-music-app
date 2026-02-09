import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
        gap: 2,
      }}
    >
      <Typography variant="h4" fontWeight={900}>
        {online ? "Page not found" : "No internet connection"}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {online
          ? "We couldn’t find the page you were looking for."
          : "Please check your network and try again once you’re back online."}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        {online ? (
          <Button variant="contained" onClick={() => navigate("/")}>Go to home</Button>
        ) : (
          <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
        )}
        <Button variant="outlined" onClick={() => navigate("/terms")}>View terms</Button>
      </Box>
    </Box>
  );
}
