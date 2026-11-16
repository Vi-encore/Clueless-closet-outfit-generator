# Proposal

## Why

The application now opens on a phone, through the tunnel (`reach-from-a-phone`), but only as a browser tab, with the browser's bars around it and no place on the home screen. [Roadmap step 11](../../../docs/roadmap.md#step-11--pwa-and-phone-test) asks for it to install:

- on Android, through its own "Install" button;
- on an iPhone, which offers no such prompt, through a hint with instructions.

The step 9 checklist also asks that an installed app opens without Safari's bars, keeps its session, and stays clear of the notch ([mobile.md](../../../docs/mobile.md#iphone-testing-checklist)).

This is the second of step 11's three changes, after `reach-from-a-phone` and before `add-invite-link`.

## What Changes

- **A web app manifest** names the app "Clueless Closet" (short "Closet"). It opens standalone at `/`, in the theme's colours, with icons at 192 and 512 pixels, a maskable one, and an Apple touch icon. The icons are drawn for this app: the pixel shirt from the desktop on the yellow plaid.
- **A service worker,** through `vite-plugin-pwa` (Workbox). It precaches the built client, the shell, so that the app opens even when the network is slow. It never caches `/api` or `/storage`: server data is TanStack Query's, and the session must not be served from a cache. It updates by itself on the next load. It exists in builds only, not in `vite dev`, where a cached shell would hide every edit.
- **An offer to install, on the desktop window:**
  - **Android and desktop Chrome** fire `beforeinstallprompt`. The app keeps the event and shows "Встановити застосунок", and the button opens the browser's own prompt.
  - **An iPhone or iPad in Safari** never fires it. The app shows a short hint ("Поділитися → На початковий екран"), which can be dismissed, and the dismissal is remembered.
  - **An app already installed,** running standalone, shows neither.
- **The notch and the home indicator.** The installed app's top edge respects `env(safe-area-inset-top)`, as the taskbar already respects the bottom.
- **Phone mode can serve a build.** The service worker needs a build, so `pnpm preview:phone` builds in phone mode and serves the result with the same proxy and allowed hosts as `dev:phone`. The tunnel points at it.

Out of scope:

- **Push notifications and background sync.**
- **Working offline beyond opening the shell:** screens still need the API.
- **App stores (Capacitor).** That is later in the roadmap.
- **The invitation link** (`add-invite-link`).

## Capabilities

### New Capabilities
- `web-install`: installing the client as an app (the manifest, the icons, the service worker and what it never caches), the offer to install on Android and the hint on an iPhone, and the installed app's layout around the notch.

### Modified Capabilities
- `phone-access`: adds serving a build in phone mode, so that the installable app is what the phone sees.

## Impact

- **`apps/web`:**
  - new dependencies: `vite-plugin-pwa` 2.0.0, plus `workbox-window`, which it needs;
  - `vite.config.ts` adds the plugin, with its options in a new `vite.pwa.ts` that a test can read;
  - `vite.server.ts` gains `previewFor(mode)`;
  - icons in `public/icons/`;
  - `index.html` gains the theme colour and the Apple tags;
  - a new `features/install/` feature (the hook, the offer and the hint), shown in the desktop window;
  - new words in `uk.ts`;
  - safe-area padding in `retro.css`;
  - `preview:phone` scripts and a `web-phone-preview` launch entry.
- **No API change.**
- **Docs:**
  - `docs/poc.md`: installing through the tunnel;
  - `docs/mobile.md`: the checklist;
  - `docs/roadmap.md`;
  - `openspec/config.yaml`.
