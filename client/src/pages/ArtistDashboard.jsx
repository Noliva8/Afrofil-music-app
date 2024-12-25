import React from "react";
import { Box, Button, Typography, Card, CardContent, Divider } from "@mui/material";

const ArtistDashboard = () => {
  const handleGetStarted = () => {
    // Redirect to the dashboard
    window.location.href = "/dashboard";
  };

  return (
    <Box
      sx={{
        backgroundColor: "#242424",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        padding: "1rem",
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          textAlign: "center",
          padding: "2rem",
          borderRadius: 4,
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.2)",
          backgroundColor: "#1F1F1F",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to Afrofeel 🎶
        </Typography>
        <Typography variant="body1" gutterBottom>
          Your journey to sharing Afrocentric beats starts here!
        </Typography>
        <Divider sx={{ marginY: 2, backgroundColor: "gray" }} />
        <Typography variant="h6">Start with the Free Plan</Typography>
        <Typography variant="body2" sx={{ marginTop: "1rem" }}>
          ✔ Upload up to 5 songs
          <br />
          ✔ Share your tracks directly with fans
          <br />
          ✔ Basic analytics to track your listeners
          <br />
          ✔ Join a community of Afrobeat enthusiasts
        </Typography>
        <Divider sx={{ marginY: 2, backgroundColor: "gray" }} />
        <Typography variant="h6">Why Afrofeel?</Typography>
        <Typography variant="body2" sx={{ marginTop: "1rem" }}>
          🌟 Showcase Your Talent: Reach fans who appreciate Afro-centric music.
          <br />
          📈 Track Your Growth: Access essential insights about your audience.
          <br />
          🌍 Global Exposure: Put your music on the map and connect with listeners worldwide.
          <br />
          🤝 Collaborate & Network: Engage with fellow artists and creators.
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#FF9800",
            color: "white",
            marginTop: "2rem",
            padding: "0.8rem 2rem",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: 3,
            "&:hover": { backgroundColor: "#E68900" },
          }}
          onClick={handleGetStarted}
        >
          Get Started for Free
        </Button>
        <Typography
          variant="body2"
          sx={{ marginTop: "1rem", color: "gray", cursor: "pointer" }}
        >
          Want more features?{" "}
          <span style={{ color: "#FF9800" }}>Explore Premium Plans</span>
        </Typography>
      </Card>
    </Box>
  );
};

export default ArtistDashboard;
