import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import referenceRates from './api/reference-rates.ts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'local-reference-rates',
    configureServer(server) {
      server.middlewares.use('/api/reference-rates', (req, res) => {
        const response = {
          status(code: number) { res.statusCode = code; return response; },
          setHeader(name: string, value: string) { res.setHeader(name, value); },
          json(body: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
        };
        void referenceRates(req, response);
      });
    },
  }],
  build: {
    sourcemap: false,
  },
});
