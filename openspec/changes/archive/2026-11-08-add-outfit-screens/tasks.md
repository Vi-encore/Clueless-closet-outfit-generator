# Tasks

## 1. Trimmed cut-outs

- [x] 1.1 Claude writes the unit tests for "A cut-out is trimmed to the item" (`opaqueBox`) and for `encode` with a source rectangle; verify they fail
- [x] 1.2 Add `photo/trim.ts`, the source rectangle in `encode`, and trimming in `cutOut`; verify the wardrobe tests still pass

## 2. The doll

- [x] 2.1 Claude writes `auto-fit.spec.ts` for "The doll wears the outfit" (placement by slot, width without height, layers) and a render test for an item without a cut-out; verify they fail
- [x] 2.2 Add `doll/mannequin.ts`, `doll/auto-fit.ts` and the `Doll` component; verify the tests pass

## 3. Generating and the panel

- [x] 3.1 Claude writes `outfits.spec.tsx` for "The outfits are reached from the desktop", "An outfit is made for a chosen occasion", "An outfit says why it was chosen", "Another one is another outfit" and "An outfit can be liked, saved and worn", with MSW handlers and fixtures; verify they fail
- [x] 3.2 Add `outfits.api.ts`, `outfits.queries.ts`, `OutfitPanel`, the generation screen, the routes, the desktop shortcut and the `uk.outfits` words; verify the tests pass

## 4. Around an item and saved outfits

- [x] 4.1 Claude writes the tests for "An outfit can be made around an item" and "Saved outfits can be found again"; verify they fail
- [x] 4.2 Add the card's button, `?with=`, `/outfits/saved` and `/outfits/:id`; verify `pnpm --filter @closet/web test`, typecheck, lint and the conventions test pass
- [x] 4.3 The author tries it in the browser on a real wardrobe: an outfit for an occasion, another one, like, save, wore it, an outfit from a card, the saved list; the auto-fit factors are tuned by eye if the doll looks wrong

## 5. Docs

- [x] 5.1 Note in `docs/try-on.md` that stage 0 is auto-fit only for now and that cut-outs are trimmed at capture; tick step 10 in `docs/roadmap.md`; update `openspec/config.yaml`'s context
