import { GET_PRESIGNED_URL_DOWNLOAD, LOGIN_USER } from "../../utils/mutations";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import CampaignIcon from "@mui/icons-material/Campaign";
import CelebrationIcon from "@mui/icons-material/Celebration";
import DevicesIcon from "@mui/icons-material/Devices";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HotelIcon from "@mui/icons-material/Hotel";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import RadioIcon from "@mui/icons-material/Radio";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TvIcon from "@mui/icons-material/Tv";
import { SitemarkIcon } from "../../components/themeCustomization/customIcon";
import UserAuth from "../../utils/auth";
import { LoginForm } from "../LoginSignin";

const HERO_IMAGE = {
  bucket: "business-licencing",
  key: "business-images/business-hero-flolup.webp",
  region: "us-east-2",
};

const BUSINESS_LICENSE_SONG_TARGET = 2000;

const CATALOGUE_SONG_COUNT = gql`
  query CatalogueSongCount {
    catalogueSongCount
  }
`;

const BUSINESS_ACCOUNT_STATUS = gql`
  query BusinessAccountStatus($email: String!) {
    businessAccountStatus(email: $email) {
      exists
      email
      usageType
    }
  }
`;

const START_BUSINESS_ONBOARDING = gql`
  mutation StartBusinessOnboarding($input: BusinessOnboardingInput!) {
    startBusinessOnboarding(input: $input) {
      success
      message
      email
      verificationCode
    }
  }
`;

const VERIFY_BUSINESS_PHONE = gql`
  mutation VerifyBusinessPhone($email: String!, $code: String!) {
    verifyBusinessPhone(email: $email, code: $code) {
      success
      message
      email
    }
  }
`;

const COMPLETE_BUSINESS_ONBOARDING = gql`
  mutation CompleteBusinessOnboarding($email: String!, $password: String!) {
    completeBusinessOnboarding(email: $email, password: $password) {
      userToken
      user {
        _id
        username
        email
        role
        usageType
      }
    }
  }
`;

const BUSINESS_TYPES = [
  { label: "Bar, Restaurant or Brewery", slug: "bar-restaurant-brewery", Icon: LocalBarIcon },
  { label: "Retail", slug: "retail", Icon: StorefrontIcon },
  { label: "Events", slug: "events", Icon: CelebrationIcon },
  { label: "Hotel or Lodging", slug: "hotel-lodging", Icon: HotelIcon },
  { label: "Fitness Club", slug: "fitness-club", Icon: FitnessCenterIcon },
  { label: "Radio", slug: "radio", Icon: RadioIcon },
  { label: "Television", slug: "television", Icon: TvIcon },
  { label: "Website or Mobile App", slug: "website-mobile-app", Icon: DevicesIcon },
  { label: "Political Entities", slug: "political-entities", Icon: CampaignIcon },
];

const INTER_FONT = "'Inter', sans-serif";

const BusinessLicenseAppBar = () => {
  const theme = useTheme();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: theme.zIndex.appBar,
        width: "100%",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.default, 0.94),
        backdropFilter: "blur(12px)",
      }}
    >
      <Box
        component="nav"
        aria-label="Business licensing"
        sx={{
          maxWidth: 1180,
          margin: "0 auto",
          minHeight: 72,
          px: { xs: 2, sm: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          component="a"
          href="/"
          aria-label="FloLup home"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.25,
            color: "inherit",
            textDecoration: "none",
            fontWeight: 800,
            lineHeight: 1,
            minWidth: 0,
            "&:hover .business-logo-text": {
              color: "primary.main",
            },
          }}
        >
          <SitemarkIcon sx={{ width: 38, height: 38, color: "primary.main" }} />
          <Typography
            component="span"
            className="business-logo-text"
            variant="h6"
            sx={{
              fontWeight: 800,
              lineHeight: 1,
              color: "text.primary",
              transition: theme.transitions.create("color", {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            FloLup
          </Typography>
        </Box>

        <Button
          component="a"
          href="/business/login"
          variant="contained"
          color="primary"
          sx={{
            minHeight: 42,
            px: 2.25,
            borderRadius: 1,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Getting Started
        </Button>
      </Box>
    </Box>
  );
};

const BusinessLicenseHero = ({ heroImageUrl, imageError, loading, onViewPlans }) => {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        maxWidth: 1180,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 5, md: 7 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "0.78fr 1.22fr" },
        gridTemplateAreas: {
          xs: `"intro" "visual" "steps" "actions"`,
          md: `"intro visual" "steps visual" "actions visual"`,
        },
        alignItems: "center",
        columnGap: { md: 6 },
        rowGap: { xs: 3.5, md: 0 },
        minHeight: { md: "calc(100vh - 96px)" },
      }}
    >
      <Box sx={{ gridArea: "intro", maxWidth: 460 }}>
        <Typography
          component="p"
          variant="overline"
          sx={{
            color: "primary.main",
            fontWeight: 800,
            letterSpacing: 0,
            mb: 1,
            display: "block",
          }}
        >
          Business Music Licensing
        </Typography>

        <Typography
          component="h1"
          variant="h2"
          sx={{
            fontWeight: 850,
            lineHeight: 1.08,
            maxWidth: 460,
            fontSize: { xs: "2rem", sm: "2.4rem", md: "3rem" },
            letterSpacing: 0,
          }}
        >
          Licensed music for your business, without the paperwork.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mt: 2.5,
            color: "text.secondary",
            maxWidth: 420,
            fontSize: { xs: "0.98rem", md: "1.02rem" },
            lineHeight: 1.65,
          }}
        >
          Activate a monthly license, play cleared catalogue music, and keep your public space compliant.
        </Typography>
      </Box>

      <Box
        sx={{
          gridArea: "visual",
          position: "relative",
          minHeight: { xs: 430, md: 610 },
          display: "grid",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: { xs: "18px 0 auto 8%", md: "8px 0 auto 10%" },
            height: { xs: 330, md: 520 },
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.14),
          }}
        />

        <Box
          sx={{
            position: "relative",
            width: { xs: "100%", md: "96%" },
            justifySelf: "end",
            aspectRatio: { xs: "1.08", sm: "1.35", md: "1.08" },
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: theme.shadows[10],
          }}
        >
          {heroImageUrl ? (
            <Box
              component="img"
              src={heroImageUrl}
              alt="FloLup business licensing app preview"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                px: 3,
                textAlign: "center",
                color: imageError ? "error.main" : "text.secondary",
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {imageError || (loading ? "Loading preview..." : "Preview unavailable")}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: { xs: 14, md: -18 },
            bottom: { xs: 18, md: 48 },
            width: { xs: "68%", sm: 300 },
            borderRadius: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: theme.shadows[6],
            p: 1.75,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
            Simple Coverage
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 900, lineHeight: 1.2 }}>
            One license for public music use
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.5 }}>
            Built for any business or organization that plays music for customers, guests, staff, or audiences.
          </Typography>
          <Button
            component="a"
            href="/business/login"
            variant="text"
            sx={{
              mt: 1,
              px: 0,
              minWidth: 0,
              fontWeight: 800,
              justifyContent: "flex-start",
            }}
          >
            Start licensing
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          gridArea: "steps",
          display: "grid",
          maxWidth: 400,
          alignSelf: "start",
          mt: { md: 3.5 },
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {["Select business type", "Activate license", "Play cleared music"].map((label, index) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              alignItems: "center",
              gap: 1.25,
              px: 2,
              py: 1.6,
              borderBottom: index === 2 ? 0 : 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {index + 1}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          gridArea: "actions",
          mt: { md: 3.5 },
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignSelf: "start",
        }}
      >
        <Button component="a" href="/business/login" variant="contained">
          Getting Started
        </Button>
        <Button onClick={onViewPlans} variant="outlined">
          Business types
        </Button>
      </Box>
    </Box>
  );
};





const BusinessLicenseLockedModal = ({ businessType, onClose, songCount, loading, error }) => {
  const theme = useTheme();
  const remainingSongs = Math.max(BUSINESS_LICENSE_SONG_TARGET - songCount, 0);

  return (
    <Dialog
      open={Boolean(businessType)}
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
        {businessType?.label || "Business licence"}
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

const BusinessGettingStartedModal = ({
  open,
  step,
  email,
  form,
  code,
  password,
  loginPassword,
  verificationCode,
  error,
  loading,
  onClose,
  onUseCurrentEmail,
  onNeedDifferentEmail,
  onFormChange,
  onCodeChange,
  onPasswordChange,
  onLoginPasswordChange,
  onLogin,
  onSubmitBusinessDetails,
  onVerifyPhone,
  onComplete,
}) => {
  const theme = useTheme();
  const heroGradient = `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `;
  const isLoginStep = step === "login" || step === "business-login";
  const loginFormState = {
    email,
    password: loginPassword,
  };
  const handleLoginChange = (event) => {
    if (event.target.name === "password") {
      onLoginPasswordChange(event.target.value);
      return;
    }

    onFormChange(event);
  };
  const sharedFieldSx = {
    "& .MuiInputBase-root": {
      borderRadius: 1.5,
      fontFamily: INTER_FONT,
    },
  };

  if (isLoginStep) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        <LoginForm
          heroGradient={heroGradient}
          theme={theme}
          loginFormState={loginFormState}
          handleLoginChange={handleLoginChange}
          handleLoginSubmit={onLogin}
          handleGoogleLogin={() => {}}
          showPasswordLogin={false}
          toggleShowPasswordLogin={() => {}}
          loginErrorMessage={error}
          title="Business Login"
          subtitle={step === "business-login" ? "This email already has business access." : "Continue with your business account."}
          submitLabel={loading ? "Checking..." : "Continue"}
          emailLabel="What is your email?"
          onForgotPassword={() => {}}
          onSwitchToSignup={() => {}}
          onBackHome={onClose}
          showSignupPrompt={false}
          showPasswordField={false}
          showForgotPassword={false}
          backHomeLabel="Cancel"
          compact
        />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          fontFamily: INTER_FONT,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 900, fontFamily: INTER_FONT }}>
        Business Getting Started
      </DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {step === "checking" && (
          <Typography sx={{ color: "text.secondary", fontFamily: INTER_FONT }}>
            Checking your account...
          </Typography>
        )}

        {step === "login" && (
          <Box component="form" onSubmit={onLogin} sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.6, fontFamily: INTER_FONT }}>
              Sign in with the email you want to use for business licensing.
            </Typography>
            <TextField
              label="Email"
              name="email"
              value={email}
              onChange={onFormChange}
              fullWidth
              required
              sx={sharedFieldSx}
            />
            <TextField
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
              fullWidth
              required
              sx={sharedFieldSx}
            />
          </Box>
        )}

        {step === "business-login" && (
          <Box component="form" onSubmit={onLogin} sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.6, fontFamily: INTER_FONT }}>
              This email already has business usage. Log in to continue.
            </Typography>
            <TextField label="Email" value={email} fullWidth disabled sx={sharedFieldSx} />
            <TextField
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
              fullWidth
              required
              sx={sharedFieldSx}
            />
          </Box>
        )}

        {step === "use-email" && (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.6, fontFamily: INTER_FONT }}>
              Use this email for your business license?
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1.5,
                px: 2,
                py: 1.5,
                bgcolor: "background.default",
              }}
            >
              <Typography sx={{ fontWeight: 800, fontFamily: INTER_FONT }}>{email}</Typography>
            </Box>
          </Box>
        )}

        {step === "details" && (
          <Box component="form" onSubmit={onSubmitBusinessDetails} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Business name"
              name="businessName"
              value={form.businessName}
              onChange={onFormChange}
              fullWidth
              required
              sx={sharedFieldSx}
            />
            <TextField
              select
              label="Business type"
              name="businessType"
              value={form.businessType}
              onChange={onFormChange}
              fullWidth
              required
              sx={sharedFieldSx}
            >
              {BUSINESS_TYPES.map((businessType) => (
                <MenuItem key={businessType.slug} value={businessType.label}>
                  {businessType.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Phone number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={onFormChange}
              fullWidth
              required
              sx={sharedFieldSx}
            />
            <TextField
              label="Address"
              name="address"
              value={form.address}
              onChange={onFormChange}
              fullWidth
              required
              multiline
              minRows={2}
              sx={sharedFieldSx}
            />
          </Box>
        )}

        {step === "verify-phone" && (
          <Box component="form" onSubmit={onVerifyPhone} sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.6, fontFamily: INTER_FONT }}>
              Enter the verification code for your business phone number.
            </Typography>
            {verificationCode && (
              <Alert severity="info">
                Verification code: {verificationCode}
              </Alert>
            )}
            <TextField
              label="Verification code"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              fullWidth
              required
              sx={sharedFieldSx}
            />
          </Box>
        )}

        {step === "password" && (
          <Box component="form" onSubmit={onComplete} sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.6, fontFamily: INTER_FONT }}>
              Create the password for business access.
            </Typography>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              fullWidth
              required
              sx={sharedFieldSx}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} variant="text" color="inherit">
          Cancel
        </Button>
        {step === "use-email" && (
          <>
            <Button onClick={onNeedDifferentEmail} variant="outlined">
              Use different email
            </Button>
            <Button onClick={onUseCurrentEmail} variant="contained" disabled={loading}>
              Yes, use this email
            </Button>
          </>
        )}
        {(step === "login" || step === "business-login") && (
          <Button onClick={onLogin} variant="contained" disabled={loading}>
            Continue
          </Button>
        )}
        {step === "details" && (
          <Button onClick={onSubmitBusinessDetails} variant="contained" disabled={loading}>
            Verify phone
          </Button>
        )}
        {step === "verify-phone" && (
          <Button onClick={onVerifyPhone} variant="contained" disabled={loading}>
            Verify
          </Button>
        )}
        {step === "password" && (
          <Button onClick={onComplete} variant="contained" disabled={loading}>
            Continue to plans
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const BusinessToLicense = ({ visible, sectionRef, onBusinessTypeClick }) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Box
      ref={sectionRef}
      component="section"
      id="business-license-plans"
      sx={{
        scrollMarginTop: 96,
        maxWidth: 1180,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 6, md: 8 },
        fontFamily: INTER_FONT,
      }}
    >
      <Box sx={{ maxWidth: 620, mb: 4 }}>
        <Typography
          component="p"
          variant="overline"
          sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 0, fontFamily: INTER_FONT }}
        >
          Business types
        </Typography>
        <Typography
          component="h2"
          variant="h5"
          sx={{ mt: 1, fontWeight: 900, letterSpacing: 0, fontFamily: INTER_FONT }}
        >
          Playing Music in Your Business? Choose the Right License for Your Space.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {BUSINESS_TYPES.map((businessType) => {
          const Icon = businessType.Icon;

          return (
          <Box
            key={businessType.slug}
            component="button"
            type="button"
            onClick={() => onBusinessTypeClick(businessType)}
            sx={{
              minHeight: 118,
              borderRadius: 3,
              border: 0,
              bgcolor: "background.paper",
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              cursor: "pointer",
              textAlign: "left",
              color: "text.primary",
              textDecoration: "none",
              fontFamily: INTER_FONT,
              boxShadow: "none",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              appearance: "none",
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
              },
            }}
          >
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  color: "primary.main",
                }}
              >
                <Icon fontSize="small" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.25,
                  color: "text.primary",
                  fontFamily: INTER_FONT,
                }}
              >
                {businessType.label}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "primary.main",
                fontWeight: 800,
                lineHeight: 1.5,
                fontFamily: INTER_FONT,
              }}
            >
              Learn more
            </Typography>
          </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const BusinessLicenseOverview = () => {
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState(null);
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false);
  const [gettingStartedStep, setGettingStartedStep] = useState("checking");
  const [gettingStartedError, setGettingStartedError] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    businessType: "",
    phoneNumber: "",
    address: "",
  });
  const plansRef = useRef(null);
  const [getPresignedUrlDownload, { loading }] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getBusinessAccountStatus, { loading: statusLoading }] = useLazyQuery(BUSINESS_ACCOUNT_STATUS, {
    fetchPolicy: "network-only",
  });
  const [loginUser, { loading: loginLoading }] = useMutation(LOGIN_USER);
  const [startBusinessOnboarding, { loading: startBusinessLoading }] = useMutation(START_BUSINESS_ONBOARDING);
  const [verifyBusinessPhone, { loading: verifyPhoneLoading }] = useMutation(VERIFY_BUSINESS_PHONE);
  const [completeBusinessOnboarding, { loading: completeBusinessLoading }] = useMutation(COMPLETE_BUSINESS_ONBOARDING);
  const {
    data: songCountData,
    loading: songCountLoading,
    error: songCountError,
  } = useQuery(CATALOGUE_SONG_COUNT, {
    fetchPolicy: "cache-and-network",
  });
  const catalogueSongCount = songCountData?.catalogueSongCount ?? 0;
  const gettingStartedLoading =
    statusLoading || loginLoading || startBusinessLoading || verifyPhoneLoading || completeBusinessLoading;

  const handleViewPlans = () => {
    setShowPlans(true);
    window.requestAnimationFrame(() => {
      plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resetGettingStartedFlow = () => {
    setGettingStartedOpen(false);
    setGettingStartedStep("checking");
    setGettingStartedError("");
    setLoginPassword("");
    setVerificationCode("");
    setPhoneCode("");
    setBusinessPassword("");
  };

  const handleBusinessFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "email") {
      setBusinessEmail(value);
      return;
    }

    setBusinessForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const checkBusinessEmail = async (email) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      setGettingStartedStep("login");
      return;
    }

    setBusinessEmail(normalizedEmail);
    const { data } = await getBusinessAccountStatus({ variables: { email: normalizedEmail } });
    const status = data?.businessAccountStatus;

    if (status?.usageType === "business") {
      setGettingStartedStep("business-login");
      return;
    }

    setGettingStartedStep("use-email");
  };

  const handleOpenGettingStarted = async () => {
    setGettingStartedOpen(true);
    setGettingStartedStep("checking");
    setGettingStartedError("");

    try {
      const profile = UserAuth.loggedIn() ? UserAuth.getProfile() : null;
      const email = profile?.data?.email;

      if (!email) {
        setGettingStartedStep("login");
        return;
      }

      await checkBusinessEmail(email);
    } catch (error) {
      setGettingStartedError(error.message || "Unable to check this account.");
      setGettingStartedStep("login");
    }
  };

  const handleBusinessLogin = async (event) => {
    event?.preventDefault();
    setGettingStartedError("");

    try {
      const { data } = await loginUser({
        variables: {
          email: businessEmail.trim().toLowerCase(),
          password: loginPassword,
        },
      });
      const token = data?.login?.userToken;
      const user = data?.login?.user;

      if (!token || !user) {
        throw new Error("Login failed.");
      }

      localStorage.setItem("user_id_token", token);
      localStorage.setItem("lastLogin", "user");

      if (user.usageType === "business") {
        resetGettingStartedFlow();
        handleViewPlans();
        return;
      }

      setGettingStartedStep("use-email");
    } catch (error) {
      setGettingStartedError(error.message || "Unable to log in.");
    }
  };

  const handleSubmitBusinessDetails = async (event) => {
    event?.preventDefault();
    setGettingStartedError("");

    try {
      const { data } = await startBusinessOnboarding({
        variables: {
          input: {
            email: businessEmail.trim().toLowerCase(),
            businessName: businessForm.businessName,
            businessType: businessForm.businessType,
            phoneNumber: businessForm.phoneNumber,
            address: businessForm.address,
          },
        },
      });

      setVerificationCode(data?.startBusinessOnboarding?.verificationCode || "");
      setGettingStartedStep("verify-phone");
    } catch (error) {
      setGettingStartedError(error.message || "Unable to save business details.");
    }
  };

  const handleVerifyPhone = async (event) => {
    event?.preventDefault();
    setGettingStartedError("");

    try {
      await verifyBusinessPhone({
        variables: {
          email: businessEmail.trim().toLowerCase(),
          code: phoneCode.trim(),
        },
      });
      setGettingStartedStep("password");
    } catch (error) {
      setGettingStartedError(error.message || "Unable to verify phone number.");
    }
  };

  const handleCompleteBusinessOnboarding = async (event) => {
    event?.preventDefault();
    setGettingStartedError("");

    try {
      const { data } = await completeBusinessOnboarding({
        variables: {
          email: businessEmail.trim().toLowerCase(),
          password: businessPassword,
        },
      });
      const token = data?.completeBusinessOnboarding?.userToken;

      if (!token) {
        throw new Error("Business account was not completed.");
      }

      localStorage.setItem("user_id_token", token);
      localStorage.setItem("lastLogin", "user");
      resetGettingStartedFlow();
      handleViewPlans();
    } catch (error) {
      setGettingStartedError(error.message || "Unable to complete business onboarding.");
    }
  };

  useEffect(() => {
    let isPageLoaded = true;

    const loadHeroImage = async () => {
      try {
        const { data } = await getPresignedUrlDownload({ variables: HERO_IMAGE });
        const signedUrl = data?.getPresignedUrlDownload?.url;

        if (isPageLoaded && signedUrl) {
          setHeroImageUrl(signedUrl);
        }
      } catch {
        if (isPageLoaded) {
          setImageError("Unable to load image");
        }
      }
    };

    loadHeroImage();

    return () => {
      isPageLoaded = false;
    };
  }, [getPresignedUrlDownload]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        fontFamily: INTER_FONT,
      }}
    >
      <BusinessLicenseAppBar />

      <BusinessLicenseHero
        heroImageUrl={heroImageUrl}
        imageError={imageError}
        loading={loading}
        onViewPlans={handleViewPlans}
      />

      <BusinessToLicense
        visible={showPlans}
        sectionRef={plansRef}
        onBusinessTypeClick={setSelectedBusinessType}
      />

      <BusinessLicenseLockedModal
        businessType={selectedBusinessType}
        onClose={() => setSelectedBusinessType(null)}
        songCount={catalogueSongCount}
        loading={songCountLoading}
        error={songCountError}
      />

      <BusinessGettingStartedModal
        open={gettingStartedOpen}
        step={gettingStartedStep}
        email={businessEmail}
        form={businessForm}
        code={phoneCode}
        password={businessPassword}
        loginPassword={loginPassword}
        verificationCode={verificationCode}
        error={gettingStartedError}
        loading={gettingStartedLoading}
        onClose={resetGettingStartedFlow}
        onUseCurrentEmail={() => setGettingStartedStep("details")}
        onNeedDifferentEmail={() => setGettingStartedStep("login")}
        onFormChange={handleBusinessFormChange}
        onCodeChange={setPhoneCode}
        onPasswordChange={setBusinessPassword}
        onLoginPasswordChange={setLoginPassword}
        onLogin={handleBusinessLogin}
        onSubmitBusinessDetails={handleSubmitBusinessDetails}
        onVerifyPhone={handleVerifyPhone}
        onComplete={handleCompleteBusinessOnboarding}
      />

      {/* section */}
      <section id="getting-started">
      </section>
    </Box>
  );
};

export default BusinessLicenseOverview;
