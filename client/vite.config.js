import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  server: {
    port: 3000, // Change if port 3000 is in use
    open: true, // Automatically opens in the browser
    proxy: {
      '/graphql': {
        target: 'http://localhost:3001', // Backend API URL
        changeOrigin: true,
            ws: true,
        secure: false, // Skip SSL verification for local development
      },
    },
    watch: {
      usePolling: true, // Required for environments with file system issues (optional)
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('components/MusicPlayer/ModernMusicPlayer')) {
            return 'media-player-compact';
          }
          if (id.includes('components/MusicPlayer/FullScreenMediaPlayer')) {
            return 'media-player-fullscreen';
          }
          if (id.includes('components/MusicPlayer/ModernAdPlayer')) {
            return 'media-player-ad';
          }
          if (id.includes('components/MusicPlayer/MediaSessionManager')) {
            return 'media-session-manager';
          }
          if (id.includes('utils/Contexts/adapters/adPlayerAdapter')) {
            return 'player-adapters-ad';
          }
          if (id.includes('utils/Contexts/adapters/musicAdapter')) {
            return 'player-adapters-music';
          }
          if (id.includes('utils/Contexts/adapters/eventBus')) {
            return 'player-adapters-eventbus';
          }
          if (id.includes('utils/Contexts/playerAdapters.js')) {
            return 'player-adapters-utils';
          }
          if (id.includes('utils/Contexts/AudioPlayerContext.jsx')) {
            return 'audio-player-context';
          }
          if (id.includes('utils/Contexts/useNowPlayingArtwork')) {
            return 'now-playing-artwork';
          }
          if (id.includes('utils/Contexts/followers/useArtistFollowers')) {
            return 'artist-followers';
          }
          if (id.includes('@mui/x-date-pickers')) {
            return 'mui-date-pickers';
          }
          if (id.includes('DashbordComponents/Charts')) {
            return 'charts';
          }
          if (id.includes('components/ArtistMessagingPanel')) {
            return 'artist-messaging';
          }
          if (id.includes('components/Stripe') || id.includes('stripe')) {
            return 'stripe';
          }
          if (id.includes('@tensorflow')) {
            return 'tensorflow';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});



// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3000, // Change if port 3000 is in use
//     open: true, // Automatically opens in the browser
//     proxy: {
//       '/graphql': {
//         target: 'http://localhost:3001', // Backend API URL
//         changeOrigin: true,
//             ws: true,
//         secure: false, // Skip SSL verification for local development
//       },
//     },
//     watch: {
//       usePolling: true, // Required for environments with file system issues (optional)
//     },
//   },
// });
