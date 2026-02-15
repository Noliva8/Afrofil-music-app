import { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import ArtistAuth from '../utils/artist_auth';

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
        textAlign: "center",
        padding: { xs: "20px", sm: "40px" },
        minHeight: "100vh",
        pt: { xs: "30px", sm: "60px" },
      }}
    >
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="h4" color="textPrimary" paragraph>
            Welcome to FloLup, {artistAka || "Artist"}!
          </Typography>
          {artistAka && email ? (
            <div>
              <Typography variant="h6" color="textSecondary">
                You are all set.
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Please click on the link we just emailed to <strong>{email}</strong> to verify your account.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Don't see our email? Check your spam/junk folder.
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  sx={{ textTransform: "none" }}
                >
                  {showSentTick
                    ? "✓ Sent"
                    : isResending
                    ? "Resending..."
                    : "Resend verification email"}
                </Button>
                {resendCooldown > 0 && !showSentTick && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Please wait a moment before resending.
                  </Typography>
                )}
              </Box>
            </div>
          ) : (
            <Typography variant="body1" color="error">
              {status}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default ArtistVerificationPage;
