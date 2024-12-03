import { jwtDecode } from "jwt-decode";

class Auth {
  getProfile() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No token found");
      }
      return jwtDecode(token); // Use jwtDecode instead of decode
    } catch (err) {
      console.error("Invalid token: ", err.message);
      return null;
    }
  }

  loggedIn() {
    const token = this.getToken();
    return token && !this.isTokenExpired(token) ? true : false;
  }

  isTokenExpired(token) {
    const decoded = jwtDecode(token); // Use jwtDecode instead of decode
    if (decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('id_token');
      return true;
    }
    return false;
  }

  getToken() {
    return localStorage.getItem('id_token');
  }

  login(idToken) {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
  }

  logout() {
    localStorage.removeItem('id_token');
    window.location.reload('/login');
  }
}

export default new Auth();
