import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// VITE_BASE dipakai untuk GitHub Pages (mis. /Dompetku/). Saat development, /api diteruskan ke backend.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
