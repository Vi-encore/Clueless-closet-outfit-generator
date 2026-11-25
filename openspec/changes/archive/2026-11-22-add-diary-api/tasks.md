# Tasks

## 1. Dates and keys

- [x] 1.1 Claude writes unit tests for `monthRange` and `memoryDates` (the month, a year and a month ago, 31 March, 29 February) in `apps/api/src/diary/diary.utils.spec.ts`, and "A key belongs to the folder it was issued for" (the item side) in `apps/api/test/photos.db-spec.ts`; verify they fail
- [x] 1.2 Add `diary.utils.ts` with the two functions, and the folder to `keyFor` and `ownerOf` (items pass `'items'`); verify the group's tests and the whole `test:db` pass

## 2. Writing and reading the diary

- [x] 2.1 Claude writes "A worn day takes a note and a photo", "A diary photo is uploaded like an item's", "A month of the diary is read in date order" and "Memories are of the same day a year and a month ago" (with a fixed clock), and the diary side of the folder requirement, in `apps/api/test/diary.db-spec.ts`; verify they fail
- [x] 2.2 Add the `diary` module (controller, service with the `CLOCK` provider, requests, interfaces, constants), export `OutfitsService.describe`, and register the module; verify the group's tests, `test:db`, `pnpm test`, the conventions and the OpenAPI document (the four routes listed) pass

## 3. Docs

- [x] 3.1 Describe the diary's routes and the two key folders in `docs/data-model.md` (WearLog) and `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `add-diary-api` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`; then plan `add-diary-screens`.
