import { jwtDecode } from "jwt-decode";
import { sessionManager } from "./sessions/sessionGenerator";

class UserAuth {
getProfile() {
  try {
    const userToken = this.getToken();
    if (!userToken || this.isTokenExpired(userToken)) {
    
      return null;
    }
    return jwtDecode(userToken);
  } catch (err) {
    console.error("Invalid user token:", err.message);
    return null;
  }
}


  loggedIn() {
    const userToken = this.getToken();
    return userToken && !this.isTokenExpired(userToken);
  }

  isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      console.error("Error decoding token:", err.message);
      return true; // Treat as expired
    }
  }

  getToken() {
    return localStorage.getItem("user_id_token"); // Use unique key
  }

  login(idToken) {
    localStorage.setItem("user_id_token", idToken);
    window.location.assign("/"); // Redirect to home
  }

  logout() {
    localStorage.removeItem("user_id_token");
      sessionManager.endSession();
    window.location.reload(); // Reload to reset state
  }
}

export default new UserAuth();
