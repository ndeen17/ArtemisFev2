import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@artemis/shared': path.resolve(__dirname, './src/_shared/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // WebSocket proxy for the voice-mode interview gateway (Phase 8C/8D).
      // Browser connects to ws://localhost:5173/ws/interviews/:id/realtime?token=...
      // and Vite forwards to ws://localhost:4000/interviews/:id/realtime?token=...
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ws/, ''),
      },
    },
  },
});
