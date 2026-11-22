# Tasks

## 1. A tighter trim, and a failure that says why

- [x] 1.1 Claude writes "Haze far from the item is cropped" in `apps/web/src/features/wardrobe/photo/trim.spec.ts`, a test for `failureOf`, and the reason in "A failed cut-out does not stop the item" in `wardrobe.spec.tsx`; verify they fail
- [x] 1.2 Raise `HAZE` to 64. Add `failure` to the `ready` state, keep the error in `usePhoto` and show it in `PhotoStep`. Verify the group's tests and `pnpm test` pass

## 2. The mannequin can be hidden

- [x] 2.1 Claude writes "The mannequin can be hidden" in `features/outfits/doll/doll.spec.tsx`; verify it fails
- [x] 2.2 Add `use-mannequin.ts`, let `DollFigure` leave the silhouette out, and add the checkbox to `Doll`. Verify the group's tests and `pnpm test` pass, and the author looks at a doll without the mannequin

## 3. Cutting out again on the card

- [x] 3.1 Claude writes the `GET` rule in `apps/api/src/storage/cors-rules.spec.ts` (or wherever the rules are tested), and "The background can be cut out again on the card" in `wardrobe.spec.tsx`; verify they fail
- [x] 3.2 Allow `GET` in `cors-rules.ts` and run `storage:cors` against the local bucket. Add `cutOutAgain`, `replaceCutout` and `RecutPhoto` on the card. Verify the group's tests, `pnpm test` and `test:db` pass, and the author cuts out a saved item on a phone, including the landscape one, reading the reason if it fails

## 4. Turning a photograph

- [x] 4.1 Claude writes "A photograph can be turned before saving" in `wardrobe.spec.tsx`; verify it fails
- [x] 4.2 Add `turn(blob, kind)` to `photo/prepare.ts` (a quarter clockwise, encoded again as its kind), `rotate` to `usePhoto`, and the button to `PhotoStep`. Verify the group's tests and `pnpm test` pass, and the author turns a landscape photo on a phone

## 5. Docs

- [ ] 5.1 Describe the change in `openspec/config.yaml`, and that `storage:cors` now allows `GET` where `docs/roadmap.md` mentions the script; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `recut-item-photos` when the author asks, commit and push `dev`.
- If the landscape failure's reason points at something to fix, that is a change of its own.
