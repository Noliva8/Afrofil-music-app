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
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ARTIST_BOOKINGS, MESSAGE_CONVERSATIONS } from "../utils/queries";
import { RESPOND_TO_BOOKING_ARTIST } from "../utils/mutations";
import ArtistBookingNotifications from "./ArtistBookingNotifications";
import ArtistMessagingPanel from "./ArtistMessagingPanel";




export default function StudioHeader({ openDrawer, handleShowDrawers, handleshowAccountMenu, profileImage, artistProfile }) {

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
console.log('booking tend to be accepted: ....')
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
      }}
      spacing={2}
    >

{/*  -----------------*/}
      <Box
        sx={{
          display: "flex",
          gap: "4rem",
          color: "var(--button-color)",
          fontSize: "1.8rem",
        }}
      >
        <MenuButton sx={{bgcolor: 'var(--button-color)', borderRadius: '10px', width: '40px', height: '40px'}} onClick={handleShowDrawers}>
          <MenuRoundedIcon sx={{ color: "black" }} />
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

        <ArtistMessagingPanel />

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
              sx={{ color: highlightNotifications ? theme.palette.secondary.main : "var(--button-color)", fontSize: "1.8rem" }}
            />
          </Badge>
        </MenuButton>

        <Button onClick={handleshowAccountMenu}>
          <Avatar src= {profileImage} alt="Remy Sharp" />
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
