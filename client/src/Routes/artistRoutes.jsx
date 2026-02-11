import { lazy, Suspense } from 'react';
import { ArtistProtectedRoute } from '../components/AuthenticateCompos/routeProtection.jsx';

const LazyPlanSelection = lazy(() => import('../pages/Plans.jsx'));
const LazyArtistStudio = lazy(() => import('../pages/ArtistStudio'));
const LazyArtistDashboardPremium = lazy(
  () => import('../pages/ArtistDashboardPremium.jsx')
);
const LazyArtistDashboardProPlan = lazy(
  () => import('../pages/ArtistDashboardProPlan.jsx')
);
const LazyContentFreePlan = lazy(
  () => import('../pages/freeDashboard/ContentFreePlan.jsx')
);
const LazyHomeFreePlan = lazy(
  () => import('../pages/freeDashboard/HomeFreePlan.jsx')
);
const LazyDashboardFreePlan = lazy(
  () => import('../pages/freeDashboard/DashboardFreePlan.jsx')
);

export const ArtistRoutes = [
  {
    path: 'artist/plan',
    element: (
      <ArtistProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyPlanSelection />
          </Suspense>
        }
        redirectToVerification={true}
      />
    ),
  },
  {
    path: 'artist/studio',
    element: (
      <ArtistProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyArtistStudio />
          </Suspense>
        }
        redirectToVerification={true}
      />
    ),
    children: [
      {
        path: 'content',
        element: (
          <ArtistProtectedRoute
            element={
              <Suspense fallback={<div />}>
                <LazyContentFreePlan />
              </Suspense>
            }
            redirectToVerification={true}
          />
        ),
      },
      {
        path: 'home',
        element: (
          <ArtistProtectedRoute
            element={
              <Suspense fallback={<div />}>
                <LazyHomeFreePlan />
              </Suspense>
            }
            redirectToVerification={true}
          />
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ArtistProtectedRoute
            element={
              <Suspense fallback={<div />}>
                <LazyDashboardFreePlan />
              </Suspense>
            }
            redirectToVerification={true}
          />
        ),
      },
    ],
  },
  {
    path: 'artist/dashboard/ProPlan',
    element: (
      <ArtistProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyArtistDashboardProPlan />
          </Suspense>
        }
        redirectToVerification={true}
      />
    ),
  },
  {
    path: 'artist/dashboard/premium',
    element: (
      <ArtistProtectedRoute
        element={
          <Suspense fallback={<div />}>
            <LazyArtistDashboardPremium />
          </Suspense>
        }
        redirectToVerification={true}
      />
    ),
  },
];
