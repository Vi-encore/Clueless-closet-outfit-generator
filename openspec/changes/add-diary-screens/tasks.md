# Tasks

## 1. The month

- [x] 1.1 Claude writes unit tests for `weeksOf`, `shiftMonth`, `monthOf`, `currentMonth` and `isMonth` in `apps/web/src/features/diary/diary.utils.spec.ts`, and "The diary is reached from the desktop", "A month is a calendar of what was worn" and "Months are turned" in `diary.spec.tsx`; verify they fail
- [x] 1.2 Split `DollFigure` out of `Doll` and export it from `features/outfits`. Add `features/diary` with the month screen, the grid, the cells, the API, the queries and the keys. Add the `/diary` route, the desktop shortcut and the words in `uk.ts`. Verify the group's tests, `pnpm test`, the conventions and lint pass, and the author looks at the calendar in a browser

## 2. A day

- [x] 2.1 Claude writes "A day shows what was worn" and "A day takes a note and a photo" in `diary.spec.tsx`; verify they fail
- [x] 2.2 Export `readPhoto` from `features/wardrobe`. Add the `/diary/:date` route, the day screen, the entry editor, `use-day-photo.ts` and the upload. Saving writes the answer into the month's cache. Verify the group's tests and `pnpm test` pass, and the author adds a note and a photo in a browser

## 3. Memories and the way in

- [x] 3.1 Claude writes "Memories are on the desktop" in `diary.spec.tsx`, and the link of "Wore it today" in `features/outfits/outfits.spec.tsx`; verify they fail
- [x] 3.2 Add `Memories` to the desktop, and the link to the day in `OutfitActions`. Verify the group's tests and `pnpm test` pass, and the author sees a memory on the desktop

## 4. Docs and the phone

- [ ] 4.1 Tick step 12 in `docs/roadmap.md`, and describe the diary's screens in `openspec/config.yaml`. Verify `openspec validate --all` passes
- [ ] 4.2 The author checks the diary on phones in the phone mode, including a portrait photo from an iPhone, which must stand the right way up

## Workflow follow-up

- Archive `add-diary-screens` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`, then open a pull request to `main` for step 12.
