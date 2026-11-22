# Proposal

## Why

The background-removal model sometimes keeps, beside the item, a piece of something else that was in the photo. The author's white top came out with a pink scrap at its right edge. The trim then keeps the scrap inside the picture, so the doll draws it beside the top, and the box around the item grows by the gap between them.

This is not a roadmap step. It came from checking the statistics on a phone, after `recut-item-photos`.

## What Changes

- **A cut-out keeps the item and drops what stands apart from it.**
  - After the model answers, the opaque pixels are grouped into islands, pixels that touch, diagonals included.
  - The largest island is the item. Any island smaller than a quarter of it is made transparent, and then the trim crops to what is left.
  - A pair of shoes is two islands of about one size, so both are kept. A scrap is far smaller than the item, so it goes.
- **It applies to every cut-out,** on the new item form and on "Вирізати фон заново". An item already saved is cleaned by cutting it out again on its card.

Out of scope:

- **Painting out a stray by hand** (an eraser on the picture).
- **A stray that touches the item.** It is part of the same island, and only the model can tell them apart.
- **Very small parts of an item apart from it,** such as a second, much smaller earring. The threshold is a choice, and the form's "Без фону" keeps the original when the cut-out lost something.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-wardrobe`: a cut-out drops the islands much smaller than the item before it is trimmed.

## Impact

- **`apps/web/src/features/wardrobe/photo`:**
  - `dropStrays` in `trim.ts`, beside `opaqueBox`;
  - `cutOut` in `prepare.ts` draws the model's answer onto a canvas, drops the strays, and encodes from the canvas.
- **Docs:** `openspec/config.yaml`.
