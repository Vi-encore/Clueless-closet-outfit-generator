# Proposal

## Why

Five steps left a short list of things known to be wrong or missing, written down in `docs/roadmap.md` and in the retrospective rather than fixed. This change takes the four of them that are cheaper now than later, and leaves the rest where they are.

They are cheaper now for different reasons. The email bug is simply a defect, and defects do not improve with age. Pagination changes the shape of a response, which costs an hour while no client exists and costs two coordinated changes once `apps/web` reads it. Clearing spent refresh tokens needs no scheduler if it happens where tokens are already being written. Rate limiting is the one that was argued against and chosen anyway — the author's call, with the proxy question made explicit rather than buried.

## What Changes

- An email is normalised before it is stored or looked up, so `Cher@Example.COM` and `cher@example.com` are one account and a trailing space from a phone keyboard is not a failed sign-in.
- `GET /items` and `GET /users/:username/items` answer with a page and a cursor instead of every row.
- Issuing a refresh token clears that user's expired ones, so the table stops growing without a scheduled job.
- The API refuses a caller who asks too often, with a tighter allowance on the routes that take a password.
- `TRUST_PROXY` is a setting, because a rate limit that reads the wrong address either does nothing or bans everybody at once.

Out of scope:
- **Detecting a reused refresh token.** The right response is revoking every token that user holds, and that is a decision to take on its own.
- **Confirming an email address.** Needs a mailer, and no free one has been chosen.
- **A scheduled sweep of abandoned accounts' tokens.** The clearing here follows people who sign in; the rest waits for deployment, as recorded in the roadmap.
- **Pagination on friends and requests.** Those lists are naturally small, and a cursor on them would be ceremony.

## Capabilities

### New Capabilities
- `rate-limiting`: how often one caller may ask.

### Modified Capabilities
- `user-accounts`: an address is one address whatever its case.
- `wardrobe-items`: a wardrobe is read a page at a time.
- `authentication`: spent tokens leave as new ones arrive.
- `service-config`: the settings the limits and the proxy need.

## Impact

- `apps/api/src/auth/requests/` — a shared email schema, as `usernameSchema` already is.
- `apps/api/src/items/` — the query schema, the service, and both list routes' response shape.
- `apps/api/src/auth/refresh-token.service.ts` — one delete beside the insert.
- New `apps/api/src/throttling/` and a dependency on `@nestjs/throttler` 6.7.1, which supports Nest 12.
- `main.ts` sets Express's `trust proxy` from configuration.
- **Breaking for anyone already reading the list routes:** the body becomes an object. Nothing reads them yet.
- No migration.
