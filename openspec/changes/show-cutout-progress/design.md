# Design

## Context

- **What the library reports.** `@imgly/background-removal` calls `progress(key, current, total)`:
  - `fetch:<resource>` with bytes, repeatedly, for each file of the model;
  - then `compute:decode` 0/4, `compute:inference` 1/4, `compute:mask` 2/4, `compute:encode` 3/4 and 4/4.
- **Where the callback goes.** `cutOut(image, progress?)` in `photo/prepare.ts` passes it on. `CutOutProgress` is in `photo/photo.interfaces.ts`. `usePhoto` and `cutOutAgain` call `cutOut` without one.
- **The look.** 98.css draws `.progress-indicator` with a `.progress-indicator-bar`, and `.segmented` gives the blue blocks of Windows 98.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One pure function turns reports into what is shown, and it is unit-tested.
- The form and the card draw the same bar.

**Non-Goals:**
- Smooth animation between reports, and an estimate of time left.

## Decisions

### 1. A fold, not a mapping of each report

`cutoutProgress(state, key, current, total): CutoutProgress` in `photo/photo.utils.ts`.

- **The state** is `{ phase: 'fetch' | 'compute', files: Record<string, { current, total }>, step }`.
- **A `fetch:` report** updates its file. The fraction is the sum of `current` over the sum of `total`, across the files seen so far.
- **A `compute:` report** switches the phase and keeps `current / total` as the step.
- **`fractionOf(state)`** answers 0–1 for the bar.

*Why the files are summed:* the model comes in several files, each reporting from 0 to its own size. One file's share alone would run to 100% and drop back for the next.

*Known limit:* a file not yet reported is not in the total, so the bar can move back a little when a new one starts. The files start almost together, so it is small. A fixed list of file sizes would go stale with the next version of the library.

### 2. The bar

`cutout-progress-bar.tsx` takes `{ progress }`.

- It draws the phase's words from `uk.newItem.downloadingModel` or `uk.newItem.cuttingStep`, then a native `<progress max={100} value={percent} aria-label={…}>`. The linter prefers the element to a `div` with `role="progressbar"`, and it is one to a screen reader without any ARIA. Its Windows 98 look is in `wardrobe.css`: 98.css's sunken well, and the navy blocks of `.progress-indicator.segmented` drawn on `::-webkit-progress-value` and `::-moz-progress-bar`.
- The percent is rounded.
- Before the first report it shows "Вирізаю фон…" at 0.

### 3. Who keeps the state

- **`usePhoto`** keeps `progress` beside `photo`. It resets it when a photo is chosen and passes `(key, current, total) => setProgress((state) => cutoutProgress(state, key, current, total))` to `cutOut`. It ignores reports from a photo that has since been replaced, with the same `attempt` guard.
- **`cutOutAgain(photoUrl, progress?)`** passes the callback on.
- **`RecutPhoto`** keeps its own `progress` and shows the bar while the mutation is pending, in place of the button's "Вирізаю фон…".

### Pitfalls

- **Many reports per second.** Fetch reports can come at that rate. React batches the `setState` calls, and the bar's width changes only when the rounded percent does. That is fine for one bar.
- **Tests.** The mocked `cutOut` and `cutOutAgain` call the callback they are given, then hang on a promise the test never resolves, so the bar can be read in its middle.

## Risks / Trade-offs

- **[Trade-off]** The compute phase moves in quarters, because that is all the library says. Inference is most of the time, so the bar sits at 25% for a while.

## Migration Plan

Client only. Rollback is a revert.
