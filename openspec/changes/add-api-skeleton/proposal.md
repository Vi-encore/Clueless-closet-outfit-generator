# Proposal

## Why

Step 2 of the roadmap (`docs/roadmap.md`): the project needs its backend before any data can be stored. This change creates the NestJS API with the cross-cutting basics every later step relies on — a health check, settings from the environment, and request validation — and proves that the API can use `@closet/core`, which is the open risk left by step 1. NestJS is the main thing the author wants to practise, so this is also the first hands-on Nest step.

Request validation reuses the zod schemas from `@closet/core` instead of duplicating them as `class-validator` classes: one monorepo, one definition of what a valid item is. NestJS 12 validates Standard Schema libraries such as zod natively.

## What Changes

- New application `apps/api` (`@closet/api`): NestJS 12 as an ES-module project, created with the Nest CLI and wired into the pnpm workspace.
- `GET /health` reports that the service is up.
- Settings (port, environment name) come from environment variables, validated at startup with a zod schema; `.env.example` documents them.
- Global request validation through zod schemas: invalid bodies get a 400 response that lists every invalid field; unknown fields are dropped.
- `POST /outfits/score`: scores a posted outfit for a posted occasion using the rules from `@closet/core`. It is the first real endpoint that exercises validation and the core package end to end (a stateless preview — nothing is stored).
- `@closet/core` gains an occasion schema (and an outfit-item schema: item tags plus an id), and is built to JavaScript so Node can run it.
- Node.js is upgraded: the NestJS 12 CLI needs 22.22.3+ or 24.15+.

Out of scope (later steps):
- Database and persistence → step 3 (`add-database`); the outfit endpoint stores nothing.
- Authentication and per-user data → step 4; `/outfits/score` is open for now.
- CORS, the Vite proxy and the web client → step 8.
- Occasions stored as data, the outfit generator → step 10.
- Deployment → after the PoC (see `docs/architecture.md#environments`).

## Capabilities

### New Capabilities
- `service-health`: reporting that the API is up.
- `service-config`: reading and validating the API's settings from the environment.
- `request-validation`: rejecting malformed request data with a clear, consistent error.
- `outfit-score-preview`: scoring a posted outfit over HTTP with the core rules.

### Modified Capabilities
- `outfit-scoring`: adds validation of an occasion's target formality and weights.

## Impact

- New: `apps/api` with NestJS 12, `@nestjs/config`, Vitest and Supertest (from the Nest ESM template).
- `packages/core`: imports switch to `.js` extensions (Node ES modules require them), a `build` script emits `dist/` with type declarations, and `exports` point to it. Core tests keep running on the source.
- Root: Node.js engine raised; scripts to build `core` before running the API.
- Requires step 1 (`@closet/core`), done and archived.
