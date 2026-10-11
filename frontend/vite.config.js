import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Dev server proxy — only used locally; production uses VITE_API_URL env var
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Split vendor chunks to reduce initial load time
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'charts': ['recharts'],
          'ui': ['lucide-react', 'react-hot-toast'],
          'utils': ['axios', 'zustand', 'date-fns'],
        },
      },
    },
    // Raise warning threshold slightly — our chunks are well-split now
    chunkSizeWarningLimit: 600,
  },
});
