# Tasks

## 1. The API lets a browser in

- [x] 1.1 Claude writes the tests "Origins are read as a list", "Nothing is allowed by default", "A nonsense origin stops the application", "A known origin is allowed", "An unknown origin is not allowed", "A preflight is answered", "A request with no origin is unaffected", "The headers are there" and "The documentation still works over plain http"
- [x] 1.2 Add `WEB_ORIGINS` and `COOKIE_SAMESITE` to the environment schema and to `.env.example`, with the origin list parsed and validated rather than passed through as a string
- [x] 1.3 Turn on CORS from those settings with credentials allowed, and `app.useSecurityHeaders()`, deciding in one place what the documentation's policy has to relax and writing down why
- [x] 1.4 Verify the 1.1 tests pass, then open `/docs` in a real browser and read the console — the policy is the one thing in this group a test cannot judge

## 2. A session can be ended

- [x] 2.1 Claude writes the tests "The cookie is cleared", "The refresh token stops working", "Signing out twice is not an error", "Another session survives", "The configured attribute is used" and "The strict default is kept"
- [x] 2.2 Add revoking a single token to `RefreshTokenService`, beside `issue` and `rotate`
- [x] 2.3 Add `POST /auth/sign-out`: public, answering 204 either way, clearing the cookie with the same path and attributes it was set with
- [x] 2.4 Read the cookie's `SameSite` from configuration, forcing `Secure` when it is `none`; verify the 2.1 tests pass

## 3. There is an application

- [x] 3.1 Claude writes the tests "The frame names the screen", "Closing goes back", "The taskbar is always there", "An unknown path says so", "A label reads its text from the dictionary" and "No component holds its own"
- [x] 3.2 Create `apps/web` — Vite 8, React 19, TypeScript, `VITE_API_URL` — and wire it into the workspace scripts, the formatter and the linter
- [x] 3.3 Add Tailwind v4 with 98.css and `retro.css` in the `components` layer, the two Fontsource fonts, and the theme's variables; set the viewport for a notch
- [x] 3.4 Set up Vitest with jsdom, Testing Library and MSW, including the server lifecycle and a default set of handlers
- [x] 3.5 Add `Window`, `Taskbar`, the routes, the not-found screen and `i18n/uk.ts`; verify the 3.1 tests pass
- [x] 3.6 Build the stylesheet and check that a Tailwind utility beats 98.css in it, then look at the result at phone width — neither is something jsdom can answer

## 4. Signing in, and staying signed in

- [ ] 4.1 Claude writes the tests "The right password gets in", "The wrong password says so", "The token is not written down", "Signing out tells the API and forgets the token", "The session comes back", "A refusal asks for the password", "Nothing is decided while it is being asked", "The request succeeds after a renewal", "A refused renewal ends the session", "Several waiting requests cause one renewal", "A screen that needs a session asks for one" and "Signing in continues where it was interrupted"
- [ ] 4.2 Add `platform/token-store.ts` and the API client: the token on every request, `credentials: 'include'`, and the single-flight refresh with its two exceptions
- [ ] 4.3 Add the session context with its three states, the start-up refresh, and the guard that remembers where it was going
- [ ] 4.4 Add the sign-in, sign-up and desktop screens, and the sign-out control; verify the 4.1 tests pass

## 5. Together

- [ ] 5.1 Run both suites, the type check, the linter and the formatter across the workspace
- [ ] 5.2 Sign in from a browser against the running API, reload the page, let the access token expire, and sign out — the whole point of the change, and none of it is proved by a test in jsdom
- [ ] 5.3 Write ADR-0011 for the access token living in memory, with what it costs, and record the cross-site cookie decision where the next deployment will meet it
