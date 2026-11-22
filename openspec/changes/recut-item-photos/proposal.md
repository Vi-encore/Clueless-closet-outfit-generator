# Proposal

## Why

Checking `edit-item-colors` on a phone turned up four problems with how an item looks.

- **Cut-outs keep a margin.** The cut-out of a crop top is 718×488, while the item itself is 718×315. The model leaves specks of alpha 9–13 far from the item, and the trim counts anything above 8 as the item. The doll sizes an item by its image, so the margin makes the item smaller on the doll.
- **A failed cut-out says nothing about why.** In Chrome on the author's phone, a landscape photo fails every time and a portrait one works. The same photos cut out in a desktop browser. The error is swallowed, so there is nothing to go on.
- **An item saved without a cut-out stays without one.** It is drawn beside the doll, not on it, and nothing can change that after saving. The same is true of an item saved with a margin.
- **The mannequin is not always wanted.** With the items on their backdrop, the grey figure behind them is sometimes more noise than help.

This is not a roadmap step. It follows `edit-item-colors`, before step 13.

## What Changes

- **The trim ignores haze.** Alpha up to 64, a quarter of opaque, is not the item, and the trim crops it.
- **A failed cut-out shows its reason.** Under "Фон вирізати не вдалося" the form shows the error's own text, small, as it came.
- **The card can cut the background out again.**
  - The card of one's own item that is not archived offers "Вирізати фон" when there is no cut-out, and "Вирізати фон заново" when there is one.
  - The phone reads the original photo, cuts it out and trims it as for a new item, uploads the result, and sets it as the item's cut-out. The old one is removed by the API, as it already does for a replaced photo.
  - The item's colours are left as they are.
- **The bucket lets a browser read a photo's bytes.** The CORS rules allow `GET` beside `PUT`, so the card can read the original. The phone mode reads through the same-origin `/storage` proxy and never needed it.
- **A photograph can be turned before saving.** A landscape photo of an item lying sideways is saved sideways, and nothing in the picture says which way is up. The form offers "Повернути ↻", a quarter turn clockwise, and the cut-out turns with the original.
- **The mannequin can be hidden.** A checkbox under the doll, "Показати манекен", is ticked by default. Unticked, the items stay where they are on their backdrop and the figure is not drawn. The choice is remembered on the device and applies to every doll, the diary's small ones included.

Out of scope:

- **The empty wardrobe after leaving a card.** The author saw it, but it could not be reproduced yet. It is fixed once the steps are known.
- **Re-reading colours from a new cut-out.**
- **Cutting out on the server.** The project stays free: the device does the work.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-wardrobe`:
  - the trim ignores haze;
  - a failed cut-out says why;
  - the card can cut the background out again.
- `photo-storage`: the CORS rules allow `GET` as well as `PUT`.
- `web-outfits`: the mannequin can be hidden, and the choice is remembered.

## Impact

- **`apps/web`:**
  - `features/wardrobe`: the threshold in `photo/trim.ts`, a failure's reason in the photo state and `photo-step.tsx`, `cutOutAgain` in `photo/prepare.ts`, `replaceCutout` in `wardrobe.api.ts`, and `RecutPhoto` on the card;
  - `features/outfits/doll`: `use-mannequin.ts` remembers the choice, `DollFigure` reads it, and `Doll` gets the checkbox;
  - `uk.ts` gets the words.
- **`apps/api`:** `storage/cors-rules.ts` and its test. After merging, `pnpm --filter @closet/api storage:cors` has to be run once against each bucket.
- **Docs:** `docs/roadmap.md` where it mentions `storage:cors`, and `openspec/config.yaml`.
