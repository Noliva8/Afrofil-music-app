import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

const CheckoutForm = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div style={{
        border: '1px solid #ccc',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        backgroundColor: '#f9f9f9'
      }}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#32325d',
              '::placeholder': { color: '#aab7c4' }
            },
            invalid: { color: '#fa755a' }
          }
        }} />
      </div>

      <button type="submit" disabled={!stripe} style={{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#6772e5',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer'
      }}>
        Subscribe
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginTop: '1rem' }}>🎉 Subscription successful!</p>}
    </form>
  );
};

export default CheckoutForm;
