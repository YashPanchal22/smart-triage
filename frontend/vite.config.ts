import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    hmr: process.env.CLIENT_PORT ? { clientPort: Number(process.env.CLIENT_PORT) } : undefined,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
  preview: { host: '0.0.0.0', port: 5173 },
});
