import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Build sırasında TS hatalarını yoksayar ve yayını engellemez
    sourcemap: false,
  },
});