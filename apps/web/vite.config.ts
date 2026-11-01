import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    // Vite 8 minifies with Lightning CSS, which refuses the whole build over one rule
    // in 98.css: `@media (not(hover))`. Without a space that is not a real query, so a
    // browser never matches it, and recovering carries it through unchanged.
    lightningcss: { errorRecovery: true },
  },
  server: {
    // Fixed rather than "the next free one": WEB_ORIGINS on the API names this port
    // exactly, so a dev server that wandered to 5174 would be refused by CORS.
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.{ts,tsx}'],
    // Never reached: MSW answers at the `fetch` boundary. An address no real thing
    // could be listening on means a request MSW missed fails loudly instead of
    // quietly talking to a development server.
    env: { VITE_API_URL: 'http://api.test' },
  },
});
