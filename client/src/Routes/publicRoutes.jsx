import { lazy, Suspense } from 'react';

const LazySearch = lazy(() => import('../pages/Search'));
const LazyPasswordReset = lazy(() => import('../pages/PasswordReset.jsx'));
const LazyCollectionLanding = lazy(() => import('../pages/CollectionLanding.jsx'));
const LazyExplore = lazy(() => import('../pages/Explore'));
const LazyExploreDetail = lazy(() => import('../pages/ExploreDetail.jsx'));
const LazyLoginSignin = lazy(() => import('../pages/LoginSignin'));
const LazyTerms = lazy(() => import('../pages/Terms.jsx'));
const LazySupport = lazy(() =>
  import('../pages/Support.jsx').then((mod) => ({ default: mod.Support }))
);
const LazySharedTrack = lazy(() => import('../pages/SharedTrack.jsx'));
const LazyArtistPage = lazy(() => import('../components/ArtistPage.jsx'));
const LazySongPage = lazy(() =>
  import('../components/SongPage.jsx').then((mod) => ({ default: mod.SongPage }))
);
const LazySingleSongPage = lazy(() =>
  import('../components/SingleSongPage.jsx').then((mod) => ({ default: mod.SingleSongPage }))
);
const LazyRadioStationPage = lazy(() =>
  import('../components/RadioStationPage.jsx').then((mod) => ({ default: mod.RadioStationPage }))
);
const LazyAlbumPage = lazy(() =>
  import('../pages/freeDashboard/AlbumPage.jsx').then((mod) => ({ default: mod.AlbumPage }))
);
const LazyArtistRegister = lazy(() => import('../pages/ArtistRegister'));
const LazyArtistVerificationPage = lazy(() =>
  import('../components/ArtistVerficationPage.jsx')
);
const LazyArtistLogin = lazy(() => import('../pages/ArtistLogin.jsx'));
const LazyFeed = lazy(() => import('../pages/Feed.jsx'));
const LazyPremiumPromo = lazy(() => import('../pages/PremiumPromo.jsx'));
const LazyVerifyEmail = lazy(() => import('../pages/VerifyEmail.jsx'));
import { VerifyGate } from '../components/AuthenticateCompos/routeProtection.jsx';


export const PublicRoutes = [
  {
    path: 'search',
    element: (
      <Suspense fallback={<div />}>
        <LazySearch />
      </Suspense>
    ),
  },
  {
    path: 'search/:query?',
    element: (
      <Suspense fallback={<div />}>
        <LazySearch />
      </Suspense>
    ),
  },
  {
    path: 'password-reset',
    element: (
      <Suspense fallback={<div />}>
        <LazyPasswordReset />
      </Suspense>
    ),
  },
  {
    path: 'collection',
    element: (
      <Suspense fallback={<div />}>
        <LazyCollectionLanding />
      </Suspense>
    ),
  },
  {
    path: 'explore',
    element: (
      <Suspense fallback={<div />}>
        <LazyExplore />
      </Suspense>
    ),
  },
  {
    path: 'feed',
    element: (
      <Suspense fallback={<div />}>
        <LazyFeed />
      </Suspense>
    ),
  },
  {
    path: 'explore/:type/:name',
    element: (
      <Suspense fallback={<div />}>
        <LazyExploreDetail />
      </Suspense>
    ),
  },
  {
    path: 'loginSignin',
    element: (
      <Suspense fallback={<div />}>
        <LazyLoginSignin />
      </Suspense>
    ),
  },
  {
    path: 'premium',
    element: (
      <Suspense fallback={<div />}>
        <LazyPremiumPromo />
      </Suspense>
    ),
  },
  {
    path: 'terms',
    element: (
      <Suspense fallback={<div />}>
        <LazyTerms />
      </Suspense>
    ),
  },
  {
    path: 'support',
    element: (
      <Suspense fallback={<div />}>
        <LazySupport />
      </Suspense>
    ),
  },

  {
    path: 'verify-email',
    element: (
      <VerifyGate element={
        <Suspense fallback={<div />}>
          <LazyVerifyEmail />
        </Suspense>
      } />
    ),
  },
  {
    path: 'track/:trackId',
    element: (
      <Suspense fallback={<div />}>
        <LazySharedTrack />
      </Suspense>
    ),
  },
  {
    path: 'artist/:artistId',
    element: (
      <Suspense fallback={<div />}>
        <LazyArtistPage />
      </Suspense>
    ),
  },
  {
    path: 'album/:albumId/:songId',
    element: (
      <Suspense fallback={<div />}>
        <LazySongPage />
      </Suspense>
    ),
  },
  {
    path: 'song/:songId',
    element: (
      <Suspense fallback={<div />}>
        <LazySingleSongPage />
      </Suspense>
    ),
  },
  {
    path: 'radio/:stationId',
    element: (
      <Suspense fallback={<div />}>
        <LazyRadioStationPage />
      </Suspense>
    ),
  },
  {
    path: 'radio/:stationId/:songId',
    element: (
      <Suspense fallback={<div />}>
        <LazyRadioStationPage />
      </Suspense>
    ),
  },
  {
    path: 'album/:albumId',
    element: (
      <Suspense fallback={<div />}>
        <LazyAlbumPage />
      </Suspense>
    ),
  },
  {
    path: 'artist/register',
    element: (
      <Suspense fallback={<div />}>
        <LazyArtistRegister />
      </Suspense>
    ),
  },
  {
    path: 'artist/verification',
    element: (
      <Suspense fallback={<div />}>
        <LazyArtistVerificationPage />
      </Suspense>
    ),
  },
  {
    path: 'artist/login',
    element: (
      <Suspense fallback={<div />}>
        <LazyArtistLogin />
      </Suspense>
    ),
  },
];
