import { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import ArtistAuth from '../utils/artist_auth';
import { useTheme, alpha } from '@mui/material/styles';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';




const ArtistVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(""); // Define status state
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [showSentTick, setShowSentTick] = useState(false);

  const profile = ArtistAuth.getProfile();

  const email = profile?.data?.email;
  const artistAka = profile?.data?.artistAka;
  const theme = useTheme();
  const heroGradient = `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 25%),
    linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.paper})
  `;

  console.log("Profile:", profile); // Debugging profile

  // Function to check confirmation and plan status
  const checkConfirmationStatus = async (email) => {
    try {
      console.log("Making API call with email:", email);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/confirmationStatusAndPlanStatus`,
        { email }
      );

      if (response.status !== 200) {
        throw new Error("Failed to fetch confirmation status.");
      }

      return response.data;
    } catch (error) {
      console.error("Error checking confirmation status:", error);
      throw error;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    if (statusParam === "expired") {
      setStatus("This verification link has expired. Please request a new one.");
      setLoading(false);
      return;
    }
    if (statusParam === "invalid") {
      setStatus("This verification link is invalid. Please request a new one.");
      setLoading(false);
      return;
    }

    const verifyConfirmation = async () => {
      try {
        if (email) {
          // console.log("Checking confirmation for email:", email);
          const data = await checkConfirmationStatus(email);
          // console.log("Data received from API:", data);

          if (!data) {
            // console.error("No data received. Staying on verification page.");
            setStatus("Failed to fetch your account details. Please try again.");
            setLoading(false);
            return;
          }

          if (!data.confirmed) {
            // console.error("Email not confirmed. Staying on verification page.");
            setStatus("Your email is not confirmed. Please check your inbox.");
            setLoading(false);
            return;
          }

          // Check if selectedPlan is true
          if (!data.selectedPlan) {
            // console.error("Plan not selected. Redirecting to plan selection page.");
            setStatus("Please select a plan.");
            navigate("/artist/plan"); // Navigate to plan selection page
            return;
          }

          // Once selectedPlan is true, check the actual plan
          const userPlan = data.plan;  // Get the value of plan field
          // console.log("Plan selected:", userPlan);

          setStatus("You are verified!");
          // console.log("Verification complete. Redirecting to dashboard.");

          // Navigate based on the selected plan
          if (userPlan === "Pro Plan") {
            navigate("/artist/dashboard/ProPlan");
          } else if (userPlan === "Premium Plan") {
            navigate("/artist/dashboard/premium");
          } else if (userPlan === "Free Plan") {
            navigate("/artist/studio/home");
          } else {
            // console.error("Unknown plan type. Please check your plan status.");
            setStatus("An error occurred while fetching your plan status.");
            setLoading(false);
          }
        } else {
          console.error("Email not found in profile.");
          setStatus("No email provided for verification.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error during verification:", error);
        setStatus("An error occurred during verification. Please try again later.");
        setLoading(false);
      }
    };

    verifyConfirmation(); // Call the verification function
  }, [email, navigate, location.search]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const intervalId = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [resendCooldown]);





  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;
    try {
      setIsResending(true);

      const freshStatus = await checkConfirmationStatus(email);
      if (freshStatus?.confirmed) {
        localStorage.setItem('artist_confirmed', 'true');
        setStatus("Your email is already verified—taking you to login shortly.");
        setTimeout(() => navigate("/artist/login"), 1500);
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/graphql`, {
        query: `
          mutation ResendVerificationEmail($email: String!) {
            resendVerificationEmail(email: $email) {
              success
              message
            }
          }
        `,
        variables: { email }
      });
      setStatus("Verification email resent. Please check your inbox.");
      setShowSentTick(true);
      setResendCooldown(10);
      setTimeout(() => {
        setShowSentTick(false);
        setResendCooldown(0);
      }, 10000);
    } catch (error) {
      console.error("Error resending verification email:", error);
      setStatus("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };
  



  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 5 },
        backgroundImage: heroGradient,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '100%', sm: 500, md: 550 },
          width: '100%',
          margin: '0 auto',
          padding: { xs: 3, sm: 4 },
          backgroundColor: alpha(theme.palette.background.paper, 0.92),
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          textAlign: 'center',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ alignSelf: 'flex-start', mb: 2 }}>
                <SitemarkIcon sx={{ width: 96, height: 96 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  fontWeight: 600,
                  mb: 1,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Welcome to FloLup! 🎵
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '1rem',
                }}
              >
                Hi {artistAka || 'Artist'},
              </Typography>
            </Box>

            {artistAka && email ? (
              <Box
                sx={{
                
                  p: { xs: 2, sm: 3 },
                  
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  Thanks for joining FloLup! Please verify your email address to keep moving forward as a creator.
                </Typography>

                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 1),
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Verification email sent to:
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.success.main,
                      fontSize: '1rem',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                    }}
                  >
                    {email}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    mb: 2,
                  }}
                >
                  Please check your inbox and click the verification link to activate your artist account.
                </Typography>

                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    mb: 3,
                    p: 1.5,
                    backgroundColor: alpha(theme.palette.success.light, 0.3),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                  }}
                >
                  💡 Don't see our email? Check your spam/junk folder.
                </Typography>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  sx={{
                    display: 'inline-block',
                    background: 'linear-gradient(90deg, #E4C421, #B25035)',
                    color: '#000',
                    textDecoration: 'none',
                    py: 1.5,
                    px: { xs: 4, sm: 5 },
                    borderRadius: 1,
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 5px 15px rgba(0,0,0,0.25)',
                    transition: 'transform 0.2s',
                    minWidth: { xs: '100%', sm: 250 },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      boxShadow: 'none',
                    },
                  }}
                >
                    {showSentTick ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <span>✓</span>
                        <span>Email Sent!</span>
                      </Box>
                    ) : isResending ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                        <span>Resending...</span>
                      </Box>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>

                  {resendCooldown > 0 && !showSentTick && (
                    <Typography
                      sx={{
                        mt: 2,
                        color: theme.palette.text.secondary,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      <span>⏳</span>
                      Please wait {resendCooldown} seconds before resending
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ py: 4 }}>
                <Typography
                  sx={{
                    color: theme.palette.error.main,
                    fontSize: '1rem',
                    mb: 2,
                  }}
                >
                  {status || 'Unable to load account information'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/artist/login')}
                  sx={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    color: theme.palette.success.main,
                    textDecoration: 'none',
                    py: 1.5,
                    px: 4,
                    borderRadius: 1,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: `2px solid ${theme.palette.success.main}`,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}

            <Box
              sx={{
                textAlign: 'center',
                mt: 4,
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
              }}
            >
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                © 2026 FloLup. All rights reserved.
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ArtistVerificationPage;
