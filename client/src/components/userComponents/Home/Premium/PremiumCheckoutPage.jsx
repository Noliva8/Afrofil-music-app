import React, { useState, useCallback } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { FiCreditCard, FiShield } from 'react-icons/fi';
import { FaPaypal } from 'react-icons/fa';
import { BsStars } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import './PremiumCheckoutPage.css';
import { SitemarkIcon } from '../../../themeCustomization/customIcon';

const stripeInputOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': { color: '#b3b3b3' },
      iconColor: '#1db954',
    },
    invalid: {
      color: '#ff3860',
    },
  },
};

const PremiumCheckoutPage = ({ selectedPlan, setSelectedPlan, userEmail }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const stripe = useStripe();
  const elements = useElements();

  const BASE_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  const plans = {
    monthly: {
      name: 'Monthly Plan',
      price: 8.0,
      afterTrial: 'After 1-month free trial',
      interval: 'month',
    },
    yearly: {
      name: 'Yearly Plan',
      price: 80.0,
      afterTrial: 'After 1-month free trial',
      interval: 'year',
      savings: 'Save 15%',
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
        // ✅ Always redirect to /complete with the client secret
        navigate(`/complete?payment_intent_client_secret=${clientSecret}`);
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, userEmail, selectedPlan, navigate]);

  if (!userEmail) return <div>Loading user info...</div>;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <SitemarkIcon />
          <h1>Complete Your Subscription</h1>
          <p className="subheader">Start your 1-month free trial</p>
        </div>

        <div className="checkout-grid">
          <div className="payment-row">
            <div className="payment-section">
              <h2 className="section-title">Payment Method</h2>
              <div className="payment-methods">
                <button
                  type="button"
                  className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                  aria-label="Pay with card"
                  disabled={isProcessing}
                >
                  <FiCreditCard />
                  <span>Credit/Debit Card</span>
                </button>
                <button
                  type="button"
                  className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                  aria-label="Pay with PayPal"
                  disabled
                >
                  <FaPaypal />
                  <span>PayPal (coming soon)</span>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <form onSubmit={handleSubmit}>
                  <div className="card-details">
                    <label className="input-label">Card Number</label>
                    <div className="stripe-card">
                      <CardNumberElement options={stripeInputOptions} />
                    </div>
                  </div>
                  <div className="card-details">
                    <label className="input-label">Expiry Date</label>
                    <div className="stripe-card">
                      <CardExpiryElement options={stripeInputOptions} />
                    </div>
                  </div>
                  <div className="card-details">
                    <label className="input-label">CVC</label>
                    <div className="stripe-card">
                      <CardCvcElement options={stripeInputOptions} />
                    </div>
                  </div>

                  <div className="security-info">
                    <FiShield />
                    <span>Your payment is secured with 256-bit encryption</span>
                  </div>

                  {errorMessage && (
                    <div className="error-message">
                      <p>{errorMessage}</p>
                    </div>
                  )}

                  <button type="submit" className="subscribe-btn" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Start 1-Month Free Trial'}
                  </button>
                </form>
              )}
            </div>

            <div className="order-summary">
              <h2 className="section-title">Order Summary</h2>
              <div className="plan-options">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`plan-option ${selectedPlan === key ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedPlan(key)}
                  >
                    <div className="plan-radio">
                      {selectedPlan === key && <div className="radio-dot" />}
                    </div>
                    <div className="plan-info">
                      <h3>{plan.name}</h3>
                      <div className="plan-price">
                        ${plan.price}
                        <small>/{plan.interval}</small>
                        {plan.savings && <span className="savings-badge">{plan.savings}</span>}
                      </div>
                      <p className="trial-info">{plan.afterTrial}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-section">
                <div className="total-row">
                  <span>Total Today:</span>
                  <span>$0.00</span>
                </div>
                <div className="total-row">
                  <span>After Trial:</span>
                  <span>${plans[selectedPlan].price}/{plans[selectedPlan].interval}</span>
                </div>
              </div>

              <div className="terms-notice">
                <p>
                  By continuing, you agree to our <a href="#">Terms</a> and acknowledge
                  automatic renewal after trial unless canceled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumCheckoutPage;
