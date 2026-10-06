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

MVP: only the base templates. Layers are added "greedily" later: first a base outfit is picked, then the best shoes / outerwear for it. That way the number of combinations doesn't grow as a product of all categories.

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

5. **Picking.** Top-K + noise + weighted random, as in the video. "Another one" excludes outfits already shown.
6. **Explanation.** Every outfit stores a `breakdown` — per-component scores. That lets us show "why this outfit" and makes tuning the weights easy.

### Occasions are data, not code

An occasion (`Occasion`) is stored in the database, so custom ones can be added ("airport", "job interview"). Every occasion has:
- a target formality (1–5);
- forbidden / required properties (e.g. "work" — no sporty style and no mini);
- scoring component weights (for "party" color and style matter more, for "airport" — comfort).

## Data

The item fields the score is computed from, as well as `Outfit`, `WearLog` and `Occasion`, are described in [data-model.md](data-model.md).

## Where it runs

The algorithm lives in `packages/core` — pure TypeScript with no dependency on Nest or the database. The API (`POST /outfits/generate`) gathers the inputs (available items, history, reactions, occasion) and calls `core.generateOutfit()`. More in [architecture.md](architecture.md#the-algorithm-runs-on-the-server).

## Generator interface

The generator is a pure function: it gets everything it needs as arguments and reads nothing from the database itself. Approximate shape (names are a guide, not final code):

```ts
generateOutfits(input: {
  items: Item[];            // available items (may include "virtual" ones that aren't in the database)
  occasion: Occasion;
  history?: WearHistory;    // for the novelty penalty
  reactions?: Reactions;    // likes / dislikes
  mustInclude?: ItemId[];   // the outfit must contain these items
  exclude?: ItemId[];       // don't use these items (already shown, in the laundry…)
  limit?: number;
}): ScoredOutfit[]
```

Built on top of it:
- **"Outfit around this item"** — `mustInclude: [itemId]` (step 10).
- **Pre-purchase check** — a virtual item in `items` + `mustInclude` ([features.md](features.md#pre-purchase-check)).
- **Suitcase** — the generator on a restricted set of items ([features.md](features.md#travel-suitcase)).

## Learning from feedback (later)

First — simple adjustments: liking a pair gives it a bonus, disliking — a penalty. Later the component weights can adapt to a specific person. No machine learning is needed for that.
