# Proposal

## Why

Step 10 of the [roadmap](../../../docs/roadmap.md#step-10--outfit-generator) is the generator: pick an occasion, get an outfit. `@closet/core` can score an outfit it is handed (`checkHardFilters`, `scoreOutfit`) but cannot make one. The algorithm is described in [outfit-algorithm.md](../../../docs/outfit-algorithm.md): combinations by template, hard filters, a weighted score, then top-K with noise and a weighted random pick, so that an outfit is always good but not always the same.

Step 10 is split in three, by the author's decision: this change is the generator as a pure function in `core`; `add-outfits-api` stores outfits and wearing them and serves `POST /outfits/generate`; `add-outfit-screens` is the generation screen, the 2D doll and "make an outfit with this item".

## What Changes

- **`scoring/tuning.ts`:** every threshold and score now inside `color.ts`, `formality.ts` and `filters.ts` gathered into one `Tuning` object with today's values as defaults, optionally passed to `scoreOutfit` and `checkHardFilters`, so the numbers can be tuned on real photos and compared. Behaviour with the defaults is unchanged.
- **System occasions in `core`:** each code of `OCCASIONS` with its target formality and component weights, beside the vocabulary. By the author's decision they are constants, not a table; a table arrives with custom occasions.
- **`generateOutfits(input)`**, a pure function:
  - a **base** of top + bottom or a one-piece, from the items it is given;
  - hard filters, then the weighted score;
  - **picking**: the best K, noise on each score, then a weighted random choice, with the random source passed in so tests are repeatable;
  - **layers added greedily** to each picked base, by the author's decision: the best-scoring shoes when there are any, and outerwear when it does not lower the score;
  - **`mustInclude`** (the outfit contains these items), **`exclude`** (never these items) and **`seen`** (not an outfit already shown, for "another one");
  - each outfit comes with its items' ids and its score and breakdown, so the reason can be shown.
- **No outfit is an answer, not an error:** a wardrobe with no base, or a `mustInclude` that cannot be satisfied, returns an empty list.

Out of scope:
- **New score components** (silhouette, style, fabric and season, novelty, preferences). The generator takes whatever `COMPONENTS` holds; adding components is tuning work once real outfits can be looked at.
- **Accessories**, weather and the history of what was worn; the generator takes `exclude` so the API can keep worn or laundered items out.
- **Storage, routes and screens**, which are the next two changes.

## Capabilities

### New Capabilities
- `outfit-generation`: making outfits from a wardrobe for an occasion.

### Modified Capabilities
- `outfit-scoring`: the scoring thresholds come from one tuning object, which can be replaced.

## Impact

- `packages/core/src/scoring/` (`tuning.ts`, `occasions.ts`, and the three files whose constants move), `packages/core/src/generator/` (new), `index.ts`.
- `apps/api/src/outfits/` is untouched: `POST /outfits/score` keeps calling `checkHardFilters` and `scoreOutfit` with their defaults.
- `docs/outfit-algorithm.md`: the generator's real signature.
