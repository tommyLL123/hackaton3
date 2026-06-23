import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://hackaton-20261-front-587720740455.us-east1.run.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
