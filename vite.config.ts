import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/backendService';

function backendApiPlugin(): Plugin {
  return {
    name: 'restaurant-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          console.error('Backend API Error:', err);
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), backendApiPlugin()],
  server: {
    port: 3001,
    host: true, // Listen on all network interfaces so physical mobile phones can access
    open: false,
  },
});
