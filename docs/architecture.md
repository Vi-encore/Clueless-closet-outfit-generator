# Architecture

> Rejected alternatives and comparisons (AWS Free Tier, Supabase, DynamoDB, hosting) are in [backend-options.md](backend-options.md). Entities and fields are in [data-model.md](data-model.md).

## Requirements

- **Multiple users**, each with their own account and wardrobe.
- **Phone and computer.** Items are photographed with a phone.
- **Photos are private:** only the owner sees them (later also the person an item is lent to).
- **AI features** (auto-tagging, try-on) → keys only on the server, per-user limits.
- **Own backend in NestJS** — for practice.
- **Minimal costs:** everything on free tiers at the start.

## Diagram

```
PWA (phone / laptop) ──REST + JWT──► NestJS API ──► PostgreSQL (Neon)
  │                                        │  ▲
  │                                        │  │ job ▼ / webhook ▲
  │                                        │  │
  │                                        │  Modal: Python + GPU (try-on)
  │                                        │  ──► storage via presigned URL
  │                                        │
  │                                        ├──► Gemini free tier (auto-tagging)
  │                                        │
  │                                        └──► issues presigned URLs
  │
  └──── PUT / GET via presigned URL ────► Object storage, S3 API
                                          (Cloudflare R2 or AWS S3)
```

API modules:

| Module | What it does |
|---|---|
| `auth` | Sign-up, sign-in, JWT, refresh tokens |
| `users` | Profile, search by username (later — friends) |
| `items` | Wardrobe, photos, statuses, archive |
| `outfits` | Generation (via the `core` package), saving, reactions, "wore it today" |
| `occasions` | System and custom occasions |
| `ai` | Auto-tagging, try-on jobs via `TryOnProvider` (Modal), result webhook, usage limits |
| `loans` | Lending items (later) |
| `storage` | Presigned URLs, file deletion |

## Stack

| Layer | Choice | Why |
|---|---|---|
| Client | React + Vite + TypeScript, PWA | One codebase for phone and computer; camera via `<input type="file" capture>` |
| UI | 98.css + Tailwind CSS v4, own components | Retro look without JS; Tailwind for layout. Details in [ui.md](ui.md) |
| API | NestJS | Backend practice: modules, DI, guards, DTOs and validation |
| ORM | Prisma | Typed client, migrations, a recipe in the official Nest docs |
| Database | PostgreSQL on Neon | Free forever (0.5 GB); wakes up by itself after sleeping |
| Files | S3 API: Cloudflare R2 (or Backblaze B2 / AWS S3) | R2: 10 GB free and no egress fees, but needs a card; B2: 10 GB without a card. The code is the same for all |
| Auth | Own, in Nest: Passport + JWT | A key part of the practice |
| Algorithm | `packages/core` — pure TS | Depends on neither Nest nor the database; easy to test |
| Try-on | CatVTON (Python) on Modal — serverless GPU | $30 free credits / month; needs a card + spending limit. Details in [try-on.md](try-on.md) |
| Monorepo | pnpm workspaces | Shared types between `web`, `api` and `core` |

## Key decisions

### TypeScript everywhere

- One language for the client, the API and the algorithm; domain types (`Item`, `Outfit`, `Occasion`) are described once.
- The item model has many enumerated values — TS catches typos like `"casul"` before anything runs.
- The computations are light (10,000 pairs take milliseconds) and no machine learning is needed, so Python isn't needed either.

### PostgreSQL

The data is relational: items ↔ outfits ↔ history ↔ occasions, and with multiple users also relations between people (lending, friends). Why not DynamoDB: see [backend-options.md](backend-options.md#why-not-dynamodb).

### The algorithm runs on the server

`POST /outfits/generate { occasionId }` → the service takes the user's available items (excluding those in the laundry, archived or lent out), history and reactions → calls `core.generateOutfit()`.

- History and likes are already in the database, no need to pull them to the client.
- Availability rules (lending etc.) live in one place.
- The client stays thin. `core` is pure, so if needed (offline) it can run on the client too.

### Photos go straight to storage

1. The client removes the background (`@imgly/background-removal`) and compresses the photo to WebP.
2. `POST /items/upload-url` → the API checks limits and returns a presigned PUT URL (valid for a few minutes).
3. The client uploads the file directly to R2 / S3 — files never pass through the API.
4. `POST /items` with the file key → the API creates the item.

For display, the API issues presigned GET URLs only for items the user has access to.

### Mobile app: PWA now, app stores via Capacitor

**The PWA covers everything needed now:** home screen install, full-screen mode, camera, photo upload, Web Share, and later push notifications (on iPhone — only for an installed PWA, iOS 16.4+). On iPhone installation is manual: Safari → "Share" → "Add to Home Screen".

**If the App Store / Google Play are ever needed**, the same React build gets wrapped in [Capacitor](https://capacitorjs.com/) (a native shell with a WebView). That's not a rewrite, but it requires:
- generating native projects (`android/`, `ios/`), icons, splash screens;
- replacing some web APIs with Capacitor plugins (camera, push, files);
- changing how the refresh token is stored (cross-domain cookies are unreliable in a WebView — see [Authentication](#authentication));
- paying for developer accounts: Google Play once, Apple yearly; an iOS build needs a Mac (or a paid cloud build).

For your own Android phone no payment is required: an APK can be built in Android Studio on Windows and installed directly.

Android and iPhone specifics and how to test on both: [mobile.md](mobile.md).

**What we lay down from the start so the move stays cheap:**
- **Mobile-first layout:** phone first; buttons ≥ 44 px; account for the notch and gestures (`viewport-fit=cover`, `env(safe-area-inset-*)`); nothing that only works on mouse hover.
- **PWA from day one:** manifest, icons, `display: standalone`, service worker (`vite-plugin-pwa`).
- **Platform features behind thin wrappers:** `camera`, `tokenStore`, `share`, `notifications` — separate modules with a simple interface. Moving to Capacitor changes only them (the same idea as `StorageService` and `TryOnProvider` on the backend).
- **API address from configuration** (`VITE_API_URL`; in development the API directly, across origins, see [ADR-0012](adr/0012-the-client-is-another-site.md)). A native shell has no proxy.

### Authentication

- Email + password; argon2 hash.
- Access token (JWT, ~15 min) + refresh token (httpOnly cookie, rotation, only the hash is stored in the database).
- The token refresh endpoint is designed so the refresh token can come either from a cookie (web / PWA) or in the request body (a future native wrapper, where the token sits in the device's secure storage). On the client this is hidden behind `tokenStore`.
- Later: Google sign-in (Passport strategy), email confirmation and password reset (needs an email service).
- If own auth takes too much time — the Better Auth library.

### User data isolation

Every table with user data has an `ownerId`, and every query is filtered by the current user.

The most common mistake in multi-user apps is forgetting this check and returning someone else's item by its id (IDOR). Protection:
- items are accessed only through methods like `findOwned(userId, itemId)`;
- e2e tests like "user B cannot see or modify user A's items".

### Limits and costs

- Try-on consumes GPU time and auto-tagging consumes the free-tier quota (and money on paid providers) → daily per-user limits (`UsageCounter`).
- A limit on the number of items / photo volume per user.
- Rate limiting for the whole API (`@nestjs/throttler`).

### Long-running operations (try-on)

Image generation takes from a few seconds to a minute (with a cold start). The process:
- the API creates a `TryOnJob` with status `pending` and calls the Modal endpoint, passing presigned URLs (Modal never gets storage keys);
- Modal generates in the background, puts the result at the presigned PUT URL and calls the webhook `POST /internal/try-on-jobs/:id/complete` with a secret token;
- the client polls the job status.

Diagram and details: [try-on.md](try-on.md#nestjs-integration).

## Environments

The PoC with no spending and no card has its own plan in [poc.md](poc.md).

| | Development | Production (start) |
|---|---|---|
| Database | Postgres in Docker or a separate Neon branch | Neon, main branch |
| Files | A separate dev bucket in R2 | A prod bucket in R2 |
| API | Locally, `nest start --watch` | Render (the free instance sleeps without requests) → a cheap VPS once there are real users |
| Client | Vite dev server | Static hosting (Cloudflare Pages, Netlify or Vercel) |

## Project structure

```
apps/
  web/           React + Vite, PWA
  api/           NestJS
  tryon-modal/   Python: CatVTON as a Modal function (outside pnpm workspaces; not yet built)
packages/
  core/          domain types, scoring, generator + tests (Vitest)
  conventions/   the code conventions as checks, and a test that runs them over every package
docs/            reference docs (this folder)
openspec/        specs and change proposals (OpenSpec)
```

### Inside the client

`apps/web/src` is arranged by feature ([ADR-0014](adr/0014-the-client-is-arranged-by-feature.md)):

```
app/             routes, providers, the shell and taskbar, emptying the cache when a session ends
features/
  session/       sign-in, sign-up, the session context and its guards
  wardrobe/      the list, adding an item, an item's card, the tile a friend's wardrobe reuses
  friends/       friends and requests, blocking, a friend's wardrobe
  chat/          the connection, conversations, unread counts
  desktop/       the shortcuts a session lands on
shared/
  api/           the API client, the in-memory token and its single-flight renewal, the query client
  ui/            the window frame and the dialogs
  hooks/         a list read a page at a time, forms, going back
  i18n/uk.ts     every word a person reads
  styles/        the theme over 98.css
```

A feature holds its API calls, interfaces, hooks, screens, stylesheet and specs, and the rest of the
client reaches it only through its `index.ts`. `shared/` imports no feature. Every stylesheet goes
into the `components` cascade layer from `index.css`, so that Tailwind's utilities still win.

### Feature flags

A flag is a switch a deployment turns without a change to the code
([ADR-0020](adr/0020-feature-flags-are-a-core-vocabulary.md)).

- **The vocabulary:** `packages/core/src/flags/flags.constants.ts` names every flag and
  its default.
- **The API:** takes the defaults, applies `FEATURES_ON`, then `FEATURES_OFF`, refuses
  to start on an unknown name, and answers the result at the public `GET /flags`.
  Code inside the API asks `FlagsService.isOn`.
- **The client:** asks once per session. `useFlag(name)` from `features/flags` answers
  the deployment's value, or the default while there is no answer.

The first flag is `photoCutout`. Switched off, no background-removal model is fetched,
and a new item keeps its original photograph.

### Server data on the client

What the screens read from the API goes through TanStack Query
([ADR-0017](adr/0017-server-data-is-cached-by-tanstack-query.md)). Each feature names its cache keys
and queries in `<feature>.queries.ts`: `['items', …]` for the wardrobe, `['friends', …]` for people
and a friend's wardrobe, `['conversations']` for the chat list. A screen opened again shows what it
last had and asks again behind it. A change refreshes the prefixes it touches once the API has
answered, and writes the answer straight into the cache where the answer is the whole thing. The cache
is emptied when a session ends. Failures are not retried. The session and the chat connection are
React contexts, and an open conversation's messages are kept by `useConversation`, because they
arrive live over the socket.

### Code conventions

Every hand-written shape is named in a `*.interfaces.ts` file, props included, and nothing is typed
`any` ([ADR-0015](adr/0015-shapes-are-named-in-interfaces-files.md)). A type computed from a value
with `typeof` stays beside the value. `packages/conventions` checks both in every package, and the
linter refuses an explicit `any`.

A component, a hook or a class has its file to itself
([ADR-0018](adr/0018-one-thing-per-file.md)). Its helper functions go to `<folder>.utils.ts`, the
constants they share to `<folder>.constants.ts`, and any other component or hook to a file of its
own. An exported constant never shares a file with a function, class or component, so every
`<feature>.queries.ts` exports functions and takes its keys from `<feature>.constants.ts`. Tests and
their fixtures are exempt, and `packages/conventions` checks the rest.

## Security and privacy

- Buckets are private; access only through short-lived presigned URLs.
- AI API and storage keys live only in the API's environment variables.
- Passwords — argon2; refresh tokens are stored hashed.
- CORS — the client domain only.
- Security headers — `app.useSecurityHeaders()`, built into Nest 12 and using Helmet 8's defaults, so the
  package itself is not needed. Added at step 8 together with CORS, because that is when a browser starts
  rendering our responses. One trap to remember: the default `upgrade-insecure-requests` directive breaks
  Swagger UI when it is served over plain http anywhere but localhost.
- Deleting an account deletes all of the user's data and files.
- Photos sent to AI APIs fall under the provider's policy — this has to be described in the app's privacy policy.
