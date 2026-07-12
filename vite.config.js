import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

export default defineConfig({
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    react(),
  ],
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
  },
});
