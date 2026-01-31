import { useEffect, useState } from 'react';

let stripePromise = null;

export const getStripePromise = async () => {
  if (stripePromise) return stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  const stripeModule = await import('@stripe/stripe-js');
  stripePromise = stripeModule.loadStripe(key);
  return stripePromise;
};

export const useStripePromise = () => {
  const [promise, setPromise] = useState(null);

  useEffect(() => {
    let active = true;
    getStripePromise().then((p) => {
      if (active) {
        setPromise(p);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return promise;
};
