import { jwtDecode } from "jwt-decode";

class ArtistAuth {
  getProfile() {
    try {
      const artistToken = this.getToken();
      if (!artistToken) {
        // console.error("No artist token found");
        return null;
      }
      return jwtDecode(artistToken);
    } catch (err) {
      // console.error("Invalid artist token:", err.message);
      return null;
    }
  }

 isArtist() {
  const artistToken = this.getToken();
  if (!artistToken) return false; 
  return !this.isTokenExpired(artistToken);
}


  isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      // console.error("Error decoding token:", err.message);
      return true; // Treat as expired
    }
  }

  getToken() {
    return localStorage.getItem("artist_id_token"); // Use unique key
  }

  login(idToken) {
    localStorage.setItem("artist_id_token", idToken);
    window.location.assign("/artist/verification"); // Redirect to verification
  }

  logout() {
    localStorage.removeItem("artist_id_token");
    window.location.assign("/loginSignin"); // Redirect to login
  }
}

export default new ArtistAuth();
