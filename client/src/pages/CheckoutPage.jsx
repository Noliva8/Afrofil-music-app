import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import UserAuth from "../utils/auth.js";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import useTheme from '@mui/material/styles/useTheme';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const theme = useTheme();
  const profile = UserAuth.getProfile();
  const userEmail = profile?.email;

  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!userEmail) return;
    setLoading(true);
    setErrorMessage('');
    fetch('http://localhost:3001/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.clientSecret) {
          throw new Error('Missing payment token');
        }
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        console.error('Subscription Fetch Error:', err);
        setErrorMessage('Unable to start checkout. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [userEmail]);


  const appearance = { theme: 'stripe' };
  const options = { clientSecret, appearance };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 10% 20%, ${alpha(
          theme.palette.primary.main,
          0.1
        )}, transparent 35%), linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Chip
              label="Premium Access"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -0.8, mb: 1 }}>
              Upgrade to Afrofeel Premium
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 720 }}>
              Unlock ad-free listening, higher quality audio, and early access to new drops. Your membership
              powers independent African artists worldwide.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                p: { xs: 3, md: 4 },
                background: alpha(theme.palette.background.paper, 0.8),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                What you get
              </Typography>
              <Stack spacing={1.5}>
                {[
                  'Ad-free streaming and offline access',
                  'Higher audio quality on all devices',
                  'Early releases and exclusive drops',
                  'Support artists directly with every play'
                ].map((item) => (
                  <Box key={item} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        mt: 1,
                        bgcolor: theme.palette.primary.main
                      }}
                    />
                    <Typography variant="body1">{item}</Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 3, borderColor: alpha(theme.palette.divider, 0.4) }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Questions? Reach out any time and we will help you set things up.
              </Typography>
              <Button
                variant="text"
                sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                onClick={() => window.location.assign('mailto:support@afrofeel.com')}
              >
                Contact support
              </Button>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                p: { xs: 3, md: 4 },
                background: alpha(theme.palette.background.paper, 0.95),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Secure checkout
              </Typography>
              {!userEmail && (
                <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                  We could not load your account. Please log in again.
                </Typography>
              )}
              {loading && (
                <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Preparing your checkout...
                  </Typography>
                </Stack>
              )}
              {errorMessage && (
                <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                  {errorMessage}
                </Typography>
              )}
              {clientSecret && (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm clientSecret={clientSecret} />
                </Elements>
              )}
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default CheckoutPage;
