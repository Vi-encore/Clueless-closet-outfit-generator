# Tasks

## 1. The screen, the numbers and the pie charts

- [x] 1.1 Claude writes unit tests for `sectorsOf`, `pieGradient`, `daysFrom` and `pluralUk` in `stats.utils.spec.ts` and `shared/i18n`, and "Statistics are reached from the desktop", "The wardrobe is shown in numbers" and "Category and colour are pie charts" in `apps/web/src/features/stats/stats.spec.tsx`; verify they fail
- [x] 1.2 Add `features/stats` with the screen, the numbers and `PieChart`, the `/stats` route, the desktop shortcut and the words. Verify the group's tests, `pnpm test`, the conventions and lint pass, and the author looks at the charts in a browser

## 2. The most worn and cost per wear

- [x] 2.1 Claude writes "The most worn and the cost per wear are listed" in `stats.spec.tsx`; verify it fails
- [x] 2.2 Move the segmented bar to `shared/styles/retro.css`, and add `WornBars` and `CostPerWear`. Verify the group's tests and `pnpm test` pass

## 3. Items not worn for a long time

- [x] 3.1 Claude writes "Items not worn for a long time are listed" and "An unworn item can be archived from the list" in `stats.spec.tsx`; verify they fail
- [x] 3.2 Export `archiveItem`, `itemKeys` and `ItemTile` from `features/wardrobe`. Add the days choice, `UnwornList` with its pages, and `UnwornRow` with its archive step. Verify the group's tests and `pnpm test` pass, and the author archives an item from the list on a phone

## 4. Docs

- [x] 4.1 Tick step 13 in `docs/roadmap.md` and describe the screens in `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `add-stats-screens` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`; then open a pull request to `main` for steps 12 and 13.
