# Design

## Context

- **The page.** `apps/web` is a Vite 8 SPA. `index.html` already has `viewport-fit=cover`, and the taskbar pads for `env(safe-area-inset-bottom)`.
- **Phone mode.** It exists for the dev server (`vite.server.ts`, `serverFor(mode)`): it proxies `/api` and `/storage`, rewrites the cookie path and allows `.trycloudflare.com`. HMR is off.
- **Server data** lives in TanStack Query (ADR-0017), and the session's access token in memory, renewed through an HttpOnly cookie (ADR-0011).
- **No icons yet:** the client has no `public/` folder.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Installable on Android Chrome and through Safari's "Add to Home Screen", with the app's own icon and no browser bars.
- A service worker that can never serve stale API answers or a stale session.
- Install UI that appears only where it can work.

**Non-Goals:**
- Offline data, push and background sync.
- A service worker in `vite dev`.

## Decisions

### 1. `vite-plugin-pwa`, `generateSW`, in builds only

- **The plugin.** `vite-plugin-pwa@2.0.0` supports Vite 8. It generates the manifest and a Workbox service worker from one set of options. Those options live in `apps/web/vite.pwa.ts`, as `pwaOptions()`, so that a test reads them as it reads `serverFor`.
- **Registration.** `registerType: 'autoUpdate'` and `injectRegister: 'script'`. A new build activates on the next load, with no "update available" prompt to design for a PoC.
- **What is precached.** `globPatterns: ['**/*.{js,css,html,svg,png,woff2}']`.
- **Navigations.** `navigateFallback: 'index.html'` with `navigateFallbackDenylist: [/^\/api\//, /^\/storage\//]`, so that a navigation to an API path is never answered with the app's page.
- **`runtimeCaching` is empty.** Requests to `/api` and `/storage` are not routed by Workbox at all, and go to the network as if there were no service worker.
- **No `devOptions`.** In `vite dev` a service worker would cache the shell and hide edits.

*Alternative:* write the service worker by hand. That is fine for a fetch passthrough, but precaching hashed assets and cleaning up old versions is what Workbox exists for.

*Pitfall:* the background-removal model is fetched from `staticimgly.com` and its WebAssembly from the package. Neither is under the precache globs, so they keep coming from the network and the browser's HTTP cache, as today.

### 2. Icons drawn from the desktop's shirt

A small script, `apps/web/scripts/draw-icons.py`, committed so that the icons can be redrawn, rasterises `pixelarticons/svg/shirt.svg` on the theme's yellow plaid:

- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (with the safe zone padded) and `apple-touch-icon-180.png` go in `public/icons/`;
- `favicon.png` goes in `public/`.

The shirt is drawn from the SVG's rectangles: pixelarticons are rectangles only, so no SVG renderer is needed. The PNGs are committed, and the build does not run Python.

### 3. The install feature

`features/install/` holds:

- **`use-install-offer.ts`.** It listens for `beforeinstallprompt`, calls `preventDefault()`, and keeps the event. It answers one of four states:
  - `{ kind: 'installed' }` when `matchMedia('(display-mode: standalone)')` matches or `navigator.standalone` is true;
  - `{ kind: 'prompt', install }` when an event is kept, where `install()` calls `prompt()`, awaits `userChoice` and drops the event;
  - `{ kind: 'ios-hint', dismiss }` on an iPhone, iPad or iPod in Safari, not installed and not dismissed before;
  - `{ kind: 'none' }` otherwise.

  It also listens for `appinstalled`, which ends the offer.
- **`install.utils.ts`.** `isIos(userAgent, maxTouchPoints)` covers iPads that call themselves Macs. `isStandalone()` and the dismissal in `localStorage` (`closet:install-hint-dismissed`) are each wrapped against unavailable storage.
- **`install-offer.tsx`.** It renders the button or the hint, or nothing. `Desktop` places it under the welcome line.
- **Types.** The browser's event has no TypeScript type. `BeforeInstallPromptEvent` is named in `install.interfaces.ts`, with `prompt(): Promise<void>` and `userChoice`.

*Why the desktop window:* it is where a session lands, and it says "here is what you can do". The Start menu would hide the offer, and a banner on every screen would nag.

**Found while building:** a listener in the hook catches the event only while the desktop is mounted. Chrome fires `beforeinstallprompt` when it decides to, which may be while the person is on another screen, and a full test run showed the race. So `install.utils.ts` listens from the moment the app loads, keeps the event, and lets the hook read it through `useSyncExternalStore` (`onInstallEvent`, `keptInstallEvent`, `promptToInstall`).

### 4. The notch

`retro.css` gives the shell's top `padding-top: env(safe-area-inset-top)`, as the taskbar has `env(safe-area-inset-bottom)`. `index.html` gains:

- `<meta name="theme-color">`;
- `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style: black-translucent`, so that the plaid runs under the status bar and the padding keeps content out of it;
- `<link rel="apple-touch-icon">`.

### 5. Serving a build to the phone

- **`previewFor(mode)`** in `vite.server.ts` returns the same proxy and allowed hosts as `serverFor` for the phone mode (port 4173, strict), and nothing extra otherwise. `vite.config.ts` sets `preview: previewFor(mode)`.
- **`pnpm preview:phone`** runs `vite build --mode phone && vite preview --mode phone`, and the launch entry is `web-phone-preview`.
- **The tunnel** then points at 4173: `cloudflared tunnel --url http://localhost:4173`.

*Pitfall:* an installed iOS app keeps its own cookies, apart from Safari's, so the first launch asks to sign in once. After that the refresh cookie lives in the app's own store, and the session survives closing and reopening. The phone scenario checks exactly that.

## Risks / Trade-offs

- **[Risk]** A precached shell outlives a deploy and shows an old client. → `autoUpdate` activates the new worker on the next load. The tunnel runs builds rarely, and a hard reload clears it.
- **[Risk]** A service worker registered on a tunnel address keeps running on that origin. → Quick Tunnel addresses are random and short-lived, so each is a new origin with its own worker.
- **[Trade-off]** `vite dev` never shows install behaviour. The unit tests cover the logic, and `preview:phone` covers the real thing.
- **[Trade-off]** A new dependency tree (Workbox) in the client's build. Nothing of it reaches the bundle except the small registration script.

## Migration Plan

Nothing to migrate. Removing the plugin and adding a service worker that unregisters itself would undo it. That is unlikely to be needed for a PoC.
