import React, { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './CompletePage.css';

// Icons
import { BsCheck2Circle } from 'react-icons/bs';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { PiHourglassBold } from 'react-icons/pi';
import { FiArrowRight } from 'react-icons/fi';

/**
 * Payment status configuration mapping
 */
const STATUS_MAP = {
  succeeded: {
    message: 'Payment succeeded!',
    color: '#30B130',
    Icon: <BsCheck2Circle size={48} />,
    description: 'Welcome to AfroFeel Premium 🎧 Your subscription is now active.',
  },
  processing: {
    message: 'Payment is processing...',
    color: '#6D6E78',
    Icon: <PiHourglassBold size={48} />,
    description: 'We\'re finalizing your payment. You\'ll receive a confirmation soon.',
  },
  requires_payment_method: {
    message: 'Payment failed',
    color: '#DF1B41',
    Icon: <IoCloseCircleOutline size={48} />,
    description: 'Something went wrong. Please try again with a different payment method.',
  },
  default: {
    message: 'Something went wrong',
    color: '#DF1B41',
    Icon: <IoCloseCircleOutline size={48} />,
    description: 'Unable to retrieve payment status. Please try again later.',
  },
};

/**
 * Payment completion page component that handles Stripe payment intent status
 */
export default function CompletePage() {
  const stripe = useStripe();
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [intentId, setIntentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  // Show loader after a brief delay to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch and validate payment intent status
  useEffect(() => {
    const fetchIntentStatus = async () => {
      const clientSecret = new URLSearchParams(window.location.search).get(
        'payment_intent_client_secret'
      );

      if (!clientSecret || !stripe) return;

      try {
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        
        if (paymentIntent) {
          setStatus(paymentIntent.status);
          setIntentId(paymentIntent.id);
        }
      } catch (err) {
        console.error('Error retrieving payment intent:', err);
        setStatus('default');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntentStatus();
  }, [stripe]);

  // Loading state
  if (isLoading && showLoader) {
    return (
      <div className="complete-wrapper">
        <div className="complete-card">
          <div className="icon-wrapper" style={{ color: '#6D6E78' }}>
            <PiHourglassBold size={48} />
          </div>
          <h1 className="title" style={{ color: '#6D6E78' }}>
            Checking Payment...
          </h1>
          <p className="subtitle">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  // Avoid flash of content before loader appears
  if (isLoading && !showLoader) return null;

  // Get status configuration
  const { message, Icon, color, description } = STATUS_MAP[status] || STATUS_MAP.default;

  return (
    <div className="complete-wrapper">
      <div className={`complete-card ${status === 'processing' ? 'processing' : ''}`}>
        {/* Status Icon */}
        <div className="icon-wrapper" style={{ color }}>
          {Icon}
        </div>

        {/* Status Message */}
        <h1 className="title" style={{ color }}>
          {message}
        </h1>
        
        {/* Status Description */}
        <p className="subtitle">
          {description}
        </p>

        {/* Payment Details */}
        {intentId && (
          <div className="intent-info">
            <p>
              <strong>Payment ID:</strong> {intentId}
            </p>
            <p>
              <strong>Status:</strong> {status}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {status === 'succeeded' && (
            <button 
              className="btn explore" 
              onClick={() => navigate('/')}
            >
              Start Exploring AfroFeel <FiArrowRight />
            </button>
          )}
          
          {status === 'requires_payment_method' && (
            <button 
              className="btn retry" 
              onClick={() => navigate('/checkout')}
            >
              Try Again
            </button>
          )}
          
          {status === 'processing' && (
            <button className="btn neutral" disabled>
              Waiting for confirmation...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}