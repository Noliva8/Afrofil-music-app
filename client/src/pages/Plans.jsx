import { SELECT_PLAN } from '../utils/mutations';
import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppTheme from '../components/theme';
import { useMutation } from '@apollo/client';
import ArtistAuth from '../utils/artist_auth'; 


const PlanSelection = () => {
  const [selectPlan] = useMutation(SELECT_PLAN);

  const handlePlanSelection = async (plan) => {
    const profile = ArtistAuth.getProfile(); 
    console.log(profile);

    if (!profile || !profile.data._id) {
      alert('Artist is not logged in or artist ID is missing.');
      return;
    }

    const artistId = profile.data._id; // Extract artistId from profile
    console.log(`Artist ID: ${artistId}, Plan: ${plan}`); // Debugging log

    try {
      const { data } = await selectPlan({
        variables: { artistId, plan },
      });

    //   if (data.selectPlan) {
    //     // alert('Plan selected successfully!');
    //     window.location.href = '/artist/dashboard';
    //   } else {
    //     // alert('Failed to select plan. Please try again.');
    //   }
    } catch (error) {
      console.error('Error selecting plan:', error.message); // Improved logging
      alert('An error occurred while selecting the plan. Please try again.');
    }
  };


  return (

<AppTheme >
 <CssBaseline enableColorScheme />

<Stack
        direction="column"
        component="main"
        sx={[
          {
            justifyContent: 'center',
            height: 'calc((1 - var(--template-frame-height, 0)) * 100%)',
            marginTop: 'max(40px - var(--template-frame-height, 0px), 0px)',
            minHeight: '100%',
          },
          (theme) => ({
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              zIndex: -1,
              inset: 0,
              backgroundImage:
                'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
              backgroundRepeat: 'no-repeat',
              ...theme.applyStyles('dark', {
                backgroundImage:
                  'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
              }),
            },
          }),
        ]}
      >

        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: { xs: 6, sm: 12 },
            p: 2,
            mx: 'auto',
          }}
        >


            <Stack
            direction={{ xs: 'column-reverse', md: 'row' }}
            sx={{
              justifyContent: 'center',
              gap: { xs: 6, sm: 12 },
              p: { xs: 2, sm: 4 },
              m: 'auto',
            }}
          >



             <div>
      <h1>Select Your Plan</h1>
      <button onClick={() => handlePlanSelection('FreePlan')}>Free Plan</button>
      <button onClick={() => handlePlanSelection('PremiumPlan')}>Premium Plan</button>
      <button onClick={() => handlePlanSelection('ProPlan')}>Pro Plan</button>
    </div>








          </Stack>




        </Stack>




      </Stack>









</AppTheme>
   
  );
};

export default PlanSelection;