# Tasks

## 1. Dropping strays

- [x] 1.1 Claude writes "A cut-out keeps the item and drops what stands apart" in `apps/web/src/features/wardrobe/photo/trim.spec.ts`; verify it fails
- [x] 1.2 Add `dropStrays` to `trim.ts`, and let `cutOut` clean the model's answer on a canvas before trimming and encoding it. Verify the group's tests and `pnpm test` pass, check `dropStrays` in a real browser on a picture with a scrap, and the author cuts the white top out again on a phone

## 2. Docs

- [x] 2.1 Describe the change in `openspec/config.yaml`; verify `openspec validate --all` passes

## Workflow follow-up

- Archive `drop-cutout-strays` when the author asks, commit and push `dev`.
