import './CSS/loginSignin.css';
import logo from '../images/logo.png';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER, CREATE_USER } from '../utils/mutations';
import UserAuth from '../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import ForArtistOnly from '../components/forArtistOnly';

const LoginSignin = function () {
  // Page toggle state
  const [formDisplay, setFormDisplay] = useState('');

  // Handlers for displaying forms
  function handleLoginFormDisplay() {
    setFormDisplay('login');
  }

  function handleSignupFormDisplay() {
    setFormDisplay('signup');
  }

  // Login form states and handlers
  const [loginFormState, setLoginFormState] = useState({ email: '', password: '' });
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [login, { error: loginError }] = useMutation(LOGIN_USER);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginFormState({
      ...loginFormState,
      [name]: value,
    });
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: { ...loginFormState },
      });
      UserAuth.login(data.login.userToken);
      setLoginErrorMessage(''); 
    } catch (e) {
      setLoginErrorMessage('Invalid email or password.');
      console.error(e);
    }

    // Clear form values
    setLoginFormState({ email: '', password: '' });
  };

  // Signup form states and handlers
  const [signupFormState, setSignupFormState] = useState({ username: '', email: '', password: '' });
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [createUser, { error: signupError }] = useMutation(CREATE_USER);

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupFormState({
      ...signupFormState,
      [name]: value,
    });
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await createUser({
        variables: { ...signupFormState },
      });
      UserAuth.login(data.createUser.userToken);
      setSignupErrorMessage(''); // Clear error if successful
    } catch (e) {
      setSignupErrorMessage('Signup failed. Please ensure your details are correct.');
      console.error(e);
    }

    // Clear form values
    setSignupFormState({ username: '', email: '', password: '' });
  };

  // Hide or show password toggle logic
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);

  const toggleLoginPasswordVisibility = () => {
    setShowPasswordLogin((prevState) => !prevState);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowPasswordSignup((prevState) => !prevState);
  };

  return (
    <div>
       <ForArtistOnly />
      {formDisplay === '' && (
        <div className="login-page">
          <div className="content">
            <img className="logo" src={logo} alt="logo" />
            <h1>WELCOME TO AFROFEEL</h1>
            <p>Join the community and feel the music</p>
          </div>

          <div className="signbtn">
            <div>
              <button id="signUpOnly" type="button" onClick={handleSignupFormDisplay}>
                Sign up
              </button>
            </div>
            <div>
              <button type="button" onClick={handleLoginFormDisplay}>
                Log in
              </button>
            </div>
          </div>
        </div>
      )}

      {formDisplay === 'login' && (
        <div className="login-form">
          <div className="loginHeader">
            <img className="logo" src={logo} alt="logo" />
            <h2>Log In</h2>
          </div>

          <form className="loginForm" onSubmit={handleLoginSubmit}>
            <div className="loginFormInputs">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                onChange={handleLoginChange}
                value={loginFormState.email}
                required
              />
            </div>

           <div className="loginFormInputs">
  <label htmlFor="password">Password:</label>
  <div className="password-container">
    <input
      type={showPasswordLogin ? 'text' : 'password'}
      id="password"
      name="password"
      onChange={handleLoginChange}
      value={loginFormState.password}
      required
    />
    <span
      className="toggle-password"
      onClick={toggleLoginPasswordVisibility}
    >
      {showPasswordLogin ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
    </span>
  </div>
</div>
            {loginErrorMessage && <p className="error-message">{loginErrorMessage}</p>}

            <button type="submit">Log In</button>
            <p>or</p>
            <button type="button" className="goBackLogin" onClick={handleSignupFormDisplay}>
              Sign up to feel them
            </button>
          </form>
        </div>
      )}

      {formDisplay === 'signup' && (
        
        <div className="login-form">
          <div className="loginHeader">
            <img className="logo" src={logo} alt="logo" />
            <h2>Sign Up</h2>
          </div>

          <form className="loginForm" onSubmit={handleSignupSubmit}>
            <div className="loginFormInputs">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                onChange={handleSignupChange}
                value={signupFormState.username}
                required
              />
            </div>

            <div className="loginFormInputs">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                onChange={handleSignupChange}
                value={signupFormState.email}
                required
              />
            </div>

            <div className="loginFormInputs">
              <label htmlFor="password">Password:</label>
             


                <input
                  type={showPasswordSignup ? 'text' : 'password'}
                  id="password"
                  name="password"
                  onChange={handleSignupChange}
                  value={signupFormState.password}
                  required
                />

                <span
                  className="toggle-password customEye"
                  onClick={toggleSignupPasswordVisibility}
                >
                  {showPasswordSignup ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                </span>
             
            </div>

            {signupErrorMessage && <p className="error-message">{signupErrorMessage}</p>}

            <button type="submit">Sign Up</button>
            <p>or</p>
            <button type="button" className="goBackLogin" onClick={handleLoginFormDisplay}>
              Log in
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginSignin;
