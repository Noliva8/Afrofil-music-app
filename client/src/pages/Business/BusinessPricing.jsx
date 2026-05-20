import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import UserAuth from "../../utils/auth";
import BusinessAppBar from "./BusinessAppBar";

const BUSINESS_LICENSE_SONG_TARGET = 2000;

const CATALOGUE_SONG_COUNT = gql`
  query CatalogueSongCount {
    catalogueSongCount
  }
`;

const BUSINESS_ACCOUNT_STATUS = gql`
  query BusinessAccountStatus($email: String!) {
    businessAccountStatus(email: $email) {
      isBusinessProfileComplete
      businessName
    }
  }
`;

const BUSINESS_TYPES = [
  "Bar, Restaurant or Brewery",
  "Retail",
  "Events",
  "Hotel or Lodging",
  "Fitness Club",
  "Radio",
  "Television",
  "Website or Mobile App",
  "Political Entities",
];

const businessTypeToSlug = (businessType) =>
  businessType
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const EVENT_PRICE_OPTIONS = [
  {
    title: "Small event",
    description: "For public events with fewer than 500 people.",
    price: "Price pending",
  },
  {
    title: "Big event",
    description: "For public events with more than 500 people.",
    price: "Price pending",
  },
];

const DEFAULT_PRICE_OPTIONS = [
  {
    title: "Single location",
    description: "Music licensing for one public business location.",
    price: "Price pending",
  },
  {
    title: "Multiple locations",
    description: "Music licensing for two or more public business locations.",
    price: "Price pending",
  },
];

const BusinessLicenseLockedModal = ({ option, onClose, songCount, loading, error }) => {
  const theme = useTheme();
  const remainingSongs = Math.max(BUSINESS_LICENSE_SONG_TARGET - songCount, 0);

  return (
    <Dialog
      open={Boolean(option)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 900 }}>
        {option?.title || "Business licence"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
          We will start selling this licence once we have {BUSINESS_LICENSE_SONG_TARGET.toLocaleString()} songs.
          We currently have{" "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
            {loading ? "..." : songCount.toLocaleString()}
          </Box>{" "}
          songs.
        </Typography>

        {error && (
          <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700 }}>
            Unable to load the current song count.
          </Typography>
        )}

        {!loading && !error && (
          <Box
            sx={{
              borderRadius: 1.5,
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.24),
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              px: 2,
              py: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
              {remainingSongs > 0
                ? `${remainingSongs.toLocaleString()} more songs needed before launch.`
                : "This licence is ready for launch."}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BusinessPricing = () => {
  const theme = useTheme();
  const { businessTypeSlug } = useParams();
  const [selectedPriceOption, setSelectedPriceOption] = useState(null);
  const profile = UserAuth.loggedIn() ? UserAuth.getProfile() : null;
  const email = profile?.data?.email || "";
  const { data: businessStatusData } = useQuery(BUSINESS_ACCOUNT_STATUS, {
    variables: { email },
    skip: !email,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: songCountData,
    loading: songCountLoading,
    error: songCountError,
  } = useQuery(CATALOGUE_SONG_COUNT, {
    fetchPolicy: "cache-and-network",
  });
  const showBusinessAppBar = Boolean(
    profile?.data?.isBusinessProfileComplete ||
    businessStatusData?.businessAccountStatus?.isBusinessProfileComplete
  );
  const businessName = businessStatusData?.businessAccountStatus?.businessName || "";
  const catalogueSongCount = songCountData?.catalogueSongCount ?? 0;

  const businessType = useMemo(
    () => BUSINESS_TYPES.find((type) => businessTypeToSlug(type) === businessTypeSlug) || "Business",
    [businessTypeSlug]
  );
  const isEventPricing = businessTypeToSlug(businessType) === "events";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {showBusinessAppBar && <BusinessAppBar businessName={businessName} />}
      <Box
        sx={{
          width: "100%",
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: { xs: 4, md: 7 },
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 0 }}>
          Business Licensing
        </Typography>
        <Typography variant="h4" component="h1" sx={{ mt: 1, fontWeight: 900, lineHeight: 1.15, color: "text.primary" }}>
          Pricing for {businessType}
        </Typography>
        <Typography sx={{ mt: 1.5, maxWidth: 680, color: "text.secondary", lineHeight: 1.7 }}>
          Select the license that matches how your business plays music. Phone verification will happen when you are ready to pay.
        </Typography>

        <Box
          sx={{
            mt: 4,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {(isEventPricing ? EVENT_PRICE_OPTIONS : DEFAULT_PRICE_OPTIONS).map((option) => (
            <Box
              key={option.title}
              sx={{
                minHeight: { xs: 340, md: 380 },
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.primary",
                p: { xs: 3, sm: 4 },
                textAlign: "left",
                fontFamily: theme.typography.fontFamily,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: theme.shadows[1],
                transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "primary.main",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary" }}>
                  {option.title}
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.6 }}>
                  {option.description}
                </Typography>
              </Box>

              <Box sx={{ mt: 6 }}>
                <Typography sx={{ color: "primary.main", fontWeight: 900, fontSize: { xs: "1.75rem", sm: "2rem" }, lineHeight: 1 }}>
                  {option.price}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setSelectedPriceOption(option)}
                  sx={{
                    mt: 2.5,
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    fontFamily: theme.typography.fontFamily,
                    bgcolor: "#fff",
                    color: "#000",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.common.white, 0.88),
                      color: "#000",
                    },
                  }}
                >
                  Select to pay
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <BusinessLicenseLockedModal
        option={selectedPriceOption}
        onClose={() => setSelectedPriceOption(null)}
        songCount={catalogueSongCount}
        loading={songCountLoading}
        error={songCountError}
      />
    </Box>
  );
};

export default BusinessPricing;
