import { useState, useRef, useEffect } from "react";
import Stack from "@mui/material/Stack";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MenuButton from "./MenuButton";
import NavbarTitles from "./NavBarTitles";
import Avatar from "@mui/material/Avatar";
import Search from "./Search";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ARTIST_BOOKINGS, MESSAGE_CONVERSATIONS } from "../utils/queries";
import { RESPOND_TO_BOOKING_ARTIST } from "../utils/mutations";
import ArtistBookingNotifications from "./ArtistBookingNotifications";
import ArtistMessagingLoader from "./ArtistMessagingLoader.jsx";




export default function StudioHeader({ openDrawer, handleShowDrawers, handleshowAccountMenu, profileImage, artistProfile, onReturnToUser }) {

  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  const [highlightNotifications, setHighlightNotifications] = useState(true);
  const [detailBookingId, setDetailBookingId] = useState(null);
  const theme = useTheme();
  const prevBookingCount = useRef(0);

  const { data: bookingsData, loading: bookingsLoading, startPolling, stopPolling, refetch } = useQuery(
    GET_ARTIST_BOOKINGS,
    {
      variables: { status: "PENDING" },
      skip: !artistProfile,
      fetchPolicy: "network-only",
    }
  );



  useEffect(() => {
    const current = bookingsData?.artistBookings?.length || 0;
    if (current > prevBookingCount.current) {
      setHighlightNotifications(true);
    }
    prevBookingCount.current = current;
  }, [bookingsData]);


  const pendingBookings = bookingsData?.artistBookings || [];

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
    setHighlightNotifications(false);
  };
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  useEffect(() => {
    startPolling(6000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);
  const [respondToBooking] = useMutation(RESPOND_TO_BOOKING_ARTIST, {
    refetchQueries: [{ query: MESSAGE_CONVERSATIONS }],
    awaitRefetchQueries: true,
  });



  const handleRespond = async (bookingId, status) => {
    try {
      await respondToBooking({
        variables: {
          input: {
            bookingId,
            status,
          },
        },
      });
      await refetch();
    } catch (error) {
      console.error("Failed to respond to booking:", error);
    }
  };


  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: "none", md: "flex" },
        width: "100%",
        alignItems: "center",

        justifyContent: "space-between",
        maxWidth: { sm: "100%", md: "1700px" },
        pt: 4.5,
        pb: 2,
      }}
      spacing={2}
    >

{/*  -----------------*/}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "center",
          color: theme.palette.text.primary,
          fontSize: "1.8rem",
        }}
      >
        <MenuButton
          sx={{
            bgcolor: alpha(theme.palette.background.paper, 0.86),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
          onClick={handleShowDrawers}
        >
          <MenuRoundedIcon sx={{ color: theme.palette.text.primary }} />
        </MenuButton>

        <NavbarTitles />
      </Box>
{/* ------------------------------------ */}

      <Stack
        direction="row"
        sx={{
          gap: 3,
          alignItems: "center",
          "@media (max-width:960px)": {
            gap: 1,
          },
        }}
      >
        <Search />

        <Button
          onClick={onReturnToUser}
          startIcon={<HeadphonesRoundedIcon />}
          sx={{
            display: { xs: "none", lg: "inline-flex" },
            borderRadius: "8px",
            px: 1.5,
            py: 0.8,
            backgroundColor: theme.palette.common.white,
            color: theme.palette.common.black,
            fontWeight: 800,
            textTransform: "none",
            whiteSpace: "nowrap",
            "&:hover": {
              backgroundColor: alpha(theme.palette.common.white, 0.88),
            },
          }}
        >
          Back to listening
        </Button>

        <ArtistMessagingLoader />

        <MenuButton aria-label="Open notifications" onClick={handleNotificationsOpen}>
          <Badge
            showZero
            badgeContent={pendingBookings.length}
            sx={{
              ".MuiBadge-badge": {
                backgroundColor: highlightNotifications ? theme.palette.secondary.main : "white",
                color: highlightNotifications ? "black" : "black",
              },
            }}
          >
            <NotificationsRoundedIcon
              sx={{ color: theme.palette.common.white, fontSize: "1.8rem" }}
            />
          </Badge>
        </MenuButton>

        <Button
          onClick={handleshowAccountMenu}
          sx={{
            minWidth: 0,
            p: 0.4,
            borderRadius: '50%',
            border: `1px solid ${alpha(theme.palette.common.white, 0.82)}`,
          }}
        >
          <Avatar
            src={profileImage}
            alt={artistProfile?.fullName || "Creator"}
            sx={{
              border: `1px solid ${alpha(theme.palette.common.white, 0.9)}`,
              borderRadius: '50%',
            }}
          />
        </Button>
      </Stack>

      <ArtistBookingNotifications
        anchorEl={notificationsAnchor}
        onClose={handleNotificationsClose}
        loading={bookingsLoading}
        pendingBookings={pendingBookings}
        handleRespond={handleRespond}
        detailBookingId={detailBookingId}
        setDetailBookingId={setDetailBookingId}
      />

    </Stack>
  );
}
