import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import useTheme from '@mui/material/styles/useTheme';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  EmailRounded, 
  LockRounded, 
  CheckCircleRounded,
  ErrorRounded,
  Visibility,
  VisibilityOff,
  ArrowBackRounded
} from "@mui/icons-material";
import { REQUEST_PASSWORD_RESET, RESET_PASSWORD } from "../utils/mutations";
import logo from "../images/logo.png";

export default function PasswordReset() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  // State
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState(null);

  // Mutations
  const [requestReset, { loading: requesting }] = useMutation(REQUEST_PASSWORD_RESET);
  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD);

  const handleRequest = async (event) => {
    event.preventDefault();
    setStatus(null);

    try {
      const { data } = await requestReset({
        variables: { email }
      });
      setStatus({
        type: data?.requestPasswordReset?.success ? "success" : "error",
        message: data?.requestPasswordReset?.message || "Password reset link sent to your email!"
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to send reset link. Please try again."
      });
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match. Please try again." });
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: { token, newPassword }
      });
      const success = data?.resetPassword?.success;
      setStatus({
        type: success ? "success" : "error",
        message: data?.resetPassword?.message || "Password reset successfully! Redirecting to login..."
      });
      if (success) {
        setTimeout(() => navigate("/welcome?login=1"), 2000);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to reset password. The link may have expired."
      });
    }
  };

  const handleBackToLogin = () => {
    navigate("/welcome?login=1");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.background.default, 0.9)} 50%,
          ${alpha(theme.palette.secondary.main, 0.05)} 100%
        )`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 3, md: 0 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Slide in direction="up" timeout={500}>
        <Container maxWidth="sm" sx={{ position: "relative" }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.85)} 100%
              )`,
              backdropFilter: "blur(20px)",
              p: { xs: 3, sm: 4, md: 5 },
              boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.08)}`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main}
                )`,
              },
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Afrofeel logo"
                  sx={{ height: 40, width: "auto" }}
                />
              </Box>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.12)} 0%, 
                    ${alpha(theme.palette.secondary.main, 0.08)} 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {token ? (
                  <LockRounded sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                ) : (
                  <EmailRounded sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                )}
              </Box>
              
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  mb: 1,
                  background: token ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` : undefined,
                  backgroundClip: token ? "text" : undefined,
                  WebkitBackgroundClip: token ? "text" : undefined,
                  WebkitTextFillColor: token ? "transparent" : undefined,
                }}
              >
                {token ? "Create New Password" : "Reset Password"}
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  maxWidth: 400,
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                {token 
                  ? "Please enter your new password below. Make sure it's strong and secure."
                  : "Enter your email address and we'll send you a link to reset your password."
                }
              </Typography>
            </Box>

            {/* Form */}
            <Box
              component="form"
              onSubmit={token ? handleReset : handleRequest}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {!token && (
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRounded sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.default, 0.6),
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.background.default, 0.8),
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      "&.Mui-focused": {
                        backgroundColor: alpha(theme.palette.background.default, 0.8),
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    },
                  }}
                />
              )}

              {token && (
                <>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRounded sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: alpha(theme.palette.text.primary, 0.5) }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.6),
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        "&.Mui-focused": {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRounded sx={{ color: alpha(theme.palette.text.primary, 0.5) }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: alpha(theme.palette.text.primary, 0.5) }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.6),
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        "&.Mui-focused": {
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                      },
                    }}
                  />
                </>
              )}

              {/* Status Message */}
              <Fade in={status?.message}>
                <Box>
                  {status?.message && (
                    <Alert
                      severity={status.type}
                      iconMapping={{
                        success: <CheckCircleRounded fontSize="inherit" />,
                        error: <ErrorRounded fontSize="inherit" />,
                      }}
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${alpha(
                          status.type === "success" 
                            ? theme.palette.success.main 
                            : theme.palette.error.main, 
                          0.2
                        )}`,
                        backgroundColor: alpha(
                          status.type === "success" 
                            ? theme.palette.success.main 
                            : theme.palette.error.main, 
                          0.08
                        ),
                        "& .MuiAlert-icon": {
                          color: status.type === "success" 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {status.message}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Fade>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                disabled={token ? resetting : requesting}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  background: `linear-gradient(90deg, 
                    ${theme.palette.primary.main} 0%, 
                    ${theme.palette.secondary.main} 100%
                  )`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(90deg, 
                      transparent, 
                      ${alpha(theme.palette.common.white, 0.2)}, 
                      transparent
                    )`,
                    transition: "left 0.5s ease",
                  },
                  "&:hover::before": {
                    left: "100%",
                  },
                }}
              >
                {token ? resetting ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: "white" }} />
                    Resetting...
                  </Box>
                ) : (
                  "Reset Password"
                ) : requesting ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: "white" }} />
                    Sending...
                  </Box>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

            {/* Info Text */}
            <Typography
              variant="caption"
                sx={{
                  textAlign: "center",
                  color: theme.palette.text.secondary,
                  display: "block",
                  mt: 1,
                  opacity: 0.7,
                }}
              >
                {token 
                  ? "Make sure your password is at least 8 characters with a mix of letters, numbers, and symbols."
                  : "Check your spam folder if you don't see the email within a few minutes."
                }
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                startIcon={<ArrowBackRounded />}
                onClick={handleBackToLogin}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                Back to Login
              </Button>
            </Box>

            {/* Decorative Elements */}
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                zIndex: -1,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 70%)`,
                zIndex: -1,
              }}
            />
          </Paper>
        </Container>
      </Slide>
    </Box>
  );
}
