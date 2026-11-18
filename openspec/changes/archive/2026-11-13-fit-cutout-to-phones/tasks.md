# Tasks

## 1. The model and the marks

- [x] 1.1 Claude writes "The cut-out model follows the device" against `cutoutModelFor` in `photo/photo.spec.ts`, and the four scenarios of "A device that could not cut out stops trying" in `wardrobe.spec.tsx` (a left-over start mark in `localStorage`, "try again", a cut-out that ends or fails, and a storage that throws); verify they fail
- [x] 1.2 Add `cutoutModelFor` and the mark helpers to `photo/photo.utils.ts` and the keys to `photo.constants.ts`; use the model helper in `prepare.ts`; in `use-photo.ts` check `cutoutUnfit()` before cutting out and set and clear the mark around `cutOut`; replace `cutoutSkipped` with `skipped`, and draw the line and the "try again" button in `photo-step.tsx` with new words in `uk.ts`; verify the web suite, typecheck, lint and conventions pass

## 2. Docs and a look on phones

- [x] 2.1 Record the decision in `docs/mobile.md`, next to the iPhone checklist and the server-side fallback, and update step 11's findings in `docs/roadmap.md`; verify `openspec validate --all` passes
- [x] 2.2 Through the tunnel: on Samsung Internet, choose a photograph (the tab dies), reopen, and choose one again: the item is saved with its original and the line is shown; "try again" tries again; on Android Chrome and the iPhone nothing changes; the author has a look

## Workflow follow-up

- Archive `fit-cutout-to-phones` when the author asks, commit and push `dev`.
