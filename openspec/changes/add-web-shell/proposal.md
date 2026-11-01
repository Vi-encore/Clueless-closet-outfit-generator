# Proposal

## Why

Everything built so far is reachable only through Swagger. Step 8 in [docs/roadmap.md](../../../docs/roadmap.md) is the client, and it is three changes rather than one: `add-web-shell`, then `add-wardrobe-screens`, then `add-social-screens`. The cut follows what depends on what. A wardrobe screen with nowhere to sign in is nothing, and a chat screen without a wardrobe is less, so the first change is the part the other two stand on: the application exists, looks like Windows 98, and can be signed into and out of.

It is also the first time a browser talks to the API rather than a test or Swagger, which brings two things forward from the API's side: CORS for the client's origin and the security headers. Both are in the step's description for the same reason — [docs/architecture.md](../../../docs/architecture.md#security-and-privacy) puts them at step 8 because that is when a browser starts rendering our responses, and neither can be proved before something sends an `Origin`.

## What Changes

- `apps/web`: React 19 and Vite 8, React Router for the screens, Tailwind v4 with 98.css in the `components` layer, and a pixel font that has Cyrillic letters.
- Sign-in and sign-up screens, sign-out, and a session that survives a reload without asking for the password again.
- An API client that holds the access token **in memory only** and renews it once, invisibly, when a request comes back 401.
- `Window` and `Taskbar` components and the "Clueless" theme, so the screens of the next two changes are drawn into a frame that already exists.
- `POST /auth/sign-out` on the API, which until now had no way to end a session: the client could forget its access token, but the refresh cookie stayed valid for thirty days.
- CORS for the client's origin and `app.useSecurityHeaders()`, with the origins as a setting.
- The refresh cookie's `SameSite` becomes a setting, because a client served from another origin is a cross-site request and a `Lax` cookie is not sent on one.
- Client tests: Vitest with Testing Library and MSW, so a scenario is driven the way a person drives it and the network is answered at the `fetch` boundary.

Out of scope:
- **Wardrobe and social screens.** `add-wardrobe-screens` and `add-social-screens`.
- **Bucket CORS**, carried over from step 7. It belongs to `add-wardrobe-screens`, where a browser first uploads something and the rules can be proved rather than guessed at.
- **The PWA** — manifest, icons, service worker. Step 11, and `vite-plugin-pwa` is one plugin and a manifest when it comes.
- **Several windows, dragging, minimising to the taskbar.** [docs/ui.md](../../../docs/ui.md#computer) puts one centred window in the proof of concept; the taskbar is here as chrome, not as a window manager.
- **The desktop with shortcuts.** Nothing to put on it until there are screens to open.
- **A dark theme.** Windows 98 had none; [docs/ui.md](../../../docs/ui.md#the-clueless-theme) leaves it for later behind the same variables.
- **Password reset and email confirmation.** Both need an email service, which costs money or a card.

## Capabilities

### New Capabilities
- `web-shell`: the frame every screen is drawn into, and how a URL picks one.
- `web-session`: signing in, staying signed in, and signing out, as the client sees it.
- `browser-access`: what the API has to do before a browser will hand it a request at all.

### Modified Capabilities
- `authentication`: a route that ends a session, and a refresh cookie that can reach another origin.
- `service-config`: the settings the two above need.

## Impact

- New `apps/web/` — the whole application, and the first package in the workspace that is tested in a DOM.
- `apps/api/src/main.ts` — CORS and the security headers.
- `apps/api/src/auth/` — one new route, and the cookie's `SameSite` read from configuration.
- `apps/api/src/config/env.ts` and `.env.example` — `WEB_ORIGINS` and `COOKIE_SAMESITE`.
- New dependencies, all in `apps/web`: React 19.3.1, Vite 8.3.5, React Router 8.5.1, Tailwind 4.3.3, 98.css 0.1.21, Fontsource, and for the tests Vitest 5, Testing Library, MSW 3 and jsdom.
- No migration.
- Requires step 4 (`add-auth`), done and archived.
