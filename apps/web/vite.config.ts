import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { serverFor } from './vite.server';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  css: {
    // Vite 8 minifies with Lightning CSS, which refuses the whole build over one rule
    // in 98.css: `@media (not(hover))`. Without a space that is not a real query, so a
    // browser never matches it, and recovering carries it through unchanged.
    lightningcss: { errorRecovery: true },
  },
  server: serverFor(mode),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
    // Never reached: MSW answers at the `fetch` boundary. An address no real thing
    // could be listening on means a request MSW missed fails loudly instead of
    // quietly talking to a development server.
    env: { VITE_API_URL: 'http://api.test' },
  },
}));
