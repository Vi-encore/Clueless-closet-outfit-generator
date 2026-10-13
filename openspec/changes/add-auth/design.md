# Design

## Context

Step 4 of the roadmap. Motivation and scope: see proposal.md; requirements: see the delta specs. The shape was decided earlier in `docs/architecture.md#authentication`.

Current state and facts that shape the approach, checked October 2026:

- `apps/api` is a NestJS 12 ESM app with zod validation, Swagger generated from the same schemas, and Prisma 7 over PostgreSQL. `User.passwordHash` exists and nothing writes it.
- Versions that fit Nest 12: `@nestjs/jwt` 12.0.3, `@nestjs/passport` 12.0.0 with `passport` 0.7.0, `passport-jwt` 4.0.1.
- **The two argon2 packages install very differently.** `argon2` 0.45.1 has an `install` script running `node-gyp-build`, so pnpm blocks it and a machine without prebuilds needs a C++ toolchain. `@node-rs/argon2` 2.2.2 has no install script at all: it ships a prebuilt binary per platform as optional dependencies, `@node-rs/argon2-win32-x64-msvc` among them.
- `passport-jwt` is CommonJS. An ESM project imports it through Node's interop, which usually works but is worth confirming early rather than at the end.

## Goals / Non-Goals

**Goals:**

- A person can create an account, sign in, and reach a route that knows who they are.
- A stolen database gives up no passwords, and a stolen refresh token works at most once.
- The Nest building blocks this step is for: a Passport strategy, a guard, a parameter decorator.
- Token verification usable from outside HTTP, so the chat gateway at step 6 is not blocked by this design.

**Non-Goals:**

- Sessions a user can list or revoke, password reset, email confirmation, OAuth.
- Owner checks on items: step 5 will reuse the user this change provides.
- Rate limiting and brute-force protection, which belong with the deployment that makes them matter.

## Decisions

### 1. `@node-rs/argon2`, not `argon2`

Same algorithm, same parameters, no compiler. `argon2` would need its install script approved in `pnpm-workspace.yaml` and a build toolchain wherever a prebuild is missing; `@node-rs/argon2` resolves a prebuilt binary as an ordinary optional dependency.

- _Alternative - `argon2`:_ what most tutorials use, so copied snippets will name it. The cost is a native build on every machine that clones the project.
- _Alternative - bcrypt:_ older, weaker against GPUs, and `docs/architecture.md` already chose argon2.

Defaults from the library are the right starting point; this is not the place to invent parameters.

### 2. Two tokens with different jobs, and only one of them is a JWT

- The **access token** is a JWT, signed with HS256, valid about 15 minutes, sent in `Authorization: Bearer`. It is self-contained on purpose: checking it costs no database query, which is what makes a short lifetime affordable.
- The **refresh token** is not a JWT but a long random string. It is checked against the database anyway, so there is nothing for a signature to add, and a random string cannot leak claims to whoever holds it.

### 3. Refresh tokens are hashed with SHA-256, not argon2

Argon2 is deliberately slow because passwords are short and guessable. A refresh token is 32 random bytes, which no amount of guessing will reach, so the slowness would only tax the server on every refresh. SHA-256 over high-entropy input is the right tool, and the lookup can then be an indexed equality search on the hash.

### 4. Rotation, and what is deliberately left out

Using a refresh token marks it used and issues a replacement, so a stolen token works at most once. Detecting the reuse of an already-used token and revoking that user's whole family of tokens is the usual next step; it is left out until there is a way to show a user their sessions, because silently signing someone out everywhere with nothing to explain it is worse than the risk it removes.

### 5. The cookie is the default, the body is the escape hatch

The refresh token comes back in an `httpOnly`, `sameSite=lax` cookie scoped to the refresh path, which keeps it out of reach of page scripts. `POST /auth/refresh` also accepts it in the body, because a native wrapper keeps it in the device's secure storage and has no cookie jar - a decision already recorded in `docs/architecture.md`. `secure` follows the environment: a cookie marked secure is simply dropped over plain http in local development.

### 6. Verification is a service method; the strategy is a thin wrapper

`AuthService.verifyAccessToken(token)` takes a string and returns the user. The Passport strategy calls it, and so will the WebSocket gateway at step 6, where there is no request to run a strategy against. Writing it the other way round - logic inside the strategy - is what later forces a gateway to fake a request object.

### 7. `@CurrentUser()` hands over a user, not a payload

A handler should receive the person, not the claims. The guard puts the user on the request and the decorator reads it, so no handler ever touches `request.user` or decodes anything itself.

### 8. Auth request schemas live in the API, not in `core`

`core` holds the wardrobe's vocabulary. An email, a password length rule and a username pattern are the API's own contract, and nothing in the domain needs them. They are still zod schemas used through `@Body({ schema })`, so Swagger documents them like everything else.

### 9. The error for a wrong password and for an unknown email is the same

Two different answers would turn the sign-in form into a way of asking whether someone has an account. The same 401 and the same body for both.

### Target structure (orientation)

```
apps/api/src/auth/
  auth.module.ts
  auth.controller.ts        sign-up, sign-in, refresh, me
  auth.service.ts           hashing, token issuing, verifyAccessToken
  refresh-token.service.ts  issue, rotate, revoke - the database side
  jwt.strategy.ts           calls AuthService.verifyAccessToken
  jwt-auth.guard.ts
  current-user.decorator.ts
  requests/                 zod schemas for sign-up, sign-in, refresh
```

Signatures to orient by:

```ts
@Injectable()
export class AuthService {
  verifyAccessToken(token: string): Promise<AuthenticatedUser>;
  signUp(input: SignUpRequest): Promise<AuthenticatedUser>;
  signIn(input: SignInRequest): Promise<{ accessToken: string; refreshToken: string }>;
}
```

### Read first

- NestJS: [Authentication](https://docs.nestjs.com/security/authentication), [Guards](https://docs.nestjs.com/guards), [Custom route decorators](https://docs.nestjs.com/custom-decorators).
- [`@node-rs/argon2`](https://www.npmjs.com/package/@node-rs/argon2) for `hash` and `verify`.
- [OWASP: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) for why argon2 and why not for random tokens.

### Common pitfalls

- **A guard registered as `APP_GUARD` protects everything**, including sign-in and the health check. Either register it per controller or pair it with a `@Public()` decorator, decided before the first route is written.
- **`passport-jwt` is CommonJS.** Confirm the import shape in this ESM project at the first task, not the last.
- **`cookie-parser` has to be registered in `main.ts`**, which the e2e tests never run - the same trap as the validation pipe and Swagger. The shared test application factory is where it belongs too.
- **An expired-token test needs a token that is already expired**, which means issuing one with a lifetime in the past rather than waiting fifteen minutes.
- **Argon2 is slow by design.** A suite that signs up many users will feel it; share one signed-up user where the test is not about signing up.
- **A `secure` cookie never arrives over http**, so local development and the e2e tests would silently see no cookie at all.

## Risks / Trade-offs

- [A JWT cannot be withdrawn before it expires] → the access token's life is short, and the refresh token, which can be withdrawn, is the one that lasts.
- [Rotation without reuse detection] → accepted knowingly, and written down above so it is a decision rather than an oversight.
- [`passport-jwt` is an old package in an ESM project] → confirmed at the first task; a hand-written guard over `@nestjs/jwt` is the fallback and costs little.
- [Auth tests are slower because hashing is slow] → one shared user per suite.
