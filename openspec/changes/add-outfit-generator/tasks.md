# Tasks

## 1. Tuning and occasions

- [x] 1.1 Claude writes the tests for "Scoring is tuned in one place" and "Every occasion has a target and weights"; verify they fail
- [x] 1.2 Add `scoring/tuning.ts` and pass `tuning` through `checkHardFilters`, `scoreColor`, `scoreFormality` and `scoreOutfit`; verify the new tests and every existing scoring test pass unchanged
- [x] 1.3 Add `scoring/occasions.ts` with `SYSTEM_OCCASIONS`; verify its tests pass

## 2. Bases, filters and picking

- [x] 2.1 Claude writes the tests for "An outfit has a base", "An outfit that breaks a hard filter is never offered" (its base scenario) and "A good outfit is picked, not always the same one", with a seeded random source; verify they fail
- [x] 2.2 Add `generator/bases.ts` and `generator/pick.ts`, and `generateOutfits` without layers; verify the group's tests pass

## 3. Layers, chosen items and explanations

- [x] 3.1 Claude writes the tests for "Shoes and outerwear are added to the base", the shoes scenario of the hard filter requirement, "An outfit is built around chosen items", "Items and outfits can be kept out" and "An outfit says why it was chosen"; verify they fail
- [x] 3.2 Add `generator/layers.ts`, `mustInclude`, `exclude` and `seen`; verify `pnpm --filter @closet/core test` passes and the package builds

## 4. Docs

- [x] 4.1 Replace the approximate signature in `docs/outfit-algorithm.md` with the real one, note the tuning object and the system occasions, name step 10's three changes in `docs/roadmap.md`, and update `openspec/config.yaml`'s context
