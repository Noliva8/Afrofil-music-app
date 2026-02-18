import { Navigate } from 'react-router-dom';

const LoginOrSignupRedirect = () => (
  <Navigate to="/welcome" replace />
);

export default LoginOrSignupRedirect;
