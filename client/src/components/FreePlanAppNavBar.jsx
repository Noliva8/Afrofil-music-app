import { useState, useEffect, useRef } from "react";
import { SitemarkIcon } from "../components/themeCustomization/customIcon";
import "../pages/CSS/freeAppNavBar.css";
import AppBar from "@mui/material/AppBar";
import MuiToolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import MenuButton from "./MenuButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountMenu from "./AccountMenu";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ArtistMessagingPanel from "./ArtistMessagingPanel";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ARTIST_BOOKINGS, MESSAGE_CONVERSATIONS } from "../utils/queries";
import { RESPOND_TO_BOOKING_ARTIST } from "../utils/mutations";
import ArtistBookingNotifications from "./ArtistBookingNotifications";

const Toolbar = styled(MuiToolbar)({
  width: "100%",
  padding: "12px",
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexShrink: 0,
});

export default function FreePlanAppNavBar({ handleShowMobileMenu, handleshowAccountMenu, showAccountMenu, artistProfile, profileImage }) {
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [highlightNotifications, setHighlightNotifications] = useState(true);
  const prevCountRef = useRef(0);

  const { data: bookingsData, loading, startPolling, stopPolling, refetch } = useQuery(GET_ARTIST_BOOKINGS, {
    variables: { status: "PENDING" },
    skip: !artistProfile,
    fetchPolicy: "network-only",
  });

  const [respondToBooking] = useMutation(RESPOND_TO_BOOKING_ARTIST, {
    refetchQueries: [{ query: MESSAGE_CONVERSATIONS }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!artistProfile) return;
    startPolling(6000);
    return () => stopPolling();
  }, [artistProfile, startPolling, stopPolling]);

  useEffect(() => {
    const current = bookingsData?.artistBookings?.length || 0;
    if (current > prevCountRef.current) setHighlightNotifications(true);
    prevCountRef.current = current;
  }, [bookingsData]);

  const pendingBookings = bookingsData?.artistBookings || [];

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
    setHighlightNotifications(false);
  };
  const handleNotificationsClose = () => setNotificationsAnchor(null);

  const handleRespond = async (bookingId, status) => {
    try {
      await respondToBooking({ variables: { input: { bookingId, status } } });
      await refetch();
    } catch (error) {
      console.error("Failed to respond to booking:", error);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "auto", md: "none" },
          boxShadow: 0,
          bgcolor: "var(--primary-background-color)",
          backgroundImage: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          top: "var(--template-frame-height, 0px)",
        }}
      >
        <Box sx={{ px: 5 }}>
          <Toolbar variant="regular">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MenuButton aria-label="menu" onClick={handleShowMobileMenu}>
                  <MenuRoundedIcon sx={{ color: "white", fontSize: "2rem" }} />
                </MenuButton>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SitemarkIcon />
                  <Typography variant="h4" component="h1" sx={{ color: "var(--primary-font-color)" }}>
                    Studio
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}> 
                <ArtistMessagingPanel />
                <IconButton aria-label="Open notifications" onClick={handleNotificationsOpen} size="small" sx={{ p: 0.4 }}>
                  <Badge
                    badgeContent={pendingBookings.length}
                    color="secondary"
                    sx={{
                      ".MuiBadge-badge": {
                        backgroundColor: highlightNotifications ? "var(--secondary-main)" : "white",
                        color: highlightNotifications ? "black" : "black",
                        fontSize: "0.6rem",
                      },
                    }}
                  >
                    <NotificationsRoundedIcon sx={{ color: highlightNotifications ? "var(--secondary-main)" : "white", fontSize: "1.35rem" }} />
                  </Badge>
                </IconButton>
                <IconButton onClick={handleshowAccountMenu} size="small" sx={{ border: "1px solid #e59f25", borderRadius: "50%", p: 0.3 }}>
                  <Avatar alt={artistProfile?.fullName} src={profileImage} sx={{ width: 32, height: 32 }} />
                </IconButton>
                <AccountMenu
                  handleShowMobileMenu={handleshowAccountMenu}
                  showAccountMenu={showAccountMenu}
                  profileImage={profileImage}
                  artistProfile={artistProfile}
                />
              </Box>
            </Box>
          </Toolbar>
        </Box>
      </AppBar>
      <ArtistBookingNotifications
        anchorEl={notificationsAnchor}
        onClose={handleNotificationsClose}
        loading={loading}
        pendingBookings={pendingBookings}
        handleRespond={handleRespond}
      />
    </>
  );
}

export function CustomIcon() {
  return (
    <Box
      sx={{
        width: "1.5rem",
        height: "1.5rem",
        bgcolor: "black",
        borderRadius: "999px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        backgroundImage: "linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)",
        color: "hsla(210, 100%, 95%, 0.9)",
        border: "1px solid",
        borderColor: "hsl(210, 100%, 55%)",
        boxShadow: "inset 0 2px 5px rgba(255, 255, 255, 0.3)",
      }}
    >
      <DashboardRoundedIcon color="inherit" sx={{ fontSize: "1rem" }} />
    </Box>
  );
}
