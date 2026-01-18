import './CSS/signup.css'
import logo from "../images/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { ARTIST_LOGIN, CREATE_ARTIST } from "../utils/mutations";
import artist_auth from "../utils/artist_auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
// import Link from '@mui/material/Link';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
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

  boxShadow:
    "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  
 
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  position: 'relative',
  backgroundColor: theme.palette.background.default,
  
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      theme.palette.mode === 'dark'
        ? "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))"
        : "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
  },
}));

export default function ArtistRegister() {
  const [signupFormState, setSignupFormState] = useState({
    fullName: "",
    artistAka: "",
    email: "",
    password: "",
    country: "",
    region: "",
  });
  const [signupErrorMessage, setSignupErrorMessage] = useState("");
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [createArtist] = useMutation(CREATE_ARTIST);

  const navigate = useNavigate();

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
      const { data } = await createArtist({
        variables: { ...signupFormState },
      });

      artist_auth.login(data.createArtist.artistToken);
      console.log('Email being passed to verification:', signupFormState.email);

      // navigate("/artist/login"); 
       navigate("/artist/verification", { state: { email: signupFormState.email } });

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
    <SignUpContainer className='signupage'
      direction="column"
      justifyContent="space-between"
    >
      <Card variant="outlined">
        <SitemarkIcon />
        <Typography
          component="h1"
          variant="h4"
          sx={{ fontSize: "clamp(2rem, 10vw, 2.6rem)" }}
          
        >
          Sign up
        </Typography>

        <Box
          component="form"
          onSubmit={handleSignupSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Full Name */}
          <FormControl>
            <FormLabel htmlFor="fullName">Full name</FormLabel>
            <TextField
              name="fullName"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.fullName}
              placeholder="Logan Keron"
            />
          </FormControl>

          {/* Stage Name */}
          <FormControl>
            <FormLabel htmlFor="artistAka">Stage name</FormLabel>
            <TextField
              name="artistAka"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.artistAka}
              placeholder="Loka"
            />
          </FormControl>

          {/* Email */}
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              name="email"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.email}
              placeholder="your@email.com"
            />
          </FormControl>

          {/* Country */}
          <FormControl>
            <FormLabel htmlFor="country">Country</FormLabel>
            <TextField
              name="country"
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.country}
              placeholder="Nigeria"
            />
          </FormControl>

          {/* Region */}
          <FormControl>
            <FormLabel htmlFor="region">Region</FormLabel>
            <TextField
              name="region"
              select
              required
              fullWidth
              onChange={handleSignupChange}
              value={signupFormState.region}
              placeholder="Select region"
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

          {/* Password */}
          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              name="password"
              required
              fullWidth
              type={showPasswordSignup ? "text" : "password"}
              onChange={handleSignupChange}
              value={signupFormState.password}
              placeholder="••••••"
              InputProps={{
                endAdornment: (
                  <FontAwesomeIcon
                    icon={showPasswordSignup ? faEye : faEyeSlash}
                    style={{ cursor: "pointer", marginRight: "10px" }}
                    onClick={toggleSignupPasswordVisibility}
                  />
                ),
              }}
            />
          </FormControl>

          {/* Terms Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isTermsChecked}
                onChange={handleTermsChange}
                color="primary"
              />
            }
            label={
              <span>
                I have read{" "}
                <a href="/terms" target="_blank" rel="noreferrer">
                  terms and conditions
                </a>{" "}
                of using Afrofeel.
              </span>
            }
          />

          <Button type="submit" fullWidth variant="contained">
          Sign up
        </Button>

          {signupErrorMessage && (
            <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>
              {signupErrorMessage}
            </Typography>
          )}

          <Typography
            component={Link}
            to="/artist/login" 
            variant="contained"
            color="primary"
            className='artistRegistAccount'
            sx={{ textTransform: "none" }}
          >
            Already have an account?
          </Typography>

          <Button
            component={Link}
            to="/"
            variant="text"
            color="inherit"
            sx={{ mt: 1, alignSelf: 'center' }}
          >
            ← Back to home
          </Button>

        </Box>
      </Card>
    </SignUpContainer>
  );
}
