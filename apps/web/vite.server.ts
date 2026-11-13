import type { ServerOptions } from 'vite';

/** Strips a prefix the proxy added, so the server behind it sees its own paths. */
const without = (prefix: string) => (path: string) => path.slice(prefix.length) || '/';

/**
 * The development server's settings for a mode, apart from `vite.config.ts` so that a
 * test can read them.
 *
 * Ordinary development serves the client alone, and the client talks to the API across
 * origins, so that CORS and the cookie's settings are exercised every day (ADR-0012).
 *
 * The phone mode is for a Cloudflare Quick Tunnel, which gives one public address for one
 * port: this one. Everything else comes through it.
 *
 * - `/api` goes to the API with the prefix removed, WebSockets included, which is how the
 *   chat's connection arrives. The refresh cookie is set for `/auth/refresh`, a path the
 *   browser never asks for here; rewritten to `/api/auth/refresh`, it comes back.
 * - `/storage` goes to the photo store. `changeOrigin` presents the store's own host,
 *   which is the host its presigned links were signed for (`S3_PUBLIC_URL` on the API).
 * - The tunnel's hosts are let in, which Vite refuses by default.
 * - HMR is told the page is on 443, which it is through the tunnel. On `localhost` in this
 *   mode it does not connect, and a reload does instead.
 */
export function serverFor(mode: string): ServerOptions {
  // Fixed rather than "the next free one": WEB_ORIGINS on the API names this port
  // exactly, so a dev server that wandered to 5174 would be refused by CORS.
  const always: ServerOptions = { port: 5173, strictPort: true };

  if (mode !== 'phone') {
    return always;
  }

  return {
    ...always,
    allowedHosts: ['.trycloudflare.com'],
    hmr: { clientPort: 443 },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        rewrite: without('/api'),
        cookiePathRewrite: { '/auth/refresh': '/api/auth/refresh' },
      },
      '/storage': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: without('/storage'),
      },
    },
  };
}
