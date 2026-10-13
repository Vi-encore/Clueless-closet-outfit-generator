# Proposal

## Why

Step 4 of the roadmap (`docs/roadmap.md`). The database now holds users and items, but nothing can tell one person from another: `User` exists with a `passwordHash` column that nothing writes, and every route is open. A wardrobe is private by definition, so until the API knows who is asking, no feature that touches real data can be built — step 5 cannot start.

The shape of the solution is already decided in `docs/architecture.md#authentication`: email and password, argon2 hashing, a short-lived access token and a rotating refresh token whose hash alone is stored.

## What Changes

- `POST /auth/sign-up` creates an account; `POST /auth/sign-in` returns a token pair; `POST /auth/refresh` exchanges a refresh token for a new pair; `GET /auth/me` is the first protected route.
- Passwords are hashed with argon2 and never leave the server, not even in an error.
- The access token is a short-lived JWT carried in the `Authorization` header. The refresh token is a random string returned in an `httpOnly` cookie, and accepted on refresh either from that cookie or from the request body, so a future native client can keep it in the device's secure storage.
- Refresh tokens rotate: using one invalidates it and issues a replacement. Only their hashes are stored, in a new table.
- A `JwtAuthGuard` protects routes, and a `@CurrentUser()` decorator hands the handler the signed-in user instead of a raw token payload.
- **Verifying an access token is a service method of its own**, callable without an HTTP request. The WebSocket gateway at step 6 authenticates a handshake, where Passport cannot help.
- Settings gain the token secret and the two lifetimes.

Out of scope (later steps):
- Sign-out and session management → when the UI needs them; nothing yet can show a user their sessions.
- Detecting a reused refresh token and revoking a whole family → worth doing once sessions are visible; rotation alone already stops a stolen token being used twice.
- Password reset, email confirmation, OAuth, two-factor → after the PoC.
- Owner checks on items → step 5 (`add-wardrobe-items`); this change adds no item routes.
- CORS and cookie behaviour across origins → step 8, with the Vite proxy.
- Rate limiting on sign-in → after the PoC, together with the deployment that makes it matter.

## Capabilities

### New Capabilities
- `user-accounts`: creating an account and holding a password safely.
- `authentication`: proving who you are, and staying signed in without sending a password again.

### Modified Capabilities
- `data-persistence`: adds the stored refresh token.
- `service-config`: adds the token secret and lifetimes.

## Impact

- New: `apps/api/src/auth/`, a `RefreshToken` table and a migration, and the dependencies `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@node-rs/argon2` and `cookie-parser`.
- `main.ts` registers the cookie parser.
- The e2e suites gain a signed-in application, so later steps have one to build on.
- Requires step 3 (`add-database`), done and archived.
