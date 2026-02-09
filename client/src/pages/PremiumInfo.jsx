import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import useMediaQuery from '@mui/material/useMediaQuery';

import Grid from '@mui/material/Grid2';
import { alpha } from '@mui/material/styles';
import { BsStars, BsCheckCircleFill } from 'react-icons/bs';
import { FiCreditCard, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi';
import UserAuth from '../utils/auth.js';
import { USER_SUBSCRIPTION } from '../utils/queries';
import { CANCEL_SUBSCRIPTION } from '../utils/mutations';
import { toast } from 'react-toastify';

const formatDate = (value) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
};

const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return amount.startsWith('$') ? amount : `$${amount}`;
};

const premiumBenefits = [
  'Offline downloads',
  'Ad-free listening',
  'High-quality audio (320kbps)',
  'Multi-device sync',
  'Priority support',
  'Exclusive content',
];

const planLabelMap = {
  premium_monthly: 'Premium Monthly',
  premium_yearly: 'Premium Yearly',
  monthly: 'Premium Monthly',
  yearly: 'Premium Yearly',
};

const InfoCard = ({ icon: Icon, label, value, subtext, loading = false }) => (
  <Box sx={{ p: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color="primary" />
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
    {loading ? (
      <>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" />
      </>
    ) : (
      <>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
          {value}
        </Typography>
        {subtext && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {subtext}
          </Typography>
        )}
      </>
    )}
  </Box>
);

export function PremiumInfo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const profile = UserAuth.getProfile();
  const userId = profile?.data?._id || profile?._id;
console.log('see id in promo:', userId)


  const { data, loading, error, refetch } = useQuery(USER_SUBSCRIPTION, {
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });




console.log('data for subscription', data);



  const [cancelSubscription, { loading: canceling }] = useMutation(CANCEL_SUBSCRIPTION);

  // Show login prompt if no user
  if (!userId) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 10,
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: theme.shadows[3],
          }}
        >
          <BsStars size={48} color={theme.palette.secondary.main} style={{ margin: '0 auto 16px' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Premium Membership
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Log in to view and manage your premium subscription details.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => navigate('/login')}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
          >
            Log In
          </Button>
        </Card>
      </Box>
    );
  }

  const subscription = useMemo(() => {
    const raw = data?.userSubscription;
    const planId = raw?.planId || '';
    const planKey = planId?.toLowerCase() || '';
    const planName = planLabelMap[planKey] || 'AfroFeel Premium';
    const renewalAmount = planKey.includes('year') ? '80.00' : '8.00';

    return {
      planName,
      status: raw?.status || 'ACTIVE',
      nextBillingDate: raw?.periodEnd,
      renewalAmount: formatCurrency(renewalAmount),
      expiresAt: raw?.periodEnd,
      paymentMethod: raw?.paymentMethod || 'Stored payment method',
      startedAt: raw?.lastPaymentDate,
      lastPaymentDate: raw?.lastPaymentDate,
      rawData: raw,
    };
  }, [data]);

  const statusLabel = subscription.status?.toUpperCase?.() || 'ACTIVE';

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancellation scheduled — premium access remains until period end.');
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
      toast.error(err.message || 'Unable to cancel your subscription right now.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
        py: { xs: 4, sm: 6, md: 6 },
        px: { xs: 2, sm: 3 },
       
      }}
    >
      <Container maxWidth="lg" disableGutters={isMobile}>
        <Stack spacing={{ xs: 4, md: 6 }}>
          {/* Header Section */}
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Stack spacing={1}>
                <Chip
                  icon={<BsStars />}
                  label="AfroFeel Premium"
                  color="secondary"
                  variant="filled"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    alignSelf: 'flex-start',
                  }}
                />
                <Typography
                  variant={isMobile ? "h4" : "h3"}
                  sx={{
                    fontWeight: 900,
                    background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Thank you for being Premium
                </Typography>
              </Stack>
              {loading && (
                <Chip
                  label="Updating..."
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
            
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 640,
                mt: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Manage your recurring premium plan—view billing dates, payment methods, and subscription details.
              Need help? Quick actions are available below.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* Main Subscription Card */}
            <Grid size={{ xs: 12, lg: 8}} >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  p: { xs: 3, md: 4 },
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  background: theme.palette.background.paper,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack spacing={3} sx={{ flex: 1 }}>
                  {/* Plan Header */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        mb: 1,
                      }}
                    >
                      Your Current Plan
                    </Typography>
                    
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800 }}>
                        {subscription.planName}
                      </Typography>
                      <Chip
                        label={statusLabel}
                        color={statusLabel === 'ACTIVE' ? 'success' : 'warning'}
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                    
                  
                  </Box>

                  <Divider />

                  {/* Info Cards Grid */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3}}>
                      <InfoCard
                        icon={FiCalendar}
                        label="Next Billing"
                        value={formatDate(subscription.nextBillingDate)}
                        subtext={subscription.renewalAmount}
                        loading={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3}} >
                      <InfoCard
                        icon={FiCreditCard}
                        label="Payment Method"
                        value={subscription.paymentMethod || 'Stored payment method'}
                        subtext={
                          subscription.paymentMethod?.includes('Stored')
                            ? 'Auto-renew enabled'
                            : 'Update available'
                        }
                        loading={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3}}>
                      <InfoCard
                        icon={FiDollarSign}
                        label="Renewal Amount"
                        value={subscription.renewalAmount}
                        subtext="per billing cycle"
                        loading={loading}
                      />
                    </Grid>
                    <Grid  size={{ xs: 12, sm: 6, md: 3}}>
                      <InfoCard
                        icon={FiClock}
                        label="Expires At"
                        value={formatDate(subscription.expiresAt)}
                        subtext="Access until this date"
                        loading={loading}
                      />
                    </Grid>
                  </Grid>

                  {/* Error State */}
                  {error && (
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'error.main' }}>
                        Unable to load subscription details. Please try again later.
                      </Typography>
                    </Paper>
                  )}

                  {/* Action Buttons */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 'auto', pt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth={isMobile}
                      onClick={handleCancel}
                      disabled={canceling || loading}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      {canceling ? 'Canceling...' : 'Cancel subscription'}
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth={isMobile}
                      onClick={() => navigate('/support')}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderColor: alpha(theme.palette.text.primary, 0.3),
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Contact Support
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {/* Benefits Sidebar */}
            <Grid size={{ xs: 12, lg: 4}}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
                  <Stack spacing={3} sx={{ height: '100%' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Premium Benefits
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Everything included with your membership
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      {premiumBenefits.map((benefit, index) => (
                        <Stack key={index} direction="row" spacing={2} alignItems="center">
                          <BsCheckCircleFill
                            size={20}
                            color={theme.palette.success.main}
                            style={{ flexShrink: 0 }}
                          />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {benefit}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          mb: 2,
                          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        }}
                      >
                        Cancelling keeps your premium access until the current billing cycle ends.
                        You can restart anytime from your account settings.
                      </Typography>
                      <Button
                        variant="text"
                        fullWidth
                        onClick={() => navigate('/premium')}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          fontWeight: 600,
                          color: 'primary.main',
                        }}
                      >
                        View all features & pricing →
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* FAQ/Additional Info */}
          {!isMobile && (
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Frequently Asked Questions
              </Typography>
              <Grid container spacing={3}>
                {[
                  {
                    q: 'How do I update my payment method?',
                    a: 'Go to Account Settings → Payment Methods to update your card.',
                  },
                  {
                    q: 'Can I switch between monthly and yearly?',
                    a: 'Yes, you can change your plan anytime from the subscription page.',
                  },
                  {
                    q: 'Do you offer refunds?',
                    a: 'We offer refunds within 14 days of purchase if you haven\'t used premium features.',
                  },
                ].map((faq, index) => (
                  <Grid  size={{ xs: 12, md: 4}} key={index}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {faq.q}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {faq.a}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default PremiumInfo;
