import { useState } from 'react';
import ArtistAuth from '../utils/artist_auth';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { SELECT_PLAN } from '../utils/mutations';
import AppNavBar from '../components/AppNavbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MuiCard from '@mui/material/Card';
import { alpha, useTheme } from '@mui/material/styles';

// Plan Data
const plans = [
  {
    title: 'Free Plan',
    description: 'Start uploading with the creator tools included in your FloLup account.',
    price: 'Free',
    locked: false,
  },
  {
    title: 'Premium Plan',
    description: 'More promotion, monetization, and audience tools for active creators.',
    price: '$4 per month',
    locked: true,
  },
  {
    title: 'Pro Plan',
    description: 'Advanced release, analytics, and collaboration features for professional creator teams.',
    price: '$12 per month',
    locked: true,
  },
];

// Plan Selection Component
const PlanSelection = () => {
  const theme = useTheme();
  const [selectPlan] = useMutation(SELECT_PLAN);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 

const handlePlanSelection = async (plan) => {
  setLoading(true);

  const profile = ArtistAuth.getProfile();
  if (!profile || !profile.data._id) {
    console.error('No creator profile or artist ID found');
    alert('Creator profile is missing. Please complete your profile again.');
    setLoading(false);
    return;
  }
  
  const artistId = profile.data._id;
  
  try {
    
    const { data } = await selectPlan({
      variables: { artistId, plan },
    });


    // Manually ensure selectedPlan is true
    const profileData = {
      ...data.selectPlan,
      selectedPlan: true
    };
    

    localStorage.setItem('artistProfile', JSON.stringify({ 
      data: profileData 
    }));

    if (data.selectPlan.plan === "Free Plan") {
      navigate('/artist/studio/home');
    } else if (data.selectPlan.plan === "Premium Plan") {
      navigate('/artist/dashboard/premium');
    } else if (data.selectPlan.plan === "Pro Plan") {
      navigate('/artist/dashboard/ProPlan');
    }
    
  } catch (error) {
    console.error('Error selecting plan:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: theme.palette.text.primary,
        background: `
          radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 26%),
          linear-gradient(to bottom, #0F0F0F, #1A1A1A)
        `,
      }}
    >
      <AppNavBar />

      <Box
        component="main"
        sx={{
          width: '100%',
          maxWidth: 1180,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, md: 7 },
        }}
      >
        <Stack spacing={1.5} sx={{ mb: { xs: 4, md: 5 }, maxWidth: 720 }}>
          <Chip
            label="Creator setup"
            sx={{
              alignSelf: 'flex-start',
              borderRadius: '8px',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 800,
            }}
          />
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 800,
              letterSpacing: 0,
              lineHeight: 1.05,
            }}
          >
            Choose how you want to upload
          </Typography>
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '1rem', sm: '1.08rem' },
              lineHeight: 1.6,
            }}
          >
            Start with the free upload tools today. Paid creator plans will unlock here when they are ready.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2.5,
          }}
        >
          {plans.map((plan) => (
            <MuiCard
              key={plan.title}
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 360,
                p: { xs: 2.5, sm: 3 },
                borderRadius: '8px',
                background: alpha(theme.palette.background.paper || '#111119', 0.86),
                borderColor: plan.locked
                  ? alpha(theme.palette.text.primary, 0.08)
                  : alpha(theme.palette.primary.main, 0.38),
                boxShadow: theme.shadows[2],
              }}
            >
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {plan.title}
                  </Typography>
                  {plan.locked && (
                    <Chip
                      label="Soon"
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                        color: theme.palette.text.secondary,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>

                <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.55 }}>
                  {plan.description}
                </Typography>

                <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, mt: 1 }}>
                  {plan.price}
                </Typography>
              </Stack>

              <Button
                onClick={() => handlePlanSelection(plan.title)}
                disabled={loading || plan.locked}
                fullWidth
                variant={plan.locked ? 'outlined' : 'contained'}
                sx={{
                  mt: 3,
                  py: 1.4,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 800,
                  ...(plan.locked
                    ? {
                        borderColor: alpha(theme.palette.text.primary, 0.14),
                        color: theme.palette.text.secondary,
                      }
                    : {
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        color: theme.palette.primary.contrastText,
                      }),
                }}
              >
                {plan.locked ? 'Coming soon' : loading ? 'Processing...' : 'Start uploading'}
              </Button>
            </MuiCard>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PlanSelection;
