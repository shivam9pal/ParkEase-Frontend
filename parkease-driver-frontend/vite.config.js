import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['chrome89', 'firefox89', 'safari15', 'edge89'],

    // ✅ Fix: Remove minify entirely — Vite 8 defaults to 'oxc' automatically
    // No esbuild, no terser, oxc is built-in and fastest

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('react-dom') ||
            id.includes('react-router-dom')
          ) {
            return 'react-vendor'
          }
          if (
            id.includes('@radix-ui/react-dialog') ||
            id.includes('@radix-ui/react-dropdown-menu') ||
            id.includes('@radix-ui/react-select') ||
            id.includes('@radix-ui/react-toast')
          ) {
            return 'ui-vendor'
          }
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'map-vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})