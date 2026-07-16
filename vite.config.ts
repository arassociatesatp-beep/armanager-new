import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      // Pre-compress assets with gzip and brotli for faster delivery
      compression({ algorithms: ['gzip', 'brotliCompress'] }),
    ],
    // SECURITY: API keys are now stored securely in Firebase Cloud Functions
    // No secrets are exposed to the frontend
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React - changes rarely, cache forever
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Firebase SDK - large, separate chunk
            'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            // Chart library - only needed on pages with charts
            'vendor-charts': ['recharts'],
            // PDF generation - only needed when exporting
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            // Virtual scrolling
            'vendor-virtual': ['@tanstack/react-virtual'],
          }
        }
      },
      // Optimize sourcemaps for production
      sourcemap: false,
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000
    }
  };
});
