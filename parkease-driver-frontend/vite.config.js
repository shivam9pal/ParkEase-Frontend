import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // ✅ Fix 1: Browser targets instead of ES version string
    target: ['chrome89', 'firefox89', 'safari15', 'edge89'],

    // ✅ Fix 2: Switch to esbuild (built-in, zero install needed)
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
          ],
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})