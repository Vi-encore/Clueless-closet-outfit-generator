# Proposal

## Why

Cutting a background out takes tens of seconds the first time on a phone, while the model downloads, and a few seconds after that. Today the form says only "Вирізаємо фон… Уперше це довго" and the card says "Вирізаю фон…". Nothing moves, so a person cannot tell a slow download from a stuck page. The author asked for a progress bar while checking `recut-item-photos` on a phone.

The background-removal library already reports progress, and `cutOut` already accepts a callback for it, but nothing passes one. It reports two phases:

- **`fetch:<file>`** with bytes done and total, for each file of the model;
- **`compute:decode` → `inference` → `mask` → `encode`**, as steps 0 to 4 of 4.

This is not a roadmap step. It follows `recut-item-photos`, before step 13.

## What Changes

- **A progress bar while cutting out,** in the Windows 98 style 98.css already draws, both on the new item form and on the card.
  - **While the model downloads:** "Завантажую модель…" and the share of bytes received across every file seen so far.
  - **While the photo is cut out:** "Вирізаю фон…" and the step it is on, out of four.
- **The bar is a `progressbar`** with its value, so a screen reader hears it too.

Out of scope:

- **A time estimate.** The bytes say how far the download is, not how fast the phone will cut.
- **Progress for reading or turning a photo.** Each takes well under a second.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-wardrobe`: cutting out shows how far it has got, on the form and on the card.

## Impact

- **`apps/web/src/features/wardrobe`:**
  - `cutoutProgress` (a pure fold of the library's reports into a phase and a fraction) in `photo/photo.utils.ts`;
  - a `CutoutProgressBar` component;
  - `usePhoto` and `RecutPhoto` pass a callback and keep the latest report;
  - `cutOutAgain` takes the callback through.
- **`uk.ts`** gets the words.
- **Docs:** `openspec/config.yaml`.
