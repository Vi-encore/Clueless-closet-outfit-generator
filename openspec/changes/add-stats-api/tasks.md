# Tasks

## 1. Counting the wardrobe

- [ ] 1.1 Claude writes unit tests for the colour fold and the cost per wear in cents in `apps/api/src/stats/stats.utils.spec.ts`, and "The wardrobe is counted", "The most worn items are listed" and "Cost per wear is worked out" in `apps/api/test/stats.db-spec.ts`; verify they fail
- [ ] 1.2 Add the `stats` module with `GET /stats` (`groupBy`, the colour fold, the most worn, cost per wear) and register it. Verify the group's tests, `test:db`, `pnpm test` and the conventions pass

## 2. Items not worn for a long time

- [ ] 2.1 Claude writes "Items not worn for a long time are found" in `stats.db-spec.ts`, with a fixed clock, its pages and a refused cursor included, and unit tests for encoding and decoding the cursor in `stats.utils.spec.ts`; verify they fail
- [ ] 2.2 Add `GET /stats/unworn` with the `days` and paging query, the keyset query through `Prisma.sql`, the cursor, and the `CLOCK` provider. Verify the group's tests, `test:db`, `pnpm test` and the OpenAPI document (both routes listed) pass

## 3. Docs

- [ ] 3.1 Describe the routes in `docs/data-model.md` beside the fields they read, and in `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `add-stats-api` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`; then plan `add-stats-screens`, with bars and pie charts drawn in CSS (`conic-gradient`) in the 98.css style, and no chart library.
