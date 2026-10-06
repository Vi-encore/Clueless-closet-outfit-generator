# PoC roadmap

The code is written by the project author; each step comes with detailed pointers (goal, what to read, structure, key points, common mistakes, done criteria) and a review of what was written.

## How we work (with OpenSpec)

Every step from 1 onwards is an [OpenSpec](https://github.com/Fission-AI/OpenSpec) **change** in `openspec/changes/<change-id>/`. Step 0 is a setup chore and has no change. The full walkthrough, commands and spec format: [openspec-guide.md](openspec-guide.md).

| You say (in chat) | What happens |
|---|---|
| **"крок N"** (step N) | The step's change is created with `/opsx:propose`: `proposal.md` (why, what), delta specs (acceptance criteria as scenarios — they become your tests), `design.md` (pointers: decisions, structure, docs to read, pitfalls), `tasks.md` (a checklist, each task with a way to verify it) |
| **"підказка"** (hint) | Three levels of hints: direction → more specific → a code fragment |
| **"перевір"** (check) | Review of your files (remarks and questions, no rewriting); tasks that pass review get ticked in `tasks.md` |
| **"покажи рішення"** (show solution) | A ready-made solution |
| All tasks done | `/opsx:archive`: the delta specs merge into `openspec/specs/`, the change moves to `openspec/changes/archive/` |

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
**Change:** `add-core-domain` (already proposed — see `openspec/changes/add-core-domain/`).
**Goal:** domain types (`Item`, `Occasion`, `Outfit`) and a few pure scoring functions.
**What you'll learn:** TypeScript types (union types, `as const`), Vitest, TDD.
**Groundwork:** all tag enums are `as const` arrays + zod schemas, from which the types, the JSON Schema for Gemini and the form options are derived (see [auto-tagging.md](auto-tagging.md#single-source-of-truth-enums-in-core)); the generator takes items as input (never reads the database itself) and supports `mustInclude` / `exclude` — "outfit around an item", the pre-purchase check and the suitcase are built on that later (see [outfit-algorithm.md](outfit-algorithm.md#generator-interface)).
**Done when:**
- [ ] types follow [data-model.md](data-model.md)
- [ ] color and formality scoring functions + their tests
- [ ] `pnpm --filter @closet/core test` is green

### Step 2 — NestJS: the first API
**Change:** `add-api-skeleton`.
**Goal:** the `apps/api` project, `GET /health`, configuration from `.env`, global validation.
**What you'll learn:** modules, controllers, services, dependency injection, `ConfigModule`, `ValidationPipe`, DTOs.
**Done when:**
- [ ] `GET /health` responds
- [ ] an invalid DTO returns 400 with an explanation

### Step 3 — PostgreSQL + Prisma
**Change:** `add-database`.
**Goal:** Postgres in Docker Compose (or Neon), the `User` and `Item` schema, migrations, `PrismaService`.
**What you'll learn:** Docker Compose, Prisma schema, migrations, Nest lifecycle hooks.
**Groundwork:** `User.username` (unique); all ids are UUIDs; timestamps are `timestamptz`; `Item.visibility` = `private` by default; optional `Item.price` and `Item.purchasedAt` (for statistics); `User.timezone` (diary, "outfit of the day").
**Done when:**
- [ ] `docker compose up` starts the database
- [ ] the first migration is applied, the tables are visible in Prisma Studio

### Step 4 — authentication
**Change:** `add-auth`.
**Goal:** sign-up, sign-in, access + refresh tokens, protected routes.
**What you'll learn:** argon2, JWT, Passport strategies, guards, a custom `@CurrentUser()` decorator.
**Groundwork for the chat:** access token verification is a separate service method, not only inside the Passport strategy, so the WebSocket gateway can reuse it.
**Done when:**
- [ ] sign-up → sign-in → access to a protected route with the token
- [ ] without a token — 401; refresh issues a new token pair

### Step 5 — wardrobe: item CRUD
**Change:** `add-wardrobe-items`.
**Goal:** create / read / update / archive items with an owner check.
**What you'll learn:** controller → service → Prisma layers, query filters, e2e tests (Supertest).
**Groundwork for the chat:** access checks ("can this user see this item") are separate service methods, so they can be reused when items get forwarded to the chat.
**Done when:**
- [ ] CRUD works only for your own items
- [ ] e2e test: user B can neither see nor modify user A's items

### Step 6 — friends and chat (backend)
**Change:** `add-friends-and-chat`.
**Goal:** friends (search by `username`, request, accept) and a chat between friends: a Socket.IO gateway, rooms, message persistence, history over REST.
**What you'll learn:** WebSocket, Nest gateways, authenticating connections, rooms, delivery acknowledgements (acks), cursor pagination. Details in [social.md](social.md#how-the-chat-works).
**Done when:**
- [ ] two users become friends
- [ ] messages arrive live (checked with Postman — it speaks Socket.IO) and are stored in the database
- [ ] a non-member of a conversation can neither read nor write to it
- [ ] after reconnecting, missed messages are fetched

### Step 7 — photos: Backblaze B2
**Change:** `add-photo-storage`.
**Goal:** a bucket, presigned URLs for upload and viewing, `StorageService`.
**What you'll learn:** the S3 API (`@aws-sdk/client-s3`), presigned URLs, bucket CORS.
**Done when:**
- [ ] a file uploads directly to B2 via a presigned URL
- [ ] the API returns view links only to the owner

### Step 8 — client: React + Vite
**Change:** `add-web-client`.
**Goal:** `apps/web`, routing, sign-in, the item list, friends and chat screens. Mobile-first from the start, `VITE_API_URL`, wrappers for platform features (see [architecture.md](architecture.md#mobile-app-pwa-now-app-stores-via-capacitor)).
**Interface:** Tailwind + 98.css in the `components` cascade layer, a pixel font with Cyrillic, `Window` and `Taskbar` components, the "Clueless" theme (see [ui.md](ui.md)).
**What you'll learn:** handling tokens on the client, an API client, the Vite proxy, responsive layout, CSS cascade layers.
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
**Done when:**
- [ ] pick an occasion → get an outfit → "another one" / like / save / "wore it today"
- [ ] from an item card — "make an outfit with this item"

### Step 11 — PWA and phone test
**Change:** `add-pwa`.
**Goal:** manifest, icons, service worker, Cloudflare Quick Tunnel.
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
