import { lazy, Suspense } from 'react';
import { PlanGate, StudioGate } from '../components/AuthenticateCompos/routeProtection.jsx';


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
      <PlanGate
        element={
          <Suspense fallback={<div />}>
            <LazyPlanSelection />
          </Suspense>
        }
        
      />
    ),
  },

  {
    path: 'artist/studio',
    element: (
      <StudioGate
        element={
          <Suspense fallback={<div />}>
            <LazyArtistStudio />
          </Suspense>
        }
      />
    ),
    children: [
      {
        path: 'content',
        element: (
          <StudioGate
            element={
              <Suspense fallback={<div />}>
                <LazyContentFreePlan />
              </Suspense>
            }
          />
        ),
      },
      {
        path: 'home',
        element: (
          <StudioGate
            element={
              <Suspense fallback={<div />}>
                <LazyHomeFreePlan />
              </Suspense>
            }
          />
        ),
      },
      {
        path: 'dashboard',
        element: (
          <StudioGate
            element={
              <Suspense fallback={<div />}>
                <LazyDashboardFreePlan />
              </Suspense>
            }
          />
        ),
      },
      {
        path: 'dashboard/ProPlan',
        element: (
          <StudioGate
            element={
              <Suspense fallback={<div />}>
                <LazyArtistDashboardProPlan />
              </Suspense>
            }
          />
        ),
      },
      {
        path: 'dashboard/premium',
        element: (
          <StudioGate
            element={
              <Suspense fallback={<div />}>
                <LazyArtistDashboardPremium />
              </Suspense>
            }
          />
        ),
      },
    ],
  },
];
