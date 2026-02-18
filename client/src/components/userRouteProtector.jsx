import { Navigate } from "react-router-dom";
import UserAuth from "../utils/auth";




const ProtectedRoute = ({ element }) => {
 
  return UserAuth.loggedIn() ? element : <Navigate to="/welcome" />;
};

export default ProtectedRoute;
