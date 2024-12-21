import { useEffect } from 'react';

const ArtistVerificationPageAfterClick = () => {
  useEffect(() => {
    const artistToken = localStorage.getItem('artist_token'); // Assuming token is stored in localStorage

    if (!artistToken) {
      console.error('No token found');
      return;
    }

    // Send the token to the backend for verification
    fetch(`http://localhost:3001/confirmation/${artistToken}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Verification successful');
          
          // Open the login page in a new tab/window
          const loginWindow = window.open('http://localhost:3000/artist/login', '_blank');
          
          // Wait for the login page to load, then close the verification tab
          setTimeout(() => {
            if (loginWindow) {
              // Close the verification tab
              window.close();
            }
          }, 3000); // You can adjust this timeout based on how long it takes to load the login page
        } else {
          console.error('Verification failed:', data.message);
          alert('Verification failed: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error during verification:', error);
        alert('Error during verification');
      });
  }, []);

  return (
    <div>
      <h1>Verification Successful!</h1>
      <p>You are being redirected to the login page...</p>
      <p>If the page doesn't close automatically, please close it manually.</p>
    </div>
  );
};

export default ArtistVerificationPageAfterClick;
