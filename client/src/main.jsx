import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import ErrorPage from './pages/ErrorPage';
import { afrofeelTheme } from './pages/CSS/themeSettins.js';
import { PublicRoutes } from './Routes/publicRoutes.jsx';
import { UserRoutes } from './Routes/userRoute.jsx';
import { ArtistRoutes } from './Routes/artistRoutes.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

const renderApp = (router) =>
  root.render(
    <ThemeProvider theme={afrofeelTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [...PublicRoutes, ...UserRoutes, ...ArtistRoutes],
  },
]);

renderApp(router);

const removeSplash = () => {
  const splash = document.getElementById('preload-splash');
  if (!splash) return;
  splash.classList.add('hidden');
  setTimeout(() => {
    splash.remove();
  }, 350);
};

if (document.readyState === 'complete') {
  removeSplash();
} else {
  window.addEventListener('load', removeSplash, { once: true });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered:', reg);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () =>
            console.log('SW state:', installing.state)
          );
        });
      })
      .catch((err) => console.error('SW registration failed:', err));
  });
}
