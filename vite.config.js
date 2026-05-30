import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PORT = process.env.PORT || 3000;

// The frontend lives in web/. In dev, Vite serves it and proxies /api to Express.
// In prod, `vite build` emits to web/dist, which Express serves statically.
export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': `http://localhost:${PORT}`,
    },
  },
});
