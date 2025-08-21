

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CompletePage from './CompletePage.jsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CompletePageWrapper = () => {
  return (
    <Elements stripe={stripePromise}>
      <CompletePage />
    </Elements>
  );
};

export default CompletePageWrapper;
