import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import PremiumCheckoutPage from './PremiumCheckoutPage';
import UserAuth from '../../../../utils/auth.js';
import { useStripePromise } from '../../../../utils/stripeLoader.js';

const PremiumCheckoutWrapper = () => {
  const [userEmail, setUserEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // default plan

  useEffect(() => {
    const profile = UserAuth.getProfile();
    const email = profile?.data?.email;
    console.log(email)
    if (email) setUserEmail(email);
  }, []);

  const stripePromise = useStripePromise();

  if (!userEmail) return <div>Loading checkout...</div>;

  return (
    <>
      {!stripePromise ? (
        <div>Loading checkout...</div>
      ) : (
        <Elements stripe={stripePromise}>
          <PremiumCheckoutPage
            userEmail={userEmail}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        </Elements>
      )}
    </>
  );
};

export default PremiumCheckoutWrapper;
