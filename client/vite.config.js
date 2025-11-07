import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
