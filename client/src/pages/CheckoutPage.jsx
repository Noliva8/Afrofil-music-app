import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import UserAuth from "../utils/auth.js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const profile = UserAuth.getProfile();
  const userEmail = profile?.email;

  const [clientSecret, setClientSecret] = useState('');

useEffect(() => {
  fetch('http://localhost:3001/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail }),
  })
    .then((res) => res.json())
    .then((data) => {
      setClientSecret(data.clientSecret);
    })
    .catch((err) => console.error('Subscription Fetch Error:', err));
}, []);


  const appearance = { theme: 'stripe' };
  const options = { clientSecret, appearance };

  return (
    <div>
      <h2>Subscribe to Premium</h2>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
         <CheckoutForm clientSecret={clientSecret} />

        </Elements>
      )}
    </div>
  );
};

export default CheckoutPage;
