import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '', '.env.local');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        onwarn(warning, warn) {
          // Suppress all warnings for now to get build working
          return;
        }
      },
      // Disable CSS code splitting and inline all CSS
      cssCodeSplit: false,
      // Minify CSS
      minify: 'esbuild',
      // Target modern browsers
      target: 'es2020',
    },
    css: {
      devSourcemap: false,
    },
    optimizeDeps: {
      exclude: [],
    },
    esbuild: {
      logLevel: 'error',
    },
  };
});
