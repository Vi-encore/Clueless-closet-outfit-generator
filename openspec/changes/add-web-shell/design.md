# Design

## The shape of it

Three things that look separate but are one problem: a browser will not talk to the API until CORS says it may, the API has no way to end a session, and the client has to decide where it keeps the token it is given. Each of the three is small; the reason they are one change is that none of them can be tested without the others.

Everything else here — the window frame, the taskbar, the font with Cyrillic letters, the dictionary — exists so that `add-wardrobe-screens` and `add-social-screens` add screens rather than invent chrome.

## Decisions

### The access token lives in memory, and nowhere else

A module-level variable behind `platform/token-store.ts`, the wrapper [docs/architecture.md](../../../docs/architecture.md#mobile-app-pwa-now-app-stores-via-capacitor) already named. The refresh token stays where it is, in the `httpOnly` cookie.

The alternative is `localStorage`, and it is genuinely more convenient: a reload keeps the session with no work at all. The reason against it is narrow and specific — `localStorage` is readable by any script that runs on the page, which includes anything that gets in through a dependency, and this application will hold photographs of its users. A token in a variable is not reachable that way: a script would have to find the closure, not just read a key.

The cost is real and has to be paid in code: a reload loses the token, so the application cannot know on start whether somebody is signed in. It has to ask. That is the next decision.

Capacitor later changes only this module — in a native shell the refresh token moves from a cookie to the device's secure storage, and the rest of the client does not learn about it.

### Three session states, not two

`unknown` until the start-up refresh answers, then `signed-in` or `signed-out`.

With two states the application starts in the wrong one and flashes a sign-in screen at somebody who is signed in, for as long as the refresh takes. Worse, a route guard that redirects on `signed-out` throws away the URL the person asked for. The `unknown` state is what the third scenario of "A reload does not ask for the password again" is about, and it is why that requirement says "neither".

### Development talks to the API across origins, and there is no Vite proxy

[docs/roadmap.md](../../../docs/roadmap.md) listed the Vite proxy as something to learn, and this change deliberately does not use it. Two reasons, one of which is a trap worth understanding.

The trap: the refresh cookie is set with `Path=/auth/refresh`, which is what keeps the browser from attaching it to every other request. A proxy that maps `/api/*` onto the API's `/*` makes the browser store a cookie at `/auth/refresh` while every request goes to `/api/auth/refresh`. The paths do not match, the cookie is never attached, and the refresh fails with a 401 that looks exactly like an expired token. Nothing in the API is wrong, nothing in the client is wrong, and the mistake is in a config file neither of them reads.

The reason: a proxy's value is that it makes CORS unnecessary in development. We need CORS correct in production anyway, so dodging it locally hides the one thing most likely to be wrong when the client is first deployed.

`VITE_API_URL=http://localhost:3000` instead. Note what makes this safe for the cookie: `localhost:5173` and `localhost:3000` are different **origins** but the same **site** — `SameSite` ignores the port — so a `Lax` cookie is still sent. Which leads to the next decision, where that stops being true.

### The refresh cookie's `SameSite` is a setting

In production the client is on static hosting and the API is somewhere else ([docs/architecture.md](../../../docs/architecture.md#environments)). On `*.pages.dev` and `*.onrender.com` those are two different sites, and a `SameSite=Lax` cookie is **not** sent on a cross-site request. So the refresh works perfectly in development and on the first day in production stops working, with nothing in the logs to say why. The same shape of trap as the storage addressing style in step 7, and the same answer: the deployment says which, and the default is what works locally.

`COOKIE_SAMESITE=none` also forces `Secure`, because browsers reject `None` without it.

What it costs: `Lax` was a free CSRF defence, and `None` gives it up. What is actually exposed is narrow — the cookie only ever reaches `/auth/refresh` and `/auth/sign-out`, and a forged cross-site POST cannot read the response, because CORS stops the attacker's page reading it. What a forged POST _can_ do is spend the refresh token, since rotation retires it, and log the person out. That is a nuisance, not a breach, and for a proof of concept it is accepted rather than defended.

Worth writing down because it changes the answer later: one domain with the client on `app.` and the API on `api.` would be **same-site**, and `Lax` would work unchanged. Owning a domain removes this setting rather than configuring it.

### One refresh for many waiting requests

The client answers a 401 by refreshing once and sending the request again. With three requests in flight — which the first screen of a wardrobe will have — a naive version refreshes three times, and because refreshing retires the token it was given, two of those three refreshes fail and the session dies on a successful operation.

So the refresh is single-flight: the first 401 starts it, and anything else that gets a 401 while it is running waits on the same promise. A request that comes back with a 401 after the token has already changed is simply sent again. Two things must not be retried: the refresh call itself, which would recurse, and a 401 from sign-in, which is a wrong password and not an expired token.

Only a 401 from the refresh ends the session. A 429 or a server error says nothing about the cookie, and signing somebody out over one would throw away a session that is perfectly good.

Three limits, known and accepted:

- **Two tabs reloading in the same instant** both present the same cookie. One wins, the other gets a 401 and shows the sign-in form, although the session is fine: a reload brings it back. Single-flight lives in one tab's memory. The Web Locks API would extend it across tabs if this ever matters.
- **Every reload spends one of the refresh route's `AUTH_RATE_LIMIT_MAX` requests**, ten a minute by default. Past that the start-up refresh gets a 429 and the sign-in form appears until the window passes, with the session intact.
- **A hanging refresh leaves an empty desktop.** There is no timeout, and an API on a free tier that has gone to sleep can take most of a minute to answer. A wake-up indicator belongs with the deployment.

### Signing out is public and acts on the cookie

`POST /auth/sign-out` takes no access token. If it needed one, somebody whose access token had just expired could not sign out — the exact moment they are most likely to try. The credential it checks is the refresh token in the cookie, which is the thing being revoked.

It retires that one token, not all of the person's tokens: signing out of a phone should not sign out the laptop. "Sign out everywhere" is a different feature with a different button.

It answers 204 whether or not there was anything to end. A sign-out that can fail leaves the client in a state it cannot leave.

Two details that bite: clearing a cookie means sending it back with the same `path` and attributes, or the browser keeps the old one; and `RefreshTokenService` has `issue` and `rotate` but nothing that only revokes, so that is a small addition beside them.

### 98.css goes into the `components` layer

Already settled in [docs/ui.md](../../../docs/ui.md#combining-98css-and-tailwind) and repeated here because it fails silently. Tailwind v4 puts its own rules in cascade layers, and **unlayered styles beat layered ones regardless of specificity**. A plain `import "98.css"` therefore overrides Tailwind's utilities, and `className="px-4"` does nothing at all — no error, no warning, just a button with the wrong padding.

jsdom does not implement the cascade, so no test here can catch it. It is checked against the built stylesheet instead, which is a task rather than a scenario.

### Routing is declarative, and loaders wait

React Router 8, `<BrowserRouter>` with `<Routes>`, and `Shell` - the desktop and the taskbar - as a layout route so that every screen inherits them. The window itself is drawn by each screen: its title belongs to the screen, and a layout route has no way to read that without the data router's `handle`. Not `createBrowserRouter` with loaders yet: a loader fetching data would need the access token and the retry-after-refresh rule, which would make the router a second place that knows about the session. When 8b has lists and detail screens that genuinely load, the data router earns its place; today it would be a pattern without a payload.

Note for the imports: `react-router-dom` no longer exists in v8. Everything comes from `react-router`, and the DOM-specific entry points from `react-router/dom`.

### The dictionary is a module, not an internationalisation library

One file of Ukrainian strings, typed, imported where it is needed. No `i18next`, no provider, no interpolation machinery: there is one language, and the second one is not planned.

What that buys is the thing the requirement actually tests — that no component holds Ukrainian text of its own. A grep for Cyrillic characters over `src/` is a real test, and it is only possible because the rule has no exceptions.

### The tests run in jsdom, and there is one thing they cannot prove

Vitest with `environment: 'jsdom'`, Testing Library for driving the screen the way a person does, MSW for answering at the `fetch` boundary rather than mocking our own API client — so a test exercises the client including its retry rule, which a mocked client would skip.

The limit to know about: **MSW 3 no longer manages cookies in Node.** A test cannot show that the refresh cookie travels, only that the client asks with `credentials: 'include'` and behaves correctly on each answer. The cookie itself is proved on the API's side, by `authentication`'s own tests, which run against a real HTTP server. Two halves of one fact, in two places, on purpose.

## Where the code goes

Mirroring the convention in [openspec/config.yaml](../../config.yaml): a module's own vocabulary lives beside it, anything two things could want gets its own module.

```
apps/web/
  index.html
  vite.config.ts            Vite 8 + React + Tailwind plugins, and the Vitest config
  src/
    main.tsx                mounts, nothing else
    index.css               tailwind, 98.css layer(components), retro.css layer(components)
    retro.css               the Clueless theme, touch sizes, the fonts
    api/
      client.ts             fetch with the token, the 401 rule, the single-flight refresh
      auth.ts               the five things the session asks of the API
      api-error.ts          the API answered, and it was not a success
      api.interfaces.ts     what a request and an account look like
    session/
      session.context.tsx   the provider, and asking the API on start
      session.interfaces.ts the three states
      use-session.ts        the hook screens use
    platform/
      token-store.ts        the access token in memory; the seam Capacitor moves
    shell/
      shell.tsx             the desktop and the taskbar: the layout route
      window.tsx            .window / .title-bar / .window-body with a close that goes back
      field.tsx             a labelled input
      taskbar.tsx           the bottom bar, safe-area padded
      require-session.tsx   the two route guards; the second continues an interrupted journey
      use-form-submit.ts    pending and failure, for any form
    screens/
      sign-in.tsx
      sign-up.tsx
      desktop.tsx           what you see when signed in: nothing much yet
      not-found.tsx
    i18n/
      uk.ts                 every word a person reads
  test/
    setup.ts                Testing Library's matchers, MSW's lifecycle
    server.ts               MSW, answering nothing until a test says what the API says
    render-app.tsx          the whole application, opened at a path
```

## Signatures, as orientation

```ts
// platform/token-store.ts — deliberately not a React thing: the API client needs it too
export function getAccessToken(): string | null;
export function setAccessToken(token: string | null): void;

// api/client.ts
export function request<T>(path: string, options?: RequestOptions): Promise<T>;
export function publicRequest<T>(path: string, options?: RequestOptions): Promise<T>;
export function renewAccessToken(): Promise<void>;
export function onSessionLost(listener: () => void): () => void;

// session/session.context.tsx
export type SessionState =
  | { status: 'unknown' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; account: Account };
```

## What to read

- [React Router 8, upgrading from v7](https://reactrouter.com/upgrading/v7) — mainly for what the imports are now.
- [Tailwind v4 with Vite](https://tailwindcss.com/docs/installation/using-vite), and its note on cascade layers.
- [MSW 3, migrating from 2.x](https://mswjs.io/docs/migrations/2.x-to-3.x) — the cookie note above is from here.
- [Testing Library's guiding principles](https://testing-library.com/docs/guiding-principles) — why a test looks for a label rather than a class.
- [MDN on `SameSite`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite), for the site-versus-origin distinction the cookie decision rests on.
- Nest's `useSecurityHeaders` options, in `@nestjs/common`'s `SecurityHeadersOptions` — the defaults are helmet 8's and are written out in that interface's own comments.

## Pitfalls

- **Vite 8 is Rolldown**, not esbuild and Rollup. Most configs carry over through a compatibility layer, but a plugin written against esbuild does not, and `rollupOptions` is on its way to being `rolldownOptions`.
- **Lightning CSS refuses 98.css.** Vite 8's default minifier fails the build on `@media (not(hover))`, so `css.lightningcss.errorRecovery` is on. Without the space that is not a real query, and a browser never matches it.
- **98.css draws the close cross for `aria-label="Close"`**, and ours is in Ukrainian. The class `close` draws it for any label.
- **MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`**, and the old spelling is ignored at runtime rather than refused. Only the type check noticed.
- **`upgrade-insecure-requests` is in the default policy**, and it breaks Swagger UI served over plain http anywhere but localhost. Removing a default directive is `{ 'upgrade-insecure-requests': null }`.
- **`script-src 'self'` and `script-src-attr 'none'`** are defaults too. If the documentation page turns out to carry an inline script, it is blocked, and the only way to find out is to open `/docs` and read the console.
- **CORS with credentials cannot use `*`.** The origin has to be named, which is why the setting is a list rather than a flag.
- **A `Secure` cookie is dropped over plain http**, silently. That is why `COOKIE_SAMESITE` defaults to `lax` rather than to the production value.
- **16 px is the minimum font size for a field** on iPhone; below it Safari zooms the page on focus. 98.css uses 11 px, so `retro.css` has to override it under `@media (pointer: coarse)` ([docs/mobile.md](../../../docs/mobile.md)).
- **The pixel fonts are on an 8 px grid** and are crisp only at 16, 24 and 32 px. Sizes in between blur.
- **98.css has no CSS variables.** The theme works by redeclaring our own and overriding a handful of its rules; `retro.css` has to come after it in the same layer.
