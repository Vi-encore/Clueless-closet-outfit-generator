# Tasks

## 1. One address whatever its case

- [x] 1.1 Claude writes the tests "Case does not make a second account", "Signing in ignores case", "Surrounding spaces are trimmed" and "Something that is not an address is still refused"
- [x] 1.2 Add `emailSchema` as `z.string().trim().toLowerCase().pipe(z.email())` beside the sign-up request, and use it in both sign-up and sign-in — one of the two alone would make sign-up succeed and sign-in fail
- [x] 1.3 Verify the 1.1 tests pass and the existing account tests stay green

## 2. A page at a time

- [x] 2.1 Claude writes the tests "A page and a cursor come back", "The next page follows on", "The last page says so", "Everything fits by default", "A limit outside what is allowed is refused", "A friend's wardrobe pages the same way" and "A stranger is still told nothing"
- [x] 2.2 Add `cursor` and `limit` to the list query schema, and a page type carrying `items` and `nextCursor`
- [x] 2.3 Order by `createdAt` then `id`, take one row more than asked, and turn the extra into the cursor rather than counting
- [x] 2.4 Change both list routes and every existing test that reads their body as an array; verify the 2.1 tests pass

## 3. Spent tokens go

- [x] 3.1 Claude writes the tests "Expired tokens are cleared", "A spent token is kept while it is still young" and "Another person's tokens are untouched"
- [x] 3.2 Delete that user's expired tokens inside `issue()`, by `expiresAt` alone; verify the 3.1 tests pass

## 4. Asking too often

- [ ] 4.1 Claude writes the tests "Limits default", "Nothing is trusted by default", "A limit that is not a number stops the application", "Too many requests are refused", "Signing in runs out sooner" and "Refusing costs nothing to verify"
- [ ] 4.2 Install `@nestjs/throttler` 6.7.1 and add `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` and `TRUST_PROXY` to the environment schema and to `.env.example`
- [ ] 4.3 Register the throttler guard before the authentication guard, so a flood is refused before an argon2 verification is spent on it, and put the tighter allowance on sign-up, sign-in and refresh
- [ ] 4.4 Set Express's `trust proxy` from `TRUST_PROXY` in `main.ts`, and raise the limits in the test setup so the existing suites keep running; verify the 4.1 tests pass and the whole suite stays green
