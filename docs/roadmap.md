# PoC roadmap

The application code is written by the project author; each step comes with detailed pointers (goal, what to read, structure, key points, common mistakes, done criteria) and a review of what was written. **Tests are written by Claude** from the spec scenarios, so each task starts with failing tests that the author's code has to make pass. For any step the author can switch to "Claude writes and explains" mode (as in step 1).

## How we work (with OpenSpec)

Every step from 1 onwards is an [OpenSpec](https://github.com/Fission-AI/OpenSpec) **change** in `openspec/changes/<change-id>/`. Step 0 is a setup chore and has no change. The full walkthrough, commands and spec format: [openspec-guide.md](openspec-guide.md).

| You say (in chat) | What happens |
|---|---|
| **"крок N"** (step N) | The step's change is created with `/opsx:propose`: `proposal.md` (why, what), delta specs (acceptance criteria as scenarios), `design.md` (pointers: decisions, structure, docs to read, pitfalls), `tasks.md` (a checklist, each task with a way to verify it) |
| Starting a task group | Claude writes the group's tests first — `describe` = requirement name, `it` = scenario name. They fail until the code is written |
| **"підказка"** (hint) | Three levels of hints: direction → more specific → a code fragment |
| **"перевір"** (check) | Review of your files (remarks and questions, no rewriting); tasks that pass review get ticked in `tasks.md` |
| **"покажи рішення"** (show solution) | A ready-made solution |
| Step finished | **Automatic**, once all of these hold: every task is ticked, tests and the type check are green, `openspec validate --strict` passes, every scenario has a test, and the last review passed (or, in "Claude writes" mode, the author said OK). Claude then archives the change (`/opsx:archive`: delta specs merge into `openspec/specs/`, the change moves to `openspec/changes/archive/`), commits and pushes to `dev`, and reports what moved. Say **"не архівуй"** (don't archive) to hold it |

We don't use `/opsx:apply` for normal work: it implements tasks by writing code. In this project it means the same as "покажи рішення", and it asks which tasks to solve first (see `operations.apply` in `openspec/config.yaml`).

Useful commands:

```bash
openspec list
```

```bash
openspec view
```

```bash
openspec validate --all --strict
```

## Laying groundwork for later

What to lay down in early steps so that later features can be added without rework:

| Feature | What to lay down | Step |
|---|---|---|
| Auto-tagging, pre-purchase check | Tag enums in `core` + zod schemas as the single source of truth; `TaggingProvider` (manual at first) | 1, 9 |
| Pre-purchase check, suitcase, "outfit around an item" | The generator is a pure function with `mustInclude` / `exclude` | 1, 10 |
| Chat, social | `username`, UUIDs, `visibility`; token and access checks as separate methods; `realtime` and `chat` as separate modules | 3, 4, 5, 6 |
| Statistics | `Item.price`, `Item.purchasedAt`; `wearCount` / `lastWornAt` updated together with `WearLog` | 3, 10 |
| Diary, "outfit of the day" | `User.timezone`; `WearLog.date` is the user's calendar date | 3, 10 |
| Suitcase, weather | `Item.warmth`; `WeatherProvider` (Open-Meteo) with a cache — when weather is needed | 3, after the PoC |
| Mobile app | `camera` / `tokenStore` / `share` wrappers; `VITE_API_URL`; refresh token from a cookie or the request body | 4, 8 |
| Try-on | `TryOnProvider`, `ReferencePhoto`, `TryOnJob` | 15, after the PoC |
| UI translation | Codes in the database (`blouse`), labels in the UI dictionary | 1, 8 |

## Steps

### Step 0 — environment and repository skeleton
**Change:** none (setup chore).
**Goal:** pnpm, Git, monorepo structure.
**What you'll learn:** pnpm workspaces.
**Heads-up (pnpm 12):** dependency build scripts are blocked until approved — an install fails until the package is listed under `allowBuilds` in `pnpm-workspace.yaml` (`pnpm approve-builds` adds it). Expect this at steps 1–4 (esbuild, Prisma, argon2).
**Done when:**
- [x] `pnpm -v` works (pnpm 12.9.1, pinned in `packageManager`)
- [x] `apps/`, `packages/`, `pnpm-workspace.yaml`, a root `package.json` exist
- [x] Git repository with `.gitignore`, `.gitattributes` and the first commit of `docs/`, `openspec/` and `.claude/` (2026-10-06)

### Step 1 — `packages/core`: types and the first scoring rules
**Change:** `add-core-domain` — done and archived on 2026-10-06 (`openspec/changes/archive/2026-10-06-add-core-domain/`); its specs now live in `openspec/specs/wardrobe-taxonomy/` and `openspec/specs/outfit-scoring/`.
**Goal:** domain types (`Item`, `Occasion`, `Outfit`) and a few pure scoring functions.
**What you'll learn:** TypeScript types (union types, `as const`), Vitest, TDD.
**Groundwork:** all tag enums are `as const` arrays + zod schemas, from which the types, the JSON Schema for Gemini and the form options are derived (see [auto-tagging.md](auto-tagging.md#single-source-of-truth-enums-in-core)); the generator takes items as input (never reads the database itself) and supports `mustInclude` / `exclude` — "outfit around an item", the pre-purchase check and the suitcase are built on that later (see [outfit-algorithm.md](outfit-algorithm.md#generator-interface)).
**Done when:**
- [x] types follow [data-model.md](data-model.md)
- [x] color and formality scoring functions + their tests
- [x] `pnpm --filter @closet/core test` is green (34 tests, all 28 spec scenarios covered)

### Step 2 — NestJS: the first API
**Change:** `add-api-skeleton`.
**Goal:** the `apps/api` project, `GET /health`, configuration from `.env`, global validation.
**What you'll learn:** modules, controllers, services, dependency injection, `ConfigModule`, `StandardSchemaValidationPipe`, zod schemas in place of DTO classes, Swagger generated from those schemas.
**Done when:**
- [x] `GET /health` responds
- [x] an invalid body returns 400 listing every invalid field, with dotted paths
- [x] `POST /outfits/score` scores an outfit with the rules from `@closet/core`
- [x] Swagger at `/docs`, generated from the same zod schemas that validate the request
- [x] 53 tests across both packages; all 19 spec scenarios covered

### Step 3 — PostgreSQL + Prisma
**Change:** `add-database`.
**Goal:** Postgres in Docker Compose (or Neon), the `User` and `Item` schema, migrations, `PrismaService`.
**What you'll learn:** Docker Compose, Prisma schema, migrations, Nest lifecycle hooks.
**Groundwork:** `User.username` (unique); all ids are UUIDs; timestamps are `timestamptz`; `Item.visibility` = `private` by default; optional `Item.price` and `Item.purchasedAt` (for statistics); `User.timezone` (diary, "outfit of the day").
**Done when:**
- [x] `docker compose up` starts the database, and the data survives a restart
- [x] the first migration is applied, the tables are visible in Prisma Studio
- [x] `DATABASE_URL` is a validated setting without which the API refuses to start
- [x] `PrismaService` opens the connection with the application and closes it with it
- [x] 65 tests: `pnpm test` needs no container, `test:db` runs the 10 that do

### Step 4 — authentication
**Change:** `add-auth`.
**Goal:** sign-up, sign-in, access + refresh tokens, protected routes.
**What you'll learn:** argon2, JWT, Passport strategies, guards, a custom `@CurrentUser()` decorator.
**Groundwork for the chat:** access token verification is a separate service method, not only inside the Passport strategy, so the WebSocket gateway can reuse it.
**Done when:**
- [x] sign-up → sign-in → access to a protected route with the token
- [x] without a token — 401; refresh issues a new token pair, and the used one stops working
- [x] the guard is global: a route is protected unless it is marked `@Public()`
- [x] an access token can be verified outside HTTP, ready for the chat gateway at step 6
- [x] 89 tests: 58 without a container, 31 with one

### Step 5 — wardrobe: item CRUD
**Change:** `add-wardrobe-items`.
**Goal:** create / read / update / archive items with an owner check.
**What you'll learn:** controller → service → Prisma layers, query filters, e2e tests (Supertest).
**Groundwork for the chat:** access checks ("can this user see this item") are separate service methods, so they can be reused when items get forwarded to the chat.
**Done when:**
- [x] CRUD works only for your own items
- [x] e2e test: user B can neither see nor modify user A's items
- [x] somebody else's item and an id belonging to nothing answer identically, body included
- [x] `DELETE` archives with a reason and is safe to repeat; nothing is ever removed
- [x] 118 tests: 66 without a container, 52 with one

### Step 6 — friends and chat (backend)
**Changes:** `add-friends`, then `add-chat`. Two, because one would be far past the ten-requirement limit, and because the cut falls somewhere real: friendships need no gateway, and a chat cannot start without them.
**Goal:** friends (search by `username`, request, accept, block) and a chat between friends: a Socket.IO gateway, rooms, message persistence, history over REST.
**What you'll learn:** WebSocket, Nest gateways, authenticating connections, rooms, delivery acknowledgements (acks), cursor pagination. Details in [social.md](social.md#how-the-chat-works).
**Decided while planning:** one friendship row per pair, identified by the two ids sorted rather than by who asked, so the database rather than the application guarantees it; blocking lives on that row, because a stranger's only way to reach anybody here is a friend request, which creates the row first; declining, cancelling, unfriending and unblocking are all one deletion. A conversation is created by the first message rather than with the friendship, which costs a `directKey` for race safety and a room per user so a new conversation reaches somebody already connected — that room is wanted for notifications anyway.
**Done when:**
- [x] two users become friends — `add-friends`, archived; also blocking, and a friend reading the items marked `friends`
- [x] messages arrive live and are stored — checked by socket tests against a real port rather than by hand in Postman
- [x] a non-member can neither read nor write — friendship is checked on every message, so blocking stops them without the gateway knowing what blocking is
- [x] after reconnecting, missed messages are fetched — `after` on the history route
- [x] 187 tests: 69 without a container, 118 with one

### Step 7 — photos: Backblaze B2
**Change:** `add-photo-storage`, archived.
**Goal:** a bucket, presigned URLs for upload and viewing, `StorageService`.
**Decided while building:** the tests run against a local object store in Compose rather than against Backblaze, because a presigned URL accepting a credential-less PUT is the thing worth proving and only something that checks signatures can show it. The official MinIO images were withdrawn in September 2026, so it is Chainguard's rebuild — the one unpinned image here, with Garage as the fallback that pins. The bucket is created by a script a person runs, never by the API: a key scoped to one bucket has no right to create buckets. A photo key names its owner, so one captured from somebody else cannot be attached to your own item.
**What you'll learn:** the S3 API (`@aws-sdk/client-s3`), presigned URLs, bucket CORS.
**Done when:**
- [x] a file uploads directly to storage via a presigned URL, with no credentials on the request
- [x] view links go only to people who may see the item — the same paths that already decide that
- [x] a replaced photograph is deleted from storage
- [x] 205 tests: 72 without a container, 133 with one

### Step 8 — client: React + Vite
**Changes:** `add-web-shell`, then `add-wardrobe-screens`, then `add-social-screens`. Three, for the same reason step 6 became two: one would be several times the ten-requirement limit, and the cut falls along what depends on what. After the first the application exists, looks like Windows 98 and can be signed into — a wardrobe without a sign-in is nothing, and a chat without a wardrobe is less.
**Goal:** `apps/web`, routing, sign-in, the item list, friends and chat screens. Mobile-first from the start, `VITE_API_URL`, wrappers for platform features (see [architecture.md](architecture.md#mobile-app-pwa-now-app-stores-via-capacitor)).
**Carried over from step 7:** **bucket CORS.** Step 7 moves bytes with `fetch` from Node, which has no CORS at all, so nothing there could have caught it. In a browser the upload is a cross-origin `PUT` with a `Content-Type`, which preflights, and a bucket with no rules refuses it before the request is sent. It belongs to `add-wardrobe-screens`, where a browser first uploads something and the rules can be proved rather than guessed at. Note the asymmetry: MinIO allows every origin by default, so this works locally and fails on Backblaze — the same shape of trap as the addressing style.
**Interface:** Tailwind + 98.css in the `components` cascade layer, a pixel font with Cyrillic, `Window` and `Taskbar` components, the "Clueless" theme (see [ui.md](ui.md)).
**What you'll learn:** handling tokens on the client, an API client, CORS and cookies across origins, responsive layout, CSS cascade layers.
**Also here:** CORS for the client's origin, and security headers through `app.useSecurityHeaders()` — built into Nest 12 with Helmet 8's defaults, so no extra package. Both belong to this step because both only start mattering once a browser renders our responses. Watch out for the default `upgrade-insecure-requests`, which breaks Swagger UI over plain http outside localhost ([architecture.md](architecture.md#security-and-privacy)).
**Done when:**
- [ ] sign-in / sign-out, a list of your own items
- [ ] the chat between two accounts works in the browser and on a phone
- [ ] screens are in the retro style; Tailwind utilities override 98.css; Ukrainian labels use the pixel font, not Arial

### Step 9 — adding an item from a phone
**Change:** `add-item-capture`.
**Goal:** camera → background removal → WebP → upload → tag form.
**What you'll learn:** `<input capture>`, `@imgly/background-removal`, canvas, `toBlob`.
**Groundwork for auto-tagging:** the tag form is built from the `core` enums and can accept a `TagSuggestion`; Nest has a `TaggingProvider` with a manual implementation; colors are computed from the pixels of the cut-out photo.
**Done when:**
- [ ] an item is added from a phone with the background cut out
- [ ] the [iPhone checklist](mobile.md#iphone-testing-checklist) passes for the camera and background removal

### Step 10 — outfit generator
**Change:** `add-outfit-generator`.
**Goal:** `POST /outfits/generate` based on `core`, the generation screen, the 2D doll, "wore it today" (`WearLog`), "outfit around this item" (`mustInclude`).
**What you'll learn:** integrating a monorepo package into Nest, canvas composition, transactions.
**Groundwork for statistics and the diary:** "wore it today" creates a `WearLog` and updates `wearCount` / `lastWornAt` in one transaction; the date is a calendar date in the user's time zone.
**Scoring knobs:** with several more components, gather the scoring thresholds and scores (now constants inside `color.ts`, `formality.ts`, `filters.ts`) into one `scoring/tuning.ts` object, optionally passed to `scoreOutfit`, so they can be tuned on real photos and compared.
**Done when:**
- [ ] pick an occasion → get an outfit → "another one" / like / save / "wore it today"
- [ ] from an item card — "make an outfit with this item"

### Step 11 — PWA and phone test
**Change:** `add-pwa`.
**Goal:** manifest, icons, service worker, Cloudflare Quick Tunnel.
**Carried over from step 8:** the tunnel is the first proxy in the project, and it has to rewrite the refresh cookie's path as well as the request's ([poc.md](poc.md#phone-access-through-a-tunnel)).
**What you'll learn:** PWA, browser HTTPS requirements.
**Done when:**
- [ ] the app installs on Android (own "Install" button) and on iPhone (a hint with instructions)
- [ ] the whole [iPhone checklist](mobile.md#iphone-testing-checklist) passes

> **Milestone: the PoC core is done** — wardrobe, generator, chat, the app on a phone.

### Step 12 — outfit diary
**Change:** `add-outfit-diary`.
**Goal:** for "wore it today" — a photo of yourself in the outfit (optional) and a note; a monthly calendar; "a year ago you wore…".
**What you'll learn:** dates and time zones, a calendar grid, a gallery with lazy-loaded photos.
**Done when:**
- [ ] the calendar shows what was worn each day, with photos
- [ ] the home screen shows a "a year / a month ago" memory if there's an entry

### Step 13 — wardrobe statistics
**Change:** `add-wardrobe-stats`.
**Goal:** cost per wear (price / count), "not worn for N days — give away?", most worn, distribution by color and category, the share of the wardrobe actually used.
**What you'll learn:** SQL aggregations (Prisma `groupBy`, raw SQL if needed), charts (e.g. Recharts or Chart.js).
**Done when:**
- [ ] a statistics screen with 3–4 metrics and charts
- [ ] a "not worn for a long time" list with an "archive" action

### Step 14 (optional) — your own doll base
**Change:** `add-custom-doll-base`.
**Goal:** first a mannequin from measurements (height, circumferences → SVG silhouette and anchors), then your own photo: a full-length photo → background removal → automatic anchors (MediaPipe Pose Landmarker) → manual marker adjustment. Details in [try-on.md](try-on.md#mannequin-from-your-measurements).
**What you'll learn:** generating SVG outlines (Bézier curves), ML models in the browser, working with coordinates.
**Done when:**
- [ ] entered measurements change the silhouette live
- [ ] an outfit is shown on the measured mannequin and on your own photo
- [ ] items fitted on the standard mannequin sit on other bases without re-fitting

### Step 15 (optional) — AI
**Change:** `add-ai-tagging` (and a separate one for try-on).
**Goal:** auto-tagging via the Gemini free tier with a structured JSON response ([auto-tagging.md](auto-tagging.md)); a few AI try-ons through a public Hugging Face demo.
**Done when:**
- [ ] the tag form fills in automatically
- [ ] `TryOnProvider` with an implementation for the HF Space

## After the PoC

- **Social and real time.** Friends and a basic chat are already in the PoC (steps 6 and 8). Next: favorites → SSE for try-on status → forwarding items / outfits to the chat → chat about lending → "help me pick an outfit" → ratings. Details in [social.md](social.md#order-from-simple-to-complex).
- **Pre-purchase check** and **travel suitcase** — see [features.md](features.md).
- **Logging with Pino**, together with deployment — that is when logs first have somewhere to go and a reason
  to be machine-readable. Until then Nest's own logger is enough, and it can already emit JSON on its own
  (`ConsoleLogger` with `json: true`), so the package is not what structured output is bought with. What Pino
  adds is a request id tying one request's lines together, and `redact`, which keeps passwords, tokens and
  cookies out of the log by rule rather than by care. `nestjs-pino` 5.3.1 supports Nest 12.
- **Sweeping abandoned accounts' refresh tokens.** `issue()` now clears a user's expired rows as it
  writes their new one (`close-known-gaps`), which needs no scheduler and no process that could quietly
  stop. What it cannot reach is accounts nobody signs in to any more, and only a scheduled job will:
  `@nestjs/schedule`, `pg_cron`, or the host's own scheduler, whichever the deployment makes easiest.
  **Delete by `expiresAt`, never by `usedAt`** — the rule the existing sweep already follows. A spent but
  unexpired token is evidence: presenting one almost always means it was stolen, since an honest client
  discards its old token after exchanging it, and deleting those rows would make a replayed token
  indistinguishable from an invented one.
- **Detecting a reused refresh token.** We answer 401 today and learn nothing from it. The standard
  response is revoking every token that user holds — which logs out the thief and the owner together,
  so it is a decision to take deliberately rather than a detail to add in passing.
