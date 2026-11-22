# Tasks

## 1. The progress bar

- [x] 1.1 Claude writes unit tests for `cutoutProgress` and `fractionOf` (files summed, a new file joining, the compute steps) in `apps/web/src/features/wardrobe/photo/photo.spec.ts`, and "Cutting out shows how far it has got" in `wardrobe.spec.tsx`; verify they fail
- [x] 1.2 Add `cutoutProgress`, `fractionOf` and `CutoutProgressBar`. Keep the progress in `usePhoto` and `RecutPhoto`, and let `cutOutAgain` pass the callback on. Verify the group's tests, `pnpm test` and lint pass, and the author watches the bar on a phone, the first time included (with the site's data cleared, the model downloads again)

## 2. Docs

- [x] 2.1 Describe the change in `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `show-cutout-progress` when the author asks, commit and push `dev`.
