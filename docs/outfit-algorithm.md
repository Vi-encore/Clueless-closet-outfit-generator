# Outfit matching algorithm

## How the inspiration video does it (reference)

1. All "top × bottom" pairs — the Cartesian product of the wardrobe.
2. Hard filters per occasion: a party top, sweatpants or very short shorts don't make it into work outfits.
3. Scoring the rest: do the colors go together, are the silhouettes balanced, do the styles and fabrics match.
4. Picking: take the 14 best, add random noise ±2.5 to each score, keep 7, and pick one of them by weighted random (weight = `max(1, score − min + 1)²`). So an outfit is always good, but not the same every time.

## Our approach

### Outfit slots

An outfit is built from one of the templates:
- **top + bottom**
- **one-piece** (dress, jumpsuit)

Plus optional layers: outerwear (by weather / occasion), shoes, an accessory.

Layers are added greedily: first a base is picked, then the best shoes that pass the hard filters, then the best outerwear if it does not lower the score. That way the number of combinations doesn't grow as a product of all categories. Accessories and weather come later.

### Steps

1. **Candidates.** The user's items with status `available` (not in the laundry, not archived) without an active loan, that fit the occasion. Later — also items lent to this user.
2. **Combinations** by template.
3. **Hard filters** — drop the combination if:
   - an item has this occasion in `avoidOccasions`;
   - the items' formality differs by more than 2;
   - (later) an item doesn't fit the weather.
4. **Scoring** — a weighted sum of components:

   | Component | What it checks |
   |---|---|
   | Color | Neutrals (black, white, grey, beige, denim) go with everything; the rest by the color wheel; at most one bright accent and one print |
   | Silhouette | Fitted + loose is good; two loose pieces are penalized; crop top + high rise gets a bonus |
   | Formality | How close the outfit is to the occasion's target formality |
   | Style | Shared style tags |
   | Fabric / season | Fabric compatibility (satin + chunky knit is penalized), warmth (`warmth`) and seasons (`seasons`) |
   | Novelty | Penalty for items / outfits worn recently |
   | Preferences | Bonus or penalty for likes / dislikes of the same or similar pairs |

   Empty fields aren't penalized: a component that lacks data scores 0.

5. **Picking.** Top-K + noise + weighted random, as in the video. "Another one" excludes outfits already shown. Our totals lie around −2…2, not around 10 as in the video, so the noise starts at ±0.25, not ±2.5; it is the first knob to tune.
6. **Explanation.** Every outfit stores a `breakdown` — per-component scores. That lets us show "why this outfit" and makes tuning the weights easy.

### Occasions are data, not code

For now the occasions are constants in `core` (`SYSTEM_OCCASIONS`: a target formality and the weights that differ from 1, one per code of `OCCASIONS`). Later an occasion (`Occasion`) is stored in the database, so custom ones can be added ("airport", "job interview"). Every occasion has:
- a target formality (1–5);
- forbidden / required properties (e.g. "work" — no sporty style and no mini);
- scoring component weights (for "party" color and style matter more, for "airport" — comfort).

## Data

The item fields the score is computed from, as well as `Outfit`, `WearLog` and `Occasion`, are described in [data-model.md](data-model.md).

## Where it runs

The algorithm lives in `packages/core` — pure TypeScript with no dependency on Nest or the database. The API (`POST /outfits/generate`) gathers the inputs (available items, history, reactions, occasion) and calls `generateOutfits()` from `core`. More in [architecture.md](architecture.md#the-algorithm-runs-on-the-server).

## Generator interface

The generator is a pure function: it gets everything it needs as arguments and reads nothing from the database itself (`packages/core/src/generator/`):

```ts
generateOutfits(input: {
  items: readonly OutfitItem[];            // available items (may include "virtual" ones that aren't in the database)
  occasion: Occasion;                      // e.g. SYSTEM_OCCASIONS.work
  mustInclude?: readonly string[];         // the outfit must contain these items, of any slot
  exclude?: readonly string[];             // never use these items (in the laundry, worn yesterday...)
  seen?: readonly (readonly string[])[];   // item ids of outfits already shown, for "another one"
  limit?: number;                          // how many distinct outfits, 1 by default
  random?: () => number;                   // Math.random by default; tests pass a seeded one
  tuning?: Tuning;                         // DEFAULT_TUNING by default
}): GeneratedOutfit[]                      // { itemIds, score: { total, breakdown } }
```

No outfit is an answer, not an error: with no base, or chosen items that cannot share an outfit, the list is empty. History and reactions arrive with the novelty and preference components.

Every threshold and score of the filters, the components and the picking lives in one `Tuning` object (`DEFAULT_TUNING` in `scoring/tuning.ts`). `checkHardFilters`, `scoreOutfit` and the generator take it as an optional last argument, so two tunings can be compared on the same wardrobe.

Built on top of it:
- **"Outfit around this item"** — `mustInclude: [itemId]` (step 10).
- **Pre-purchase check** — a virtual item in `items` + `mustInclude` ([features.md](features.md#pre-purchase-check)).
- **Suitcase** — the generator on a restricted set of items ([features.md](features.md#travel-suitcase)).

## Learning from feedback (later)

First — simple adjustments: liking a pair gives it a bonus, disliking — a penalty. Later the component weights can adapt to a specific person. No machine learning is needed for that.
