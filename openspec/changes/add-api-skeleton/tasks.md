# Tasks

## 1. Environment and the `core` build

- [x] 1.1 Upgrade Node.js to 24 LTS (or 22.22.3+) and raise `engines.node` in the root `package.json` to match; verify `node -v` and `pnpm -v` in a new terminal
- [x] 1.2 Switch `@closet/core` to `NodeNext` with `.js` extensions in all relative imports; verify `pnpm --filter @closet/core test` and `pnpm --filter @closet/core typecheck` stay green
- [x] 1.3 Add `tsconfig.build.json`, `build` and `dev` scripts and `exports` pointing to `dist/`, plus a root `build` script; verify `pnpm --filter @closet/core build` creates `dist/index.js` and `dist/index.d.ts` without test files, and `node -e "import('@closet/core').then((c) => console.log(c.SLOTS))"` run from `packages/core` prints the slots

## 2. Occasion and outfit-item schemas in `core` (`outfit-scoring`)

- [x] 2.1 Claude writes the tests "Valid occasion", "Target formality out of range", "Negative weight", "Missing id", "Tags still checked"
- [x] 2.2 Add `occasionSchema` and `outfitItemSchema` in `core/src/scoring/schemas.ts`, derive the `Occasion` and `OutfitItem` types from them and export both; verify the 2.1 tests pass, all core tests and the type check stay green, and `core` rebuilds

## 3. API skeleton and health check (`service-health`)

- [x] 3.1 Generate `apps/api` with the Nest CLI as an ESM project, wire it into the workspace (`@closet/api`, `private`, no nested git or lockfile, `@closet/core` as a `workspace:*` dependency) and add a root `dev:api` script; verify `pnpm dev:api` serves the template's `GET /`
- [x] 3.2 Claude writes the e2e test "Service is up" and adapts the template's test setup
- [x] 3.3 Replace the template controller with `HealthModule` and `HealthController`; verify the e2e test passes and `curl http://localhost:3000/health` returns `{"status":"ok"}`

## 4. Configuration (`service-config`)

- [ ] 4.1 Claude writes the tests "Defaults", "Port from the environment", "Port is not a number", "Unknown environment name"
- [ ] 4.2 Add `@nestjs/config` with the zod `envSchema`, commit `.env.example`, and make `main.ts` listen on the configured port; verify the 4.1 tests pass and starting with `PORT=4000` serves `/health` on port 4000

## 5. Request validation and the outfit endpoint (`request-validation`, `outfit-score-preview`)

- [ ] 5.1 Claude writes the tests "Field error listed", "Several errors at once", "Extra field removed", "Outfit scored", "Empty outfit rejected", "Formality gap explained"
- [ ] 5.2 Register `StandardSchemaValidationPipe` through `APP_PIPE` with an `exceptionFactory` that produces `{ statusCode, message, errors }`; verify "Extra field removed" passes
- [ ] 5.3 Add `OutfitsModule` with `POST /outfits/score` (request schema built from the core schemas, a service that calls `checkHardFilters` and `scoreOutfit`, status 200); verify the remaining 5.1 tests pass and a manual `curl` with the white blouse and denim jeans returns a total of 1.25

## 6. Integration check

- [ ] 6.1 From the root, run `pnpm build`, `pnpm test` and `pnpm typecheck`; verify all are green and every scenario of this change has a test with its name

## Workflow follow-up

- Say "перевір" after each group; tasks get ticked once they pass review.
- When every condition in `docs/roadmap.md` holds, Claude archives the change, commits and pushes to `dev`.
