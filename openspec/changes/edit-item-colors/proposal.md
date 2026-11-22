# Proposal

## Why

An item's colours are read from the pixels of its photo (`add-item-capture`), and a camera does not always see what a person sees. A white top in a dim room reads as grey. Today the form only lets the person take a colour away, and an item that is already saved cannot have its colours changed at all.

Colours are not decoration: the scorer reads them for colour harmony ([outfit-algorithm.md](../../docs/outfit-algorithm.md)), and since `add-diary-screens` the doll's backdrop is chosen by them. A wrong colour gives a wrong score and a backdrop the item does not show against.

This is not a roadmap step. It came from checking step 12 on a phone, and it is small enough to fit between steps 12 and 13.

## What Changes

- **The new item form lets the person set colours by hand.**
  - Each colour found in the photo can be changed to another family, and it keeps its share.
  - A colour can be added from the families not yet listed.
  - It can still be removed.
- **An item's card lets the person change its colours** in the same way, and save them. With all of them removed, the item has no colours.
- **A colour chosen by hand is drawn as its family's typical colour.** A grey read from the photo, changed to white, becomes white in its hex too, so the scorer and the doll's backdrop see white.

Out of scope:

- **Choosing an exact shade with a colour picker.** The families are the vocabulary, and a typical colour per family is enough for scoring.
- **Editing the other tags on the card** (pattern, seasons and the rest). Colours are the tag a camera gets wrong. The rest were chosen by the person in the first place.
- **Reading colours again from a new photo.**

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-wardrobe`: colours on the new item form can be changed and added, not only removed, and an item's card can change its colours.
- `wardrobe-items`: a `PATCH` with `colors` replaces the item's colours, and an empty list clears them. This is how the API already behaves, but no test says so.

## Impact

- **`packages/core`:** `COLOR_SWATCHES`, a typical hex per colour family, beside the vocabularies.
- **`apps/web`:**
  - `features/wardrobe` gets a colour editor, used by the new item form and the card;
  - `wardrobe.api.ts` gets `setColors(id, colors)`;
  - `uk.ts` gets the words.
- **`apps/api`:** no code change, one test in `test/items.db-spec.ts` or nearby.
- **Docs:** `openspec/config.yaml`.
