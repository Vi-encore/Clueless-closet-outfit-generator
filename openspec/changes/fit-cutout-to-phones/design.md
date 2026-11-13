# Design

## Context

`wardrobe/use-photo.ts` reads the chosen file, calls `cutOut` from `photo/prepare.ts` (which loads `@imgly/background-removal` and its model), and ends in a `ready` state with the original and the cut-out, or `null` when cutting out failed or the `photoCutout` flag is off (`cutoutSkipped`). `prepare.ts` already picks `isnet_quint8` on a coarse pointer, inline (commit `e71bf0d`). The wardrobe tests mock `prepare.ts` entirely, so the picking itself is untested.

A tab killed for memory leaves no event to handle: `pagehide` and `beforeunload` are not dependable on a crash, and nothing in the page survives. Only what was written before the crash is left. See proposal.md for what the phones showed.

## Goals / Non-Goals

**Goals:**
- A phone that cannot cut out costs one lost attempt, not every attempt.
- The person is told, and can choose to try again.
- The model choice is a function a test can call.

**Non-Goals:**
- Removing the background on the server.
- Telling the API or other devices anything.
- Detecting low memory up front. `navigator.deviceMemory` is Chromium-only and coarse, and a guess would turn the cut-out off on phones that manage it.

## Decisions

### 1. A mark in `localStorage`, before and after

The keys are in `photo/photo.constants.ts`:

- `closet:cutout-started`, a timestamp, written right before `cutOut` and removed in its `finally`;
- `closet:cutout-unfit`, `"1"` once this browser is known not to manage.

Helpers in `photo/photo.utils.ts`, each wrapped in `try/catch` so that a refusing storage reads as "nothing remembered":

- `cutoutStarted()` / `cutoutEnded()` write and remove the mark.
- `cutoutUnfit()` answers whether to skip. When it finds a left-over start mark, it turns it into the unfit mark first. That is the moment the crash is noticed.
- `forgetCutoutUnfit()` removes both marks.

*Why `localStorage` and not `sessionStorage`:* Android's Chrome and Samsung Internet may restore a crashed tab as a fresh session. The decision should also outlive closing the tab, since the phone will not get more memory.

*Alternative:* write the mark only on the first attempt per device. That cannot tell a crash from a success.

### 2. Skipping has a reason

`PhotoState`'s `ready` step replaces `cutoutSkipped: boolean` with `skipped: 'switched-off' | 'unfit' | null`:

- **`switched-off`** comes from the deployment's flag, and draws as today: the original and no line.
- **`unfit`** draws the original, the line `uk.newItem.cutoutUnfit`, and a button `uk.newItem.tryCutout`. The button calls `forgetCutoutUnfit()` and asks for the photograph again: it goes back to `none` and the person chooses a photo again. This is the simplest honest behaviour, since the file input cannot be re-run from code on every browser.

### 3. The model as a function

`cutoutModelFor(coarsePointer: boolean)` in `photo.utils.ts` returns `'isnet_quint8'` or `'isnet_fp16'`. `prepare.ts` calls it with `window.matchMedia('(pointer: coarse)').matches`. `photo.spec.ts` tests the function, not `matchMedia`, which jsdom does not implement.

## Risks / Trade-offs

- **[Trade-off]** A crash for another reason in the middle of a cut-out, such as the person closing the tab, switching apps until the OS kills it, or a power cut, also marks the browser unfit. The line and the "try again" button make that cheap to undo.
- **[Risk]** A phone that is unfit for `isnet_quint8` today might manage after a browser update. → "Try again" covers it, and nothing is sent anywhere, so nothing needs undoing elsewhere.
- **[Trade-off]** Samsung Internet users get no cut-out until a server-side removal exists.

## Migration Plan

Nothing to migrate. A browser starts with no marks. Rollback is a revert.
