// server/routes/createSubscription.js

import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// Map plan names to real Stripe price IDs
const PRICE_IDS = {
  monthly: 'price_1Rka7bQ9NmezclKgTrOESktn',
  yearly: 'price_1Rkr7KQ9NmezclKgORtZremX'
};

router.post('/create-subscription', async (req, res) => {
  const { email, paymentMethodId, plan } = req.body;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return res.status(400).json({ error: 'Invalid plan provided' });
  }

  try {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const clientSecret = paymentIntent?.client_secret;

    if (!clientSecret) {
      console.error('Missing client_secret:', subscription);
      return res.status(400).json({ error: 'Failed to get client secret' });
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret
    });
  } catch (err) {
    console.error('Stripe subscription error:', err.message);
    res.status(400).json({ error: err.message });
  }
});


export default router;
