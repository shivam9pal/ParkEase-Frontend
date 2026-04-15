// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
  target: 'esnext',
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui';
          }
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'map';
          }
        }
      },
    },
  },
  chunkSizeWarningLimit: 1000,
},
  server: {
    port: 5173,
    strictPort: false,
  },
});