# Proposal

## Why

The last part of step 10. The generator (`add-outfit-generator`) and the routes that store, like, save and wear outfits (`add-outfits-api`) exist, but nobody can use them yet. The roadmap's "done when" for step 10 is about the screen:
- pick an occasion → get an outfit → "another one" / like / save / "wore it today";
- from an item card — "make an outfit with this item".

The outfit is shown the way [try-on.md](../../../docs/try-on.md#stage-0-2d-doll) describes stage 0: the cut-outs laid over a drawn mannequin, like Cher's screen.

## What Changes

- **A new feature, `features/outfits/`,** with a desktop shortcut "Образи".
  - **`/outfits`:** choose an occasion (kept in `?occasion=`) and get an outfit. "Another one" sends the outfits already shown as `seen`. Like and dislike toggle. Save and unsave. "Вдягнула сьогодні" answers with the date it was recorded for. When nothing can be made, a line says why.
  - **The reason:** the score's breakdown, one line per component. A low total shows "MIS-MATCH", as on Cher's screen.
  - **`/outfits/saved`:** the saved outfits, a page at a time; each opens at `/outfits/:id`.
- **The 2D doll, by the author's decision auto-fit only** — no fitting editor and no `dollFit`:
  - one drawn SVG mannequin with relative anchors (shoulders, waist, hips, ankles, feet);
  - each item's cut-out is placed by its slot from the anchors, keeping its proportions;
  - layers go bottom → top → one-piece → outerwear → shoes;
  - an item without a cut-out is shown beside the doll rather than on it.
- **The cut-out is trimmed at capture:** the transparent margin around the item is cropped before encoding. The image then *is* the item's box, and the doll never has to read pixels from storage. Reading them would need CORS on the bucket for `getImageData`, which MinIO in development does not have. Cut-outs saved before this change are drawn untrimmed, slightly small.
- **"Скласти образ з цією річчю"** on an item's card, for an item in the wardrobe (not archived), opens `/outfits?with=<id>`. The outfit is generated around that item.

Out of scope:
- the fitting editor and `dollFit`;
- a mannequin from measurements or from a photo (step 14);
- saving the doll as a picture;
- a "tuck in" toggle;
- accessories on the doll;
- the diary.

## Capabilities

### New Capabilities
- `web-outfits`: the screens that generate, react to, save and wear outfits, and the 2D doll that shows them.

### Modified Capabilities
- `web-wardrobe`: a card offers an outfit around its item, and a cut-out is trimmed to the item before saving.

## Impact

- `apps/web/src/features/outfits/` (new), `app/app.tsx` (routes), `features/desktop/desktop.tsx` (shortcut), `shared/i18n/uk.ts`.
- `features/wardrobe/item-card.tsx` (the button), `features/wardrobe/photo/` (trimming), `features/wardrobe/index.ts` (exports what outfits read: `Item`, `itemKeys`).
- Tests: `features/outfits/outfits.spec.tsx` with MSW, unit tests for auto-fit and trimming, `test/api-fixtures.ts`.
- `docs/try-on.md` (auto-fit only for now, trimmed cut-outs), `docs/roadmap.md`, `openspec/config.yaml`.
