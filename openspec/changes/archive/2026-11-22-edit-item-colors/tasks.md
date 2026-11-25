# Tasks

## 1. Colours by hand on the new item form

- [x] 1.1 Claude writes unit tests for `withFamily`, `withAdded` and `withoutColor` in `apps/web/src/features/wardrobe/wardrobe.utils.spec.ts`, and the three new scenarios of "Colors are offered from the photograph" in `wardrobe.spec.tsx`; verify they fail
- [x] 1.2 Add `COLOR_SWATCHES` and `LEAST_COLOR_SHARE` to `packages/core/src/taxonomy/taxonomy.constants.ts`, and use the share in `colors-from-pixels.ts`. Add the three edits and `ColorEditor`, put it in the new item form in place of `ColorList`, and delete `ColorList`. Verify the group's tests, `pnpm test`, the conventions and lint pass, and the author changes a colour on a new item in a browser

## 2. Colours on the card

- [x] 2.1 Claude writes "Colours are replaced" and "Colours are cleared" in `apps/api/test/items.db-spec.ts` (they may pass at once: they state what the API already does), and "An item's colours can be changed on its card" in `wardrobe.spec.tsx`; verify the client's fail
- [x] 2.2 Add `setColors` to `wardrobe.api.ts` and `ItemColors` to the card. Verify the group's tests, `test:db` and `pnpm test` pass, and the author turns a grey top white on a phone and sees the doll's backdrop follow

## 3. Docs

- [x] 3.1 Describe the change in `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `edit-item-colors` when the author asks, commit and push `dev`.
