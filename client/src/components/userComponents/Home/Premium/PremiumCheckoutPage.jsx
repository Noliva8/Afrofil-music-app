import { useState, useCallback } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha } from '@mui/material/styles';
import useTheme from '@mui/material/styles/useTheme';
import {
  CreditCardRounded,
  ShieldRounded,
  CheckCircleRounded,
  StarRounded,
  ArrowBackRounded,
  PaymentsRounded,
  InfoRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SitemarkIcon } from '../../../themeCustomization/customIcon';

const stripeInputOptions = (theme) => ({
  style: {
    base: {
      fontSize: '16px',
      color: theme.palette.text.primary,
      fontFamily: theme.typography.fontFamily,
      '::placeholder': {
        color: alpha(theme.palette.text.primary, 0.5),
      },
      iconColor: theme.palette.primary.main,
    },
    invalid: {
      color: theme.palette.error.main,
    },
  },
  hidePostalCode: true,
});

const PremiumCheckoutPage = ({ selectedPlan, setSelectedPlan, userEmail }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const stripe = useStripe();
  const elements = useElements();


  const BASE_API_URL = import.meta.env.VITE_API_URL ;

  const plans = {
    monthly: {
      name: 'Monthly Plan',
      price: 8.0,
      afterTrial: 'After 1-month free trial',
      interval: 'month',
      features: ['Ad-free listening', 'Offline downloads', 'High quality audio', 'Unlimited skips'],
    },
    yearly: {
      name: 'Yearly Plan',
      price: 80.0,
      afterTrial: 'After 1-month free trial',
      interval: 'year',
      savings: 'Save $16 annually',
      features: ['Ad-free listening', 'Offline downloads', 'High quality audio', 'Unlimited skips', 'Priority support'],
    },
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !userEmail) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardNumberElement);

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { email: userEmail },
      });

      if (pmError) {
        setErrorMessage(pmError.message);
        setIsProcessing(false);
        return;
      }

      const res = await fetch(`${BASE_API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          paymentMethodId: paymentMethod.id,
          plan: selectedPlan,
        }),
      });

      const { clientSecret, error } = await res.json();
      if (error || !clientSecret) throw new Error(error || 'No client secret returned');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (result.error) {
        setErrorMessage(result.error.message);
      } else {
        navigate(`/complete?payment_intent_client_secret=${clientSecret}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, userEmail, selectedPlan, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!userEmail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.04)} 0%, 
          ${alpha(theme.palette.background.default, 0.95)} 50%,
          ${alpha(theme.palette.secondary.main, 0.04)} 100%
        )`,
        py: { xs: 2, md: 4 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="lg">
        <Slide in direction="up" timeout={500}>
          <Box>
            {/* Header */}
            <Box sx={{ mb: { xs: 3, md: 4 }, position: 'relative' }}>
              <Button
                startIcon={<ArrowBackRounded />}
                onClick={handleBack}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  position: 'absolute',
                  left: 0,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                Back
              </Button>
              
              <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <SitemarkIcon sx={{ fontSize: 32 }} />
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: '-0.5px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Premium
                  </Typography>
                </Box>
                
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  Complete Your Subscription
                </Typography>
                
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '1.1rem',
                    maxWidth: 500,
                    mx: 'auto',
                  }}
                >
                  Start your 1-month free trial of Premium
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 3, md: 4 } }}>
              {/* Left Column - Payment Details */}
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                      ${alpha(theme.palette.background.paper, 0.85)} 100%
                    )`,
                    backdropFilter: 'blur(20px)',
                    p: { xs: 3, md: 4 },
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    },
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentsRounded sx={{ color: theme.palette.primary.main }} />
                    Payment Method
                  </Typography>

                  {/* Payment Method Selection */}
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ mb: 4 }}
                  >
                    <Stack direction="row" spacing={2}>
                      <FormControlLabel
                        value="card"
                        control={
                          <Radio
                            icon={<CreditCardRounded />}
                            checkedIcon={<CreditCardRounded />}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Credit/Debit Card
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Visa, Mastercard, American Express
                            </Typography>
                          </Box>
                        }
                        sx={{
                          flex: 1,
                          m: 0,
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          '&.Mui-checked': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      />
                      
                      <FormControlLabel
                        value="paypal"
                        control={
                          <Radio
                            icon={<CreditCardRounded />}
                            checkedIcon={<CreditCardRounded />}
                            disabled
                          />
                        }
                        label={
                          <Box sx={{ opacity: 0.6 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              PayPal
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Coming soon
                            </Typography>
                          </Box>
                        }
                        sx={{
                          flex: 1,
                          m: 0,
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        }}
                        disabled
                      />
                    </Stack>
                  </RadioGroup>

                  {/* Card Form */}
                  {paymentMethod === 'card' && (
                    <form onSubmit={handleSubmit}>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Card Number
                          </Typography>
                          <Paper
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              backgroundColor: alpha(theme.palette.background.default, 0.6),
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                              },
                              '&:focus-within': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                              },
                            }}
                          >
                            <CardNumberElement options={stripeInputOptions(theme)} />
                          </Paper>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Expiry Date
                            </Typography>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                backgroundColor: alpha(theme.palette.background.default, 0.6),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                                },
                                '&:focus-within': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                                },
                              }}
                            >
                              <CardExpiryElement options={stripeInputOptions(theme)} />
                            </Paper>
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              CVC
                            </Typography>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                backgroundColor: alpha(theme.palette.background.default, 0.6),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                                },
                                '&:focus-within': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                                },
                              }}
                            >
                              <CardCvcElement options={stripeInputOptions(theme)} />
                            </Paper>
                          </Box>
                        </Box>

                        {/* Security Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.success.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          }}
                        >
                          <ShieldRounded sx={{ color: theme.palette.success.main }} />
                          <Typography variant="caption" sx={{ color: theme.palette.success.dark, fontWeight: 500 }}>
                            Your payment is secured with 256-bit SSL encryption
                          </Typography>
                        </Box>

                        {/* Error Message */}
                        {errorMessage && (
                          <Fade in>
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                              {errorMessage}
                            </Alert>
                          </Fade>
                        )}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isProcessing || !stripe}
                          fullWidth
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: '1rem',
                            background: `linear-gradient(90deg, 
                              ${theme.palette.primary.main} 0%, 
                              ${theme.palette.secondary.main} 100%
                            )`,
                            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, 
                                transparent, 
                                ${alpha(theme.palette.common.white, 0.2)}, 
                                transparent
                              )`,
                              transition: 'left 0.5s ease',
                            },
                            '&:hover::before': {
                              left: '100%',
                            },
                          }}
                        >
                          {isProcessing ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} sx={{ color: 'white' }} />
                              Processing...
                            </Box>
                          ) : (
                            'Start 1-Month Free Trial'
                          )}
                        </Button>
                      </Stack>
                    </form>
                  )}
                </Paper>
              </Box>

              {/* Right Column - Order Summary */}
              <Box sx={{ width: { xs: '100%', md: '40%', lg: '35%' } }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                      ${alpha(theme.palette.background.paper, 0.85)} 100%
                    )`,
                    backdropFilter: 'blur(20px)',
                    p: { xs: 3, md: 4 },
                    position: 'sticky',
                    top: 20,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarRounded sx={{ color: theme.palette.warning.main }} />
                    Order Summary
                  </Typography>

                  {/* Plan Selection */}
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {Object.entries(plans).map(([key, plan]) => (
                      <Card
                        key={key}
                        onClick={() => !isProcessing && setSelectedPlan(key)}
                        sx={{
                          cursor: isProcessing ? 'default' : 'pointer',
                          border: `2px solid ${
                            selectedPlan === key
                              ? theme.palette.primary.main
                              : alpha(theme.palette.divider, 0.2)
                          }`,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          backgroundColor: selectedPlan === key
                            ? alpha(theme.palette.primary.main, 0.04)
                            : alpha(theme.palette.background.default, 0.6),
                          opacity: isProcessing ? 0.7 : 1,
                          '&:hover': !isProcessing && {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Radio
                              checked={selectedPlan === key}
                              onChange={() => !isProcessing && setSelectedPlan(key)}
                              value={key}
                              disabled={isProcessing}
                              sx={{
                                '&.Mui-checked': {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            />
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                  {plan.name}
                                </Typography>
                                {plan.savings && (
                                  <Chip
                                    label={plan.savings}
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha(theme.palette.success.main, 0.12),
                                      color: theme.palette.success.main,
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                )}
                              </Box>

                              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                                ${plan.price}
                                <Typography component="span" variant="body1" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                                  /{plan.interval}
                                </Typography>
                              </Typography>

                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                                {plan.afterTrial}
                              </Typography>

                              <Stack spacing={0.5} sx={{ mt: 2 }}>
                                {plan.features.map((feature, index) => (
                                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleRounded sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                      {feature}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  {/* Price Summary */}
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Today's charge
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                        $0.00
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        After trial
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          ${plans[selectedPlan].price}/{plans[selectedPlan].interval}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Billed {plans[selectedPlan].interval === 'month' ? 'monthly' : 'annually'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  {/* Terms */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.info.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <InfoRounded sx={{ fontSize: 16, color: theme.palette.info.main, mt: 0.25 }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, lineHeight: 1.4 }}>
                        By continuing, you agree to our{' '}
                        <Typography component="span" variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                          Terms of Service
                        </Typography>{' '}
                        and acknowledge that your subscription will automatically renew after the trial period
                        unless canceled at least 24 hours before the trial ends.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Decorative Element */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                      zIndex: -1,
                    }}
                  />
                </Paper>
              </Box>
            </Box>
          </Box>
        </Slide>
      </Container>
    </Box>
  );
};

export default PremiumCheckoutPage;
