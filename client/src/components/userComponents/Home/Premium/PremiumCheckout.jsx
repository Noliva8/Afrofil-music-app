import { useState } from 'react';
import {
  FiCheck,
  FiX,
  FiCreditCard,
  FiShield,
  FiMusic
} from 'react-icons/fi';
import { BsStars, BsSpotify } from 'react-icons/bs';
import { FaGooglePay, FaApplePay, FaPaypal } from 'react-icons/fa';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import UserAuth from "../../../../utils/auth.js";
import './premiumCheckout.css';




const PremiumCheckout = ({ onClose, onSubscribe }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const stripe = useStripe();
  const elements = useElements();
  const userEmail = UserAuth.getProfile()?.email;

  const plans = [
    {
      id: 'monthly',
      name: 'Premium Monthly',
      price: '$8.00',
      afterTrial: 'After 1-month free trial',
      features: ['Ad-free music', 'Offline listening', 'High quality audio']
    },
    {
      id: 'yearly',
      name: 'Premium Yearly',
      price: '$80.00',
      afterTrial: 'After 1-month free trial',
      savings: 'Save 15%',
      features: ['All Premium features', '1 year of uninterrupted music']
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    if (!stripe || !elements) return;

    try {
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        console.error(result.error.message);
        alert(result.error.message);
        setIsProcessing(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        setSuccess(true);
        onSubscribe(selectedPlan);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // ✅ Show success screen if payment is successful
  if (success) {
    return (
      <div className="checkout-overlay">
        <div className="checkout-container">
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
          <div className="checkout-header">
            <BsStars className="premium-icon" />
            <h2>🎉 You’re now a Premium Member!</h2>
            <p>Enjoy ad-free, offline, and high-quality audio with AfroFeel Premium.</p>
            <button onClick={onClose} className="subscribe-btn">Continue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-container">
        <button className="close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="checkout-header">
          <BsStars className="premium-icon" />
          <h2>Upgrade to AfroFeel Premium</h2>
          <p>Start your 1-month free trial, cancel anytime</p>
        </div>

        <div className="plan-selector">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="plan-radio">
                {selectedPlan === plan.id && <div className="radio-dot" />}
              </div>
              <div className="plan-details">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span>{plan.price}</span>
                  <small>/month</small>
                  {plan.savings && <span className="savings-badge">{plan.savings}</span>}
                </div>
                <p className="trial-info">{plan.afterTrial}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <FiCheck className="feature-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <h3>Payment Method</h3>
          <div className="payment-options">
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <FiCreditCard />
              <span>Credit/Debit Card</span>
            </button>
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'paypal' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <FaPaypal />
              <span>PayPal</span>
            </button>
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'google' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('google')}
            >
              <FaGooglePay />
              <span>Google Pay</span>
            </button>
            <button
              type="button"
              className={`payment-option ${paymentMethod === 'apple' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('apple')}
            >
              <FaApplePay />
              <span>Apple Pay</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-details">
              <label>Card Details</label>
              <div className="stripe-card-element">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#333',
                        '::placeholder': { color: '#aaa' },
                      },
                      invalid: {
                        color: '#e5424d',
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="security-info">
            <FiShield />
            <span>Your payment is secured with 256-bit encryption</span>
          </div>

          <button
            type="submit"
            className="subscribe-btn"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Start 1-Month Free Trial'}
          </button>

          <div className="terms-notice">
            <p>
              By clicking above, you agree to our <a href="#">Terms</a> and acknowledge
              that your subscription will automatically renew for {selectedPlan === 'yearly' ? '$80.00/year' : '$8.00/month'}
              after the trial unless canceled.
            </p>
          </div>
        </form>

        <div className="benefits-section">
          <h3>Premium Benefits</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <FiMusic className="benefit-icon" />
              <h4>Ad-Free Listening</h4>
              <p>Enjoy your music without interruptions</p>
            </div>
            <div className="benefit-card">
              <BsSpotify className="benefit-icon" />
              <h4>Offline Mode</h4>
              <p>Download songs and listen anywhere</p>
            </div>
            <div className="benefit-card">
              <FiCheck className="benefit-icon" />
              <h4>High Quality Audio</h4>
              <p>Experience crystal clear sound</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumCheckout;
