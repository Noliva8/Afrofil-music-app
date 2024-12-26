import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import ArtistAuth from '../utils/artist_auth';




const ArtistVerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(""); // Define status state

  const profile = ArtistAuth.getProfile();

  const email = profile?.data?.email;
  const artistAka = profile?.data?.artistAka;

  console.log("Profile:", profile); // Debugging profile

  // Function to check confirmation and plan status
  const checkConfirmationStatus = async (email) => {
    try {
      console.log("Making API call with email:", email);
      const response = await axios.post(
        "http://localhost:3001/api/confirmationStatusAndPlanStatus",
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
    const verifyConfirmation = async () => {
      try {
        if (email) {
          console.log("Checking confirmation for email:", email);
          const data = await checkConfirmationStatus(email);
          console.log("Data received from API:", data);

          if (!data) {
            console.error("No data received. Staying on verification page.");
            setStatus("Failed to fetch your account details. Please try again.");
            setLoading(false);
            return;
          }

          if (!data.confirmed) {
            console.error("Email not confirmed. Staying on verification page.");
            setStatus("Your email is not confirmed. Please check your inbox.");
            setLoading(false);
            return;
          }

          if (!data.selectedPlan) {
            console.error("Plan not selected. Redirecting to plan selection page.");
            setStatus("Please select a plan.");
            navigate("/artist/plan"); // Navigate to plan selection page
            return;
          }

          // Plan is selected and confirmed
          console.log("Plan selected:", data.selectedPlan); // Debugging selected plan

          setStatus("You are verified!");
          console.log("Verification complete. Redirecting to dashboard.");
          setTimeout(() => {
            navigate("/artist/dashboard"); // Redirect to dashboard after verification
          }, 2000); // Optional delay to show status before navigating
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
  }, [email, navigate]);

  return (
    <Box sx={{ textAlign: "center", padding: "20px" }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="h4" color="textPrimary" paragraph>
            Welcome to Afrofeel, {artistAka || "Artist"}!
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
