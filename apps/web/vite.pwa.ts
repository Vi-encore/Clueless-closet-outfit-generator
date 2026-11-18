import type { VitePWAOptions } from 'vite-plugin-pwa';

/**
 * What makes the client installable: its manifest and its service worker, apart from
 * `vite.config.ts` so that a test can read them.
 *
 * The service worker keeps the built client and nothing else. Server data is TanStack
 * Query's to cache (ADR-0017) and the session is the API's, so `/api` and `/storage` are
 * never routed through Workbox at all, and a navigation there is never answered with the
 * app's page. It exists in builds only: in `vite dev` a cached shell would hide every edit.
 */
export function pwaOptions(): Partial<VitePWAOptions> {
  return {
    registerType: 'autoUpdate',
    injectRegister: 'script',
    includeAssets: ['favicon.png', 'icons/apple-touch-icon-180.png'],
    manifest: {
      name: 'Clueless Closet',
      short_name: 'Closet',
      description: 'Шафа, що складає образи.',
      lang: 'uk',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      // The title bar's purple for the system's bars; the plaid's yellow while it opens.
      theme_color: '#7b2d8e',
      background_color: '#f7d731',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/^\/api\//, /^\/storage\//],
      runtimeCaching: [],
      // The background-removal library is large and loads only when an item is added.
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    },
  };
}
