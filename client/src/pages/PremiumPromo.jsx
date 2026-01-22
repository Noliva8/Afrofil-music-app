import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle,
  Headphones,
  Download,
  MusicNote,
  VolumeUp,
  OfflineBolt,
  Stars,
  FiberManualRecord,
  ArrowForward,
  PlayCircle,
  Shield,
  EmojiEvents,
} from '@mui/icons-material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PremiumCheckout from '../components/userComponents/Home/Premium/PremiumCheckout';

import PremiumInfo from './PremiumInfo';
import { useNavigate } from 'react-router';
import UserAuth from '../utils/auth.js'

const benefitsList = [
  {
    icon: <CheckCircle />,
    title: 'Ad-free listening',
    detail: 'Keep the flow uninterrupted with zero commercials across every playlist.',
    color: 'primary'
  },
  {
    icon: <Download />,
    title: 'Offline downloads',
    detail: 'Save your favorite tracks and playlists for moments without signal.',
    color: 'secondary'
  },
  {
    icon: <VolumeUp />,
    title: 'High fidelity audio',
    detail: 'Stream and download with the cleanest, most balanced sound profile.',
    color: 'success'
  },
  {
    icon: <Stars />,
    title: 'Premium-first content',
    detail: 'Early releases, live sessions, and curated drops exclusive to Premium.',
    color: 'warning'
  },
  {
    icon: <OfflineBolt />,
    title: 'Unlimited skips',
    detail: 'Skip as many tracks as you want. Discover music that truly matches your mood.',
    color: 'info'
  },
  {
    icon: <PlayCircle />,
    title: 'Play on any device',
    detail: 'Switch seamlessly between phone, tablet, and computer.',
    color: 'error'
  },
];

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;




const pricingPlans = [
  {
    id: 'monthly',
    title: 'Premium Monthly',
    price: '$8.00',
    period: '/month',
    subtext: 'after 1-month free trial',
    features: [
      'Ad-free listening',
      'Offline playback',
      'High quality audio',
      'Unlimited skips',
      'Multi-device streaming'
    ],
    cta: 'Start free trial'
  },
  {
    id: 'yearly',
    title: 'Premium Yearly',
    price: '$80.00',
    period: '/year',
    subtext: 'save 15% vs. monthly',
    features: [
      'All Premium benefits',
      'Uninterrupted listening for 12 months',
      'Priority customer support',
      'Annual member badge',
      '2 months free'
    ],
    popular: true,
    cta: 'Get 2 months free'
  },
];



const testimonials = [
  {
    name: 'Alex Morgan',
    role: 'Music Producer',
    avatar: 'AM',
    content: 'The audio quality is absolutely incredible. As a producer, I can hear details I never noticed before.',
    rating: 5
  },
  {
    name: 'Sarah Chen',
    role: 'Daily Commuter',
    avatar: 'SC',
    content: 'Offline downloads changed my subway rides. No more buffering, just pure music bliss.',
    rating: 5
  },
  {
    name: 'Marcus Rivera',
    role: 'Fitness Coach',
    avatar: 'MR',
    content: 'The curated workout playlists and uninterrupted flow keep me motivated through every session.',
    rating: 5
  },
];




const faqs = [
  {
    question: 'Can I cancel my free trial anytime?',
    answer: 'Yes, you can cancel your free trial at any time before it ends and you won\'t be charged.'
  },
  {
    question: 'What audio quality does Premium offer?',
    answer: 'Premium streams at up to 320kbps and supports high-resolution audio where available.'
  },
  {
    question: 'How many devices can I use?',
    answer: 'You can use Premium on up to 5 different devices and stream on 1 device at a time.'
  },
  {
    question: 'Do I keep my playlists if I cancel?',
    answer: 'Yes, all your playlists and saved music remain in your account.'
  }
];





export default function PremiumPromo() {
  const theme = useTheme();
  const profile = UserAuth.getProfile();
  const isPremiumUser = (profile?.data?.role || '').toLowerCase() === 'premium';
  if (isPremiumUser) {
    return <PremiumInfo />;
  }
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(pricingPlans[0].id);
  const navigate = useNavigate();

 



  const actionLabel = useMemo(() => {
    const plan = pricingPlans.find((item) => item.id === selectedPlan);
    return plan ? plan.cta : 'Start free trial';
  }, [selectedPlan]);



  const handleShowCheckout = (event) => {
    event?.preventDefault();
    navigate('/checkout');
    onClose();
  };
  const handleCloseCheckout = () => setShowCheckout(false);






  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, 
          ${alpha(theme.palette.background.default, 0.98)} 0%, 
          ${theme.palette.background.default} 100%
        )`,

        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'visible',

        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '500px',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.05)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.05)} 100%
          )`,
          zIndex: 0,
        }
      }}
    >
      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 100,
          left: '5%',
          width: 300,
          height: 300,
          backgroundImage: `radial-gradient(${alpha(theme.palette.primary.main, 0.1)} 2px, transparent 2px)`,
          backgroundSize: '30px 30px',
          zIndex: 0,
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 200,
          right: '10%',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 0,
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(5deg)' },
          }
        }}
      >
        <MusicNote sx={{ fontSize: 60, color: alpha(theme.palette.secondary.main, 0.2) }} />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 8 }, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1,
              mb: 3,
              borderRadius: 50,
              background: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Shield fontSize="small" sx={{ color: theme.palette.primary.main }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              LIMITED TIME OFFER
            </Typography>

          </Box>
          
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              lineHeight: 1.1,
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Elevate Your Sound
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 700,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
            }}
          >
            Experience music like never before with crystal-clear audio, exclusive content, and zero interruptions.
          </Typography>







          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleShowCheckout}
              endIcon={<ArrowForward />}
              sx={{
                px: 6,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.6)}`,
                },
              }}
            >
              Start 1-Month Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Learn More
            </Button>
          </Box>
          
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 2, display: 'block' }}>
            No credit card required • Cancel anytime
          </Typography>
        </Box>

        {/* Benefits Grid */}
        <Box sx={{ mt: 10, mb: 12 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              mb: 6,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Everything you get with Premium
          </Typography>
          
          <Grid container spacing={3}>
            {benefitsList.map((benefit, index) => (
              <Grid key={benefit.title} item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    background: alpha(theme.palette.background.paper, 0.7),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 25px 50px ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.palette[benefit.color].main} 0%, ${alpha(theme.palette[benefit.color].main, 0.7)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        color: 'white',
                        fontSize: 32,
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      {benefit.title}
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      {benefit.detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pricing Section */}
    
<Box sx={{ mb: 12 }}>
  <Typography
    variant="h3"
    sx={{
      textAlign: 'center',
      fontWeight: 800,
      mb: 2,
      fontSize: { xs: '2rem', md: '2.5rem' },
    }}
  >
    Choose Your Plan
  </Typography>

  <Typography
    variant="h6"
    sx={{
      textAlign: 'center',
      color: theme.palette.text.secondary,
      mb: 6,
      maxWidth: 600,
      mx: 'auto',
    }}
  >
    Pick the plan that works for you. Both include our full Premium experience.
  </Typography>

  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={3}
    sx={{ maxWidth: 1000, mx: 'auto' }}
  >
    {pricingPlans.map((plan) => {
      const isSelected = selectedPlan === plan.id;

      return (
        <Box key={plan.id} sx={{ flex: 1, position: 'relative' }}>
          {plan.popular && (
            <Box
              sx={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: theme.palette.secondary.main,
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 700,
                zIndex: 1,
              }}
            >
              Most Popular
            </Box>
          )}

          <Card
            onClick={() => setSelectedPlan(plan.id)}
            sx={{
              height: '100%',
              cursor: 'pointer',
              borderRadius: 4,

              // isolate this component from affecting the whole page
              contain: 'layout paint style',

              border: `2px solid ${
                isSelected ? theme.palette.primary.main : theme.palette.divider
              }`,
              backgroundColor: isSelected
                ? alpha(theme.palette.primary.main, 0.06)
                : alpha(theme.palette.background.paper, 0.92),

              // avoid transition: all; keep only cheap transitions
              transition: 'border-color 140ms ease, background-color 140ms ease, transform 140ms ease',

              // avoid scale() (common cause of compositor issues)
              transform: 'none',

              '&:hover': {
                borderColor: theme.palette.primary.main,
                transform: 'translateY(-2px)', // cheap transform
              },
            }}
          >
            <CardContent
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                {plan.title}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h2"
                  sx={{ fontWeight: 900, display: 'inline' }}
                >
                  {plan.price}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: 'inline',
                    ml: 1,
                  }}
                >
                  {plan.period}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                {plan.subtext}
              </Typography>

              <Stack spacing={1.25} sx={{ mb: 4, flexGrow: 1 }}>
                {plan.features.map((feature) => (
                  <Typography
                    key={feature}
                    variant="body2"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    • {feature}
                  </Typography>
                ))}
              </Stack>

              <Button
                variant={isSelected ? 'contained' : 'outlined'}
                fullWidth
                size="large"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // avoid double updates (Card click + Button click)
                  handleShowCheckout(e);
                }}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  fontSize: '1rem',
                }}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    })}
  </Stack>

  <Typography
    variant="body2"
    sx={{
      textAlign: 'center',
      color: theme.palette.text.secondary,
      mt: 3,
      maxWidth: 600,
      mx: 'auto',
    }}
  >
    Both plans include our 1-month free trial. You can cancel anytime during the trial period.
  </Typography>
</Box>





        {/* Testimonials */}
        <Box sx={{ mb: 12 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              mb: 6,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Loved by Music Lovers
          </Typography>
          
          <Grid container spacing={3}>
            {testimonials.map((testimonial) => (
              <Grid key={testimonial.name} item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    background: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: theme.palette.primary.main,
                          fontWeight: 700,
                          mr: 2
                        }}
                      >
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: theme.palette.text.primary, mb: 2 }}>
                      "{testimonial.content}"
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>
                            ★
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              mb: 6,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Frequently Asked Questions
          </Typography>
          
          <Grid container spacing={3}>
            {faqs.map((faq, index) => (
              <Grid key={index} item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {faq.question}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {faq.answer}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Final CTA */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: 6,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            mb: 8,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Ready to transform your listening experience?
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto',
              mb: 4
            }}
          >
           
            Start your free trial today – no commitment, cancel anytime.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleShowCheckout}
            endIcon={<ArrowForward />}
            sx={{
              px: 8,
              py: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1.1rem',
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: `0 15px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.02)',
                boxShadow: `0 20px 50px ${alpha(theme.palette.primary.main, 0.6)}`,
              },
            }}
          >
            Start Your Free Trial
          </Button>
          
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: theme.palette.text.secondary,
              mt: 3
            }}
          >
            No credit card required • 1-month free trial • Cancel anytime
          </Typography>
        </Box>
      </Container>

      {showCheckout && (
        <Elements stripe={stripePromise}>
          <PremiumCheckout
            onClose={handleCloseCheckout}
            onSubscribe={() => {
              handleCloseCheckout();
              // Handle subscription logic here
            }}
          />
        </Elements>
      )}
    </Box>
  );
}
