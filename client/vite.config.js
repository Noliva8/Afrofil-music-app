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
          if (id.includes('DashbordComponents/Charts')) {
            return 'charts';
          }
          if (id.includes('components/MusicPlayer')) {
            return 'media-player';
          }
          if (id.includes('@tensorflow')) {
            return 'tensorflow';
          }
          if (id.includes('@mui/x-date-pickers')) {
            return 'mui-date-pickers';
          }
        // keep MUI inside vendor chunk to avoid duplicate React instances
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