import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
import UserAuth from '../utils/auth.js';
import {
  REQUEST_USER_EMAIL_VERIFICATION,
  USER_EMAIL_VERIFICATION_STATUS,
  VERIFY_USER_EMAIL,
} from '../utils/mutations.js';

const formatRemainingTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function UserVerificationPage() {
  const theme = useTheme();
  const profile = UserAuth.getProfile();
  const email = profile?.data?.email || '';
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [verifyUserEmail, { loading: verifying }] = useMutation(VERIFY_USER_EMAIL);
  const [requestUserEmailVerification, { loading: resending }] = useMutation(
    REQUEST_USER_EMAIL_VERIFICATION
  );
  const { data: verificationStatusData, refetch: refetchVerificationStatus } = useQuery(
    USER_EMAIL_VERIFICATION_STATUS,
    {
      variables: { email },
      skip: !email,
      fetchPolicy: 'network-only',
    }
  );

  const heroGradient = useMemo(
    () => `
      radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
      linear-gradient(to bottom, #0F0F0F, #1A1A1A)
    `,
    [theme.palette.primary.main]
  );

  useEffect(() => {
    const nextSeconds =
      verificationStatusData?.userEmailVerificationStatus?.secondsRemaining;

    if (typeof nextSeconds === 'number') {
      setSecondsRemaining(nextSeconds);
    }
  }, [verificationStatusData]);

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined;

    const timer = setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setMessage('');
    setSuccessMessage('');

    try {
      if (!email) {
        throw new Error('No email found for this account. Please log in again.');
      }

      if (!code.trim()) {
        throw new Error('Verification code is required.');
      }

      const { data } = await verifyUserEmail({
        variables: {
          email,
          code: code.trim(),
        },
      });

      const token = data?.verifyUserEmail?.userToken;
      if (!token) {
        throw new Error('Verification succeeded, but no login token was returned.');
      }

      UserAuth.setToken(token);
      setSuccessMessage('Email verified. Taking you to your account...');
      window.location.replace('/');
    } catch (error) {
      setMessage(error.message || 'Unable to verify this email.');
    }
  };

  const handleResend = async () => {
    setMessage('');
    setSuccessMessage('');

    try {
      if (!email) {
        throw new Error('No email found for this account. Please log in again.');
      }

      if (secondsRemaining > 0) {
        setSuccessMessage(`Your current code is still valid for ${formatRemainingTime(secondsRemaining)}.`);
        return;
      }

      const { data } = await requestUserEmailVerification({
        variables: { email },
      });
      const payload = data?.requestUserEmailVerification;

      if (typeof payload?.secondsRemaining === 'number') {
        setSecondsRemaining(payload.secondsRemaining);
      }

      setSuccessMessage(payload?.message || 'Verification code sent.');
      refetchVerificationStatus?.();
    } catch (error) {
      setMessage(error.message || 'Unable to send a new verification code.');
    }
  };

  return (
    <Box
      sx={{
        background: heroGradient,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <Box
        sx={{
          background: alpha(theme.palette.background.paper || '#111119', 0.95),
          backdropFilter: 'blur(12px)',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 480,
          boxShadow: theme.shadows[2],
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <SitemarkIcon sx={{ width: 96, height: 96, mb: 2 }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Verify Email
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 1 }}
          >
            Enter the 4-digit code sent to {email || 'your email'}.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleVerify}>
          <Box sx={{ mb: 2.5 }}>
            <Typography
              component="label"
              htmlFor="userEmailCode"
              sx={{
                display: 'block',
                color: theme.palette.text.secondary,
                mb: 1,
                fontSize: 14,
              }}
            >
              Verification code:
            </Typography>
            <Box
              component="input"
              id="userEmailCode"
              name="userEmailCode"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 4))
              }
              required
              sx={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                background: 'rgba(255,255,255,0.05)',
                color: theme.palette.text.primary,
                fontSize: 16,
                fontFamily: theme.typography.fontFamily,
              }}
            />
          </Box>

          {message && (
            <Typography
              sx={{ color: '#FF4D4D', mb: 1.5, fontSize: 14, textAlign: 'center' }}
            >
              {message}
            </Typography>
          )}

          {successMessage && (
            <Typography
              sx={{
                color: theme.palette.primary.main,
                mb: 1.5,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              {successMessage}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={verifying}
            sx={{
              padding: '14px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #E4C421, #B25035)',
              color: '#000',
              fontSize: 16,
              fontWeight: 600,
              mb: 2,
              '&:hover': {
                background: 'linear-gradient(90deg, #F8D347, #C96146)',
                transform: verifying ? 'none' : 'translateY(-2px)',
              },
            }}
          >
            {verifying ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={18} sx={{ color: '#000' }} />
                Verifying...
              </Box>
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            type="button"
            onClick={handleResend}
            disabled={resending || secondsRemaining > 0}
            fullWidth
            variant="text"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              '&:hover': {
                color: theme.palette.primary.main,
                background: 'transparent',
              },
            }}
          >
            {resending
              ? 'Sending code...'
              : secondsRemaining > 0
                ? `Resend code in ${formatRemainingTime(secondsRemaining)}`
                : 'Resend code'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
