

import { Elements } from '@stripe/react-stripe-js';
import CompletePage from './CompletePage.jsx';
import { useStripePromise } from '../../../../utils/stripeLoader.js';

const CompletePageWrapper = () => {
  const stripePromise = useStripePromise();

  return (
    <>
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <CompletePage />
        </Elements>
      ) : null}
    </>
  );
};

export default CompletePageWrapper;
