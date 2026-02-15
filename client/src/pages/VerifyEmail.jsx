import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { useMutation } from '@apollo/client';
import { VERIFYING_EMAIL } from '../utils/mutations';

const baseStatusInfo = {
  verified: {
    title: 'Email confirmed',
    fallback: 'Your email has been verified. Redirecting you to the login screen so you can sign in.',
  },
  already: {
    title: 'Email already verified',
    fallback: 'It looks like your email was verified earlier. We will take you to the login screen now.',
  },
  pending: {
    title: 'Verifying email',
    fallback: 'Please wait while we validate your token.',
  },
  missing: {
    title: 'Verification link missing',
    fallback: 'We could not find a verification token on the link.',
  },
  error: {
    title: 'Something went wrong',
    fallback: 'There was a problem verifying your email. Please request a new link.',
  },
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const theme = useTheme();
  const [statusKey, setStatusKey] = useState(token ? 'pending' : 'missing');
  const [detailMessage, setDetailMessage] = useState('');
  const [verifyEmail] = useMutation(VERIFYING_EMAIL);

  useEffect(() => {
    if (!token) return;

    verifyEmail({ variables: { artistToken: token } })
      .then((result) => {
        const payload = result?.data?.verifyEmail;
        if (!payload) {
          setStatusKey('error');
          setDetailMessage('Unexpected response from the server.');
          return;
        }

        if (payload.success) {
          setStatusKey('verified');
        } else if (payload.message?.toLowerCase().includes('already')) {
          setStatusKey('already');
        } else {
          setStatusKey('error');
        }
        setDetailMessage(payload.message);
      })
      .catch((err) => {
        console.error('Email verification failed:', err);
        setStatusKey('error');
        setDetailMessage('We could not verify your email. Please request a new link.');
      });
  }, [token, verifyEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/loginSignin', { replace: true });
    }, 4200);
    return () => clearTimeout(timer);
  }, [navigate]);

  const info = baseStatusInfo[statusKey] || baseStatusInfo.error;
  const message = detailMessage || info.fallback;

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
        {message}
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/loginSignin', { replace: true })}
        fullWidth
        sx={{
          maxWidth: 320,
          mx: 'auto',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: theme.palette.primary.contrastText,
          fontWeight: 700,
          px: 4,
          py: 1.5,
          borderRadius: 999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        Go to login now
      </Button>
    </Box>
  );
};

export default VerifyEmail;
