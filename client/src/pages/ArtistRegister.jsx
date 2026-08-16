import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { CREATE_ARTIST } from "../utils/mutations";
import artist_auth from "../utils/artist_auth";
import InputAdornment from "@mui/material/InputAdornment";
import PasswordVisibilityToggle from "../components/PasswordVisibilityToggle.jsx";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
// import Link from '@mui/material/Link';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { alpha, styled, useTheme } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import { SitemarkIcon } from "../components/themeCustomization/customIcon";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  background: alpha(theme.palette.background.paper || "#111119", 0.95),
  backdropFilter: "blur(12px)",
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: theme.shadows[2],
  [theme.breakpoints.up("sm")]: {
    maxWidth: "480px",
  },
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
  fontFamily: theme.typography.fontFamily,
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(4, 2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(6, 3),
  },
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  background: `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `,
  overflowY: "auto",
  scrollBehavior: "smooth",
  WebkitOverflowScrolling: "touch",
}));

export default function ArtistRegister() {
  const theme = useTheme();
  const location = useLocation();
  const uploadFlowEmail = location.state?.fromUserUpload ? location.state?.email || "" : "";
  const isUserUploadFlow = Boolean(uploadFlowEmail);
  const [signupFormState, setSignupFormState] = useState({
    fullName: "",
    artistAka: "",
    email: uploadFlowEmail,
    password: "",
    country: "",
    region: "",
  });
  const [signupErrorMessage, setSignupErrorMessage] = useState("");
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [createArtist] = useMutation(CREATE_ARTIST);

  const navigate = useNavigate();
  const labelSx = {
    color: theme.palette.text.secondary,
    mb: 1,
    fontSize: 14,
  };
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      color: theme.palette.text.primary,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      '& fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.2),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.45),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: alpha(theme.palette.text.secondary, 0.75),
      opacity: 1,
    },
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupFormState({ ...signupFormState, [name]: value });
  };

  const handleTermsChange = (event) => {
    setIsTermsChecked(event.target.checked);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowPasswordSignup((prevState) => !prevState);
  };


  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (!isTermsChecked) {
      setSignupErrorMessage("You must agree to the terms and conditions.");
      return;
    }
    if (!signupFormState.country || !signupFormState.region) {
      setSignupErrorMessage("Please select your country and region.");
      return;
    }

    try {
      const artistInput = {
        fullName: signupFormState.fullName,
        artistAka: signupFormState.artistAka,
        email: signupFormState.email,
        country: signupFormState.country,
        region: signupFormState.region,
        ...(isUserUploadFlow ? {} : { password: signupFormState.password }),
      };
      const { data } = await createArtist({
        variables: artistInput,
      });

      artist_auth.login(data.createArtist.artistToken);

      if (isUserUploadFlow) {
        navigate("/artist/plan");
      } else {
        navigate("/artist/verification", { state: { email: signupFormState.email } });
      }

      setSignupErrorMessage("");
      setSignupFormState({
        fullName: "",
        artistAka: "",
        email: "",
        password: "",
        country: "",
        region: "",
      });

      
    } catch (e) {
      const gqlMessage = e?.graphQLErrors?.[0]?.message;
      const networkMessage =
        e?.networkError?.result?.errors?.[0]?.message ||
        e?.networkError?.result?.message;
      const errorMessage =
        gqlMessage || networkMessage || "Signup failed. Please ensure your details are correct.";
      setSignupErrorMessage(errorMessage);
      console.error("Create artist failed:", {
        message: e?.message,
        graphQLErrors: e?.graphQLErrors,
        networkError: e?.networkError,
      });
    }




  };

  return (
    <SignUpContainer
      direction="column"
      justifyContent="space-between"
    >
      <Card variant="outlined">
        <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: 'flex-start' }} />
        <Typography
          component="h1"
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontFamily: theme.typography.fontFamily,
            fontSize: "clamp(2rem, 8vw, 2.4rem)",
          }}
          
        >
          {isUserUploadFlow ? "Complete Creator Profile" : "Create Creator Profile"}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily, mb: 1 }}
        >
          {isUserUploadFlow
            ? "Add the creator details we need before your first upload."
            : "Complete your creator details to unlock uploads and your studio."}
        </Typography>

        <Box
          component="form"
          onSubmit={handleSignupSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Full Name */}
          <FormControl>
            <FormLabel htmlFor="fullName" sx={labelSx}>Full name</FormLabel>
            <TextField
              name="fullName"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.fullName}
              placeholder="Add your full name"
              sx={textFieldSx}
            />
          </FormControl>

          {/* Stage Name */}
          <FormControl>
            <FormLabel htmlFor="artistAka" sx={labelSx}>Stage name</FormLabel>
            <TextField
              name="artistAka"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.artistAka}
              placeholder="Add your stage name"
              sx={textFieldSx}
            />
          </FormControl>

          {/* Email */}
          <FormControl>
            <FormLabel htmlFor="email" sx={labelSx}>Email</FormLabel>
            <TextField
              name="email"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.email}
              placeholder="Add your email"
              InputProps={{ readOnly: isUserUploadFlow }}
              sx={textFieldSx}
            />
          </FormControl>

          {/* Country */}
          <FormControl>
            <FormLabel htmlFor="country" sx={labelSx}>Country</FormLabel>
            <TextField
              name="country"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.country}
              placeholder="Add your country"
              sx={textFieldSx}
            />
          </FormControl>

          {/* Region */}
          <FormControl>
            <FormLabel htmlFor="region" sx={labelSx}>Region</FormLabel>
            <TextField
              name="region"
              select
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.region}
              placeholder="Select region"
              sx={textFieldSx}
            >
              <MenuItem value="">Select region</MenuItem>
              {[
                "West Africa",
                "East Africa",
                "Southern Africa",
                "North Africa",
                "Central Africa",
                "Diaspora",
              ].map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          {!isUserUploadFlow && (
            <FormControl>
              <FormLabel htmlFor="password" sx={labelSx}>Password</FormLabel>
              <TextField
                name="password"
                required
                fullWidth
                type={showPasswordSignup ? "text" : "password"}
                onChange={handleSignupChange}
                value={signupFormState.password}
                sx={textFieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <PasswordVisibilityToggle
                        show={showPasswordSignup}
                        onClick={toggleSignupPasswordVisibility}
                        sx={{ color: "inherit" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          )}

          {/* Terms Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isTermsChecked}
                onChange={handleTermsChange}
                color="primary"
              />
            }
            sx={{
              color: theme.palette.text.secondary,
              '& a': {
                color: theme.palette.primary.main,
                fontWeight: 700,
              },
            }}
            label={
              <span>
                I have read{" "}
                <a href="/terms/artist" target="_blank" rel="noreferrer">
                  terms and conditions
                </a>{" "}
                of using Flolup.
              </span>
            }
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.75,
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #E4C421, #B25035)',
              color: '#000',
              fontSize: 16,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: theme.shadows[2],
              '&:hover': {
                background: 'linear-gradient(90deg, #F8D347, #C96146)',
                transform: 'translateY(-2px)',
              },
            }}
          >
          {isUserUploadFlow ? "Continue to Uploads" : "Continue"}
        </Button>

          {signupErrorMessage && (
            <Typography sx={{ color: "#FF4D4D", textAlign: "center", mt: 1, fontSize: 14 }}>
              {signupErrorMessage}
            </Typography>
          )}

          {!isUserUploadFlow && (
            <Typography
              component={Link}
              to="/artist/login" 
              variant="contained"
              color="primary"
              sx={{ textTransform: "none", textAlign: 'center', fontWeight: 700 }}
            >
              Already completed your creator profile?
            </Typography>
          )}

          <Button
            component={Link}
            to="/"
            variant="text"
            color="inherit"
            sx={{
              mt: 1,
              alignSelf: 'center',
              color: theme.palette.text.primary,
              fontWeight: 600,
              '&:hover': { color: theme.palette.primary.main, background: 'transparent' },
            }}
          >
            ← Back to home
          </Button>

        </Box>
      </Card>
    </SignUpContainer>
  );
}
