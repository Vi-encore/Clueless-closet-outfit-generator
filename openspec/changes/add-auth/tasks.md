# Tasks

## 1. Dependencies and the token settings (`service-config`)

- [ ] 1.1 Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@node-rs/argon2` and `cookie-parser` with their typings, and confirm in a scratch file that `passport-jwt` imports cleanly in this ESM project before anything is built on it
- [ ] 1.2 Claude writes the tests "Lifetimes default", "Secret missing" and "Secret too short"
- [ ] 1.3 Add `JWT_SECRET`, `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL` to `envSchema` and to `.env.example`, and generate a secret for the local `.env`; verify the 1.2 tests pass and the existing configuration tests stay green

## 2. The refresh token table (`data-persistence`)

- [ ] 2.1 Claude writes the database tests "Only a hash is stored" and "Removed with its user"
- [ ] 2.2 Add the `RefreshToken` model - hash, owner, expiry, used marker, `timestamptz` throughout, cascading with the user - then migrate and generate; verify the 2.1 tests pass and the migration SQL shows the cascade and the unique index on the hash

## 3. Sign-up (`user-accounts`)

- [ ] 3.1 Claude writes the tests "Account created", "Email already registered", "Username already taken", "Password too short", "Only a hash is stored" and "Nothing leaks through the response"
- [ ] 3.2 Add `AuthModule` with the sign-up route, the zod request schema and argon2 hashing, mapping a unique-constraint failure to 409; verify the 3.1 tests pass and the stored hash begins with `$argon2`

## 4. Sign-in and the protected route (`authentication`)

- [ ] 4.1 Claude writes the tests "Correct credentials", "Wrong password", "Unknown email tells nothing extra", "Token missing", "Token tampered with", "Token expired" and "Signed-in user reaches the handler"
- [ ] 4.2 Add sign-in issuing the token pair, the refresh cookie, and `cookie-parser` in both `main.ts` and the test application factory; verify the sign-in tests pass
- [ ] 4.3 Add the Passport strategy, `JwtAuthGuard`, the `@CurrentUser()` decorator and `GET /auth/me`; verify the remaining 4.1 tests pass and that an unprotected route such as `/health` still answers without a token

## 5. Refresh and verification outside HTTP (`authentication`)

- [ ] 5.1 Claude writes the tests "Pair exchanged", "The used token stops working", "Refresh token from the request body", "Unknown refresh token", "Valid token resolves to its user" and "Invalid token is refused"
- [ ] 5.2 Add `POST /auth/refresh` reading the token from the cookie or the body, rotating it on use, and `AuthService.verifyAccessToken` as a method the strategy merely calls; verify the 5.1 tests pass

## 6. Integration check

- [ ] 6.1 With the container running, run `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and the database suite; verify all are green, every scenario of this change has a test with its name, and Swagger at `/docs` shows the four new routes

## Workflow follow-up

- Say "перевір" after each group; tasks get ticked once they pass review.
- When every condition in `docs/roadmap.md` holds, Claude archives the change, commits and pushes to `dev`.
