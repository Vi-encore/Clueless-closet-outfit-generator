# Proposal

## Why

Step 10's second part. `generateOutfits` exists in `@closet/core` (`add-outfit-generator`), but nothing calls it on a real wardrobe, and an outfit cannot be liked, saved or worn. The roadmap's "done when" needs all four: pick an occasion → get an outfit → "another one" / like / save / "wore it today", and "make an outfit with this item". "Wore it today" is also the groundwork of the statistics and the diary: it writes a `WearLog` and updates the items' `wearCount` and `lastWornAt` together.

## What Changes

- **Tables** `Outfit`, `OutfitItem` and `WearLog` ([data-model.md](../../../docs/data-model.md#outfit-and-outfititem)), with one migration. An outfit records its occasion as a code: occasions are constants in `core` until custom ones arrive.
- **`POST /outfits/generate`** `{ occasion, mustInclude?, seen? }`: the signed-in person's available items go through `generateOutfits`; the outfit is stored, by the author's decision every generated one, and answered with its items, score and breakdown. `seen` holds ids of outfits already shown, for "another one". When no outfit can be made the answer is `{ outfit: null }`, not an error.
- **`GET /outfits/:id`**, **`GET /outfits/saved`** (a page at a time).
- **Like and dislike:** `PUT /outfits/:id/reaction` `{ reaction: 'like' | 'dislike' | null }`.
- **Save:** `PUT /outfits/:id/save` and `DELETE /outfits/:id/save`, both idempotent.
- **"Wore it today":** `POST /outfits/:id/wear` writes a `WearLog` dated today in the person's time zone and, in the same transaction, adds 1 to each item's `wearCount` and sets its `lastWornAt`. By the author's decision a second "wore it" for the same outfit on the same day changes nothing and answers the existing record.
- Every route is closed and reads only the signed-in person's outfits: someone else's id is a 404.

Out of scope:
- **Excluding recently worn items** (author's decision): the novelty component comes with the history it needs; laundry is already left out by its status.
- A diary entry for a combination that was not generated, a photo or note on a `WearLog`, undoing "wore it".
- Custom occasions and the `Occasion` table.
- The screens: `add-outfit-screens`.
- `POST /outfits/score` stays as it is.

## Capabilities

### New Capabilities
- `outfits`: generating outfits from a person's wardrobe, reacting to them, saving them and recording that one was worn.

### Modified Capabilities
- `data-persistence`: stored outfits, their items and wear records, with the rules the database guarantees (one record per outfit per day, everything goes with its owner).

## Impact

- `apps/api/prisma/schema.prisma`, a new migration.
- `apps/api/src/outfits/`: the service, the controller, request schemas and views beside the existing score route.
- `apps/api/test/outfits.db-spec.ts` (new); `schema.db-spec.ts` gains the table rules.
- `docs/data-model.md` (occasion as a code, the unique day), `docs/roadmap.md` and `openspec/config.yaml` after the work.
