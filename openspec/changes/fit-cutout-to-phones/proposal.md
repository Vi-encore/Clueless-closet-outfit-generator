# Proposal

## Why

`reach-from-a-phone` took background removal to real phones for the first time, and found what the roadmap had feared ([roadmap: step 11](../../../docs/roadmap.md#step-11--pwa-and-phone-test)):

- **Android Chrome** reloaded the tab with `isnet_fp16`, out of memory.
- **`isnet_quint8`** cut cleanly on Android Chrome and on an iPhone. It now runs wherever the pointer is coarse (commit `e71bf0d`), but that choice is in no spec and no test.
- **Samsung Internet** reloads the tab even with `isnet_quint8`.

A tab that dies takes the form with it, and the browser gives the page no chance to react. So a person on such a phone chooses a photograph, loses the page, and on trying again loses it again, with no item saved and nothing said.

## What Changes

- **The model follows the device, now in the spec and tested:** `isnet_quint8` where the pointer is coarse (a phone or a tablet), `isnet_fp16` elsewhere.
- **A device that could not finish a cut-out stops trying.**
  - The client writes a mark in the browser's storage before cutting out, and removes it when the cut-out ends, whether it succeeded or failed. A mark still there when the next photograph is chosen means the tab died in the middle of one.
  - From then on, this browser skips cutting out. The item is saved with its original photograph and a line saying so.
  - The line offers to try again, which forgets the decision.
  - Nothing is sent to the API, and other devices are not affected.
- **When the browser's storage is unavailable,** as in a private window, nothing is remembered and cutting out is attempted as today.

Out of scope:

- **Removing the background on the server,** the fallback named in [mobile.md](../../../docs/mobile.md). That is for when enough phones cannot cut out to be worth a server-side model.
- **Guessing the device from its user agent.** Only the observed crash decides.
- **Feature flags per device.** `photoCutout` stays a deployment-wide switch (ADR-0020).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-wardrobe`: adds the model choice by device, and the requirement that a device which could not cut out stops trying.

## Impact

- **`apps/web/src/features/wardrobe/photo/`:**
  - `photo.utils.ts` with `cutoutModelFor(coarsePointer)` and the mark's read, write and clear, each wrapped against unavailable storage;
  - `photo.constants.ts` with the storage keys;
  - `prepare.ts` asks for the model through the helper.
- **`wardrobe/use-photo.ts`** checks the mark before cutting out, sets it around the cut-out, and reports why one was skipped.
- **`PhotoState`'s `cutoutSkipped`** becomes a reason: switched off by the deployment, or not fit on this device.
- **`photo-step.tsx`** shows a line and a "try again" button when the device is not fit. New words go in `uk.ts`.
- **No API change.**
- **Docs:** `docs/mobile.md` and `docs/roadmap.md`.
