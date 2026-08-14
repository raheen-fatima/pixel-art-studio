import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
 base: '/pixel-art-studio/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
