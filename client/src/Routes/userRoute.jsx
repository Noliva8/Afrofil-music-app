import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/AuthenticateCompos/routeProtection.jsx';

const LazyCompletePageWrapper = lazy(() =>
  import('../components/userComponents/Home/Premium/CompletePageWrapper.jsx')
);
const LazyHome = lazy(() => import('../pages/Home'));
const LazyPlaylist = lazy(() => import('../pages/Playlist'));
const LazyCollectionPage = lazy(() => import('../pages/CollectionPage.jsx'));
const LazyLibraly = lazy(() => import('../pages/Libraly'));
const LazyMore = lazy(() => import('../pages/More'));
const PremiumCheckoutWrapper = lazy(() =>
  import('../components/userComponents/Home/Premium/PremiumCheckoutWrapper.jsx')
);

export const UserRoutes = [
  {
    index: true,
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyHome />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'checkout',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <PremiumCheckoutWrapper />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'complete',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyCompletePageWrapper />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'createPlaylist',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyPlaylist />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'collection/:section',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyCollectionPage />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'collection/playlist/:playlistId',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyCollectionPage />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'collection/:section/:subsection',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyCollectionPage />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'library',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyLibraly />
          </Suspense>
        }
      />
    ),
  },
  {
    path: 'more',
    element: (
      <ProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyMore />
          </Suspense>
        }
      />
    ),
  },
];
