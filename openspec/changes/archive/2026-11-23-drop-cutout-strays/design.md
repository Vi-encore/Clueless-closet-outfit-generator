# Design

## Context

- **What `cutOut` does now** (`features/wardrobe/photo/prepare.ts`):
  1. encodes the photo at the cut-out's size;
  2. runs `removeBackground`;
  3. reads the answer into an `ImageBitmap`;
  4. finds the box of its opaque pixels (`opaqueBox` in `trim.ts`, alpha above `HAZE` = 64);
  5. encodes that box with `encode(image, 'cutout', canvas, box)`.
- **Size.** A cut-out is at most 1024 px on its longer side (`LONGEST.cutout`), so at most about a million pixels.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One pure function on RGBA pixels, unit-tested like `opaqueBox`.
- A cost of a few tens of milliseconds on a phone, next to seconds of model time.

**Non-Goals:**
- Telling a stray that touches the item from the item.

## Decisions

### 1. `dropStrays(rgba, width, height, threshold = HAZE, keep = 0.25)` in `trim.ts`

`dropStrays` changes `rgba` in place and answers how many islands it dropped.

1. **Find the islands.** Label every pixel with alpha above `threshold` by island, with an iterative flood fill over 8 neighbours. A `Int32Array` of labels and an explicit stack keep it fast and free of recursion limits. Count each island's pixels.
2. **Pick what to keep.** The largest island and every island of at least `keep` times its size are kept.
3. **Drop the rest.** Every other pixel above the threshold has its alpha set to 0. Pixels at or below the threshold are left alone: they are haze, and the trim already ignores them.

*Why 8 neighbours:* straps, laces and thin chains often meet the body of an item only corner to corner. With 4 neighbours they would be islands of their own, and small ones, so they would be dropped.

*Why a quarter:* a pair of shoes or earrings is two islands of about one size, near 1. The scrap seen was well under a tenth. A quarter leaves room on both sides. It is a parameter, so a test can state it.

*Alternative:* keep only the largest island. That loses one shoe of every pair.

### 2. `cutOut` cleans before it trims

The model's answer is drawn onto a canvas once (`itemBox` already does this to read pixels). Then:

1. `getImageData`;
2. `dropStrays`;
3. `putImageData`;
4. `opaqueBox` on the same pixels;
5. `encode(canvas, 'cutout', undefined, box)`. A canvas is a `CanvasImageSource` with a width and a height, which is all `encode` needs.

`itemBox` becomes `cleanedItem(image): { canvas, box } | null`, private to `prepare.ts`.

*Pitfall:* `getImageData` and `putImageData` work on unpremultiplied RGBA. Setting alpha to 0 leaves the colour channels, which an encoder may keep. That is harmless, since nothing draws a fully transparent pixel.

## Risks / Trade-offs

- **[Trade-off]** A real part of an item smaller than a quarter of its main part and not touching it is dropped, for example a separate belt laid beside a dress. "Без фону" keeps the original, and the card can cut out again.
- **[Risk]** A flood fill over a million pixels on an old phone. It is linear, with one array of labels and one stack. If it ever shows, the mask can be labelled at half size and scaled back.

## Migration Plan

Client only. An item saved before is cleaned by cutting it out again on its card. Rollback is a revert.
