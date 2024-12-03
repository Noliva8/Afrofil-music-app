import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import App from './App.jsx';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlist from './pages/Playlist';
import Libraly from './pages/Libraly';
import More from './pages/More';
import ErrorPage from './pages/ErrorPage';
import LoginSignin from './pages/LoginSignin';
import Auth from './utils/auth'; // Import the Auth utility


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: Auth.loggedIn() ? <Navigate to="/home" replace /> : <LoginSignin />  
      },
      {
        path: "/home",
        element: Auth.loggedIn() ? <Home /> : <Navigate to="/" replace />  
      },
      {
        path: "/search",
        element: Auth.loggedIn() ? <Search /> : <Navigate to="/" replace />  
      },
      {
        path: "/libraly",
        element: Auth.loggedIn() ? <Libraly /> : <Navigate to="/" replace /> 
      },
      {
        path: "/createPlaylist",
        element: Auth.loggedIn() ? <Playlist /> : <Navigate to="/" replace /> 
      },
      {
        path: "/more",
        element: Auth.loggedIn() ? <More /> : <Navigate to="/" replace />  
      },
    ]
  },
]);

// Render the router
ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
