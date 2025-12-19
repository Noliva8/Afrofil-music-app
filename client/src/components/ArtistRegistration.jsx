import React, { useState } from 'react';
import axios from 'axios';

const ArtistRegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    artistAka: '',
    email: '',
    password: '',
    role: 'artist', // Default role
    bio: '',
    profileImage: '',
    coverImage: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields (can be extended)
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.password) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      // Sending POST request to backend API
      const response = await axios.post('/api/artists/register', formData);

      // If registration is successful
      setSuccessMessage('Registration successful! Please log in.');
      setFormData({
        firstname: '',
        lastname: '',
        artistAka: '',
        email: '',
        password: '',
        role: 'artist',
        genre: '',
        bio: '',
        country: '',
        languages: '',  
        mood: '',      
      });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('There was an error with the registration. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="registration-form">
      <h2>Artist Registration</h2>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Artist AKA</label>
          <input
            type="text"
            name="artistAka"
            value={formData.artistAka}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Bio (optional)</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
          ></textarea>
        </div>

        <div>
          <label>Profile Image URL (optional)</label>
          <input
            type="text"
            name="profileImage"
            value={formData.profileImage}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Cover Image URL (optional)</label>
          <input
            type="text"
            name="coverImage"
            value={formData.coverImage}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Register</button>
      </form>
      <button type="button" onClick={() => window.location.assign('/')} style={{ marginTop: '16px' }}>
        ← Back to home
      </button>
    </div>
  );
};

export default ArtistRegistrationForm;
