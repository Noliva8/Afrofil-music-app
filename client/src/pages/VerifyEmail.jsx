import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

const statusTextMap = {
  verified: {
    title: 'Email confirmed',
    message: 'Your email has been verified. Redirecting you to the login screen so you can sign in.',
  },
  already: {
    title: 'Email already verified',
    message:
      'It looks like your email was verified earlier. We will take you to the login screen now.',
  },
  default: {
    title: 'Verification result',
    message:
      'We received your verification request. You will be redirected to login shortly.',
  },
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const status = searchParams.get('status');
  const info = statusTextMap[status] || statusTextMap.default;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/loginSignin', { replace: true });
    }, 4200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 3,
        textAlign: 'center',
        background: theme.palette.mode === 'dark' ? '#050505' : '#f5f5f5',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        {info.title}
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: 520, color: theme.palette.text.secondary, mb: 3 }}>
        {info.message}
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/loginSignin', { replace: true })}
        sx={{
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: theme.palette.primary.contrastText,
          fontWeight: 700,
          px: 4,
          py: 1.5,
        }}
      >
        Go to login now
      </Button>
    </Box>
  );
};

export default VerifyEmail;
