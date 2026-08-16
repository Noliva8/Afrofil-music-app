import { useState, useEffect, useRef } from "react";
import { SitemarkIcon } from "../components/themeCustomization/customIcon";
import "../pages/CSS/freeAppNavBar.css";
import AppBar from "@mui/material/AppBar";
import MuiToolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { alpha, styled, useTheme } from "@mui/material/styles";
import MenuButton from "./MenuButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountMenu from "./AccountMenu";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import ArtistMessagingLoader from "./ArtistMessagingLoader.jsx";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ARTIST_BOOKINGS, MESSAGE_CONVERSATIONS } from "../utils/queries";
import { RESPOND_TO_BOOKING_ARTIST } from "../utils/mutations";
import ArtistBookingNotifications from "./ArtistBookingNotifications";

const Toolbar = styled(MuiToolbar)({
  width: "100%",
  minHeight: "56px",
  padding: "8px 0",
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  flexShrink: 0,
});

export default function FreePlanAppNavBar({ handleShowMobileMenu, handleshowAccountMenu, showAccountMenu, artistProfile, profileImage, onReturnToUser }) {
  const theme = useTheme();
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
          bgcolor: alpha(theme.palette.background.paper, 0.94),
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.18),
          top: "var(--template-frame-height, 0px)",
        }}
      >
        <Box sx={{ px: { xs: 1.25, sm: 2 } }}>
          <Toolbar variant="regular">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                <MenuButton
                  aria-label="menu"
                  onClick={handleShowMobileMenu}
                  sx={{ width: 36, height: 36, borderRadius: "8px" }}
                >
                  <MenuRoundedIcon sx={{ color: theme.palette.text.primary, fontSize: "1.5rem" }} />
                </MenuButton>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
                    <SitemarkIcon />
                  </Box>
                  <Typography
                    component="h1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 800,
                      fontSize: { xs: "1.05rem", sm: "1.2rem" },
                      lineHeight: 1,
                      letterSpacing: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Studio
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, flexShrink: 0 }}> 
                <IconButton
                  aria-label="Back to listening"
                  onClick={onReturnToUser}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: theme.palette.common.white,
                    color: theme.palette.common.black,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.common.white, 0.88),
                    },
                  }}
                >
                  <HeadphonesRoundedIcon sx={{ fontSize: "1rem" }} />
                </IconButton>
                <ArtistMessagingLoader />
                <IconButton
                  aria-label="Open notifications"
                  onClick={handleNotificationsOpen}
                  size="small"
                  sx={{ width: 32, height: 32, p: 0.35 }}
                >
                  <Badge
                    badgeContent={pendingBookings.length}
                    color="secondary"
                    sx={{
                      ".MuiBadge-badge": {
                        backgroundColor: highlightNotifications ? theme.palette.primary.main : theme.palette.background.paper,
                        color: highlightNotifications ? "black" : "black",
                        fontSize: "0.6rem",
                      },
                    }}
                  >
                    <NotificationsRoundedIcon sx={{ color: theme.palette.common.white, fontSize: "1.15rem" }} />
                  </Badge>
                </IconButton>
                <IconButton
                  onClick={handleshowAccountMenu}
                  size="small"
                  sx={{ width: 34, height: 34, border: `1px solid ${alpha(theme.palette.common.white, 0.82)}`, borderRadius: "50%", p: 0.2 }}
                >
                  <Avatar
                    alt={artistProfile?.fullName}
                    src={profileImage}
                    sx={{
                      width: 28,
                      height: 28,
                      border: `1px solid ${alpha(theme.palette.common.white, 0.9)}`,
                      borderRadius: "50%",
                    }}
                  />
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
