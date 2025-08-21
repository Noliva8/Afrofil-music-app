import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PremiumCheckoutPage from './PremiumCheckoutPage';
import UserAuth from '../../../../utils/auth.js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PremiumCheckoutWrapper = () => {
  const [userEmail, setUserEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // default plan

  useEffect(() => {
    const profile = UserAuth.getProfile();
    const email = profile?.data?.email;
    console.log(email)
    if (email) setUserEmail(email);
  }, []);

  if (!userEmail) return <div>Loading checkout...</div>;

  return (
    <Elements stripe={stripePromise}>
      <PremiumCheckoutPage
        userEmail={userEmail}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
      />
    </Elements>
  );
};

export default PremiumCheckoutWrapper;
