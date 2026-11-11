# Design

## Context

`packages/core/src/scoring/` scores an outfit it is given: `checkHardFilters(items, occasion)` (formality gap, avoided occasion) and `scoreOutfit(items, occasion)` with two components, `color` and `formality`, combined by `weightedTotal` with the occasion's weights. Their numbers are module constants (`MAX_FORMALITY_GAP`, `CALM_SCORE`, `ACCENT_SCORE`, `EXTRA_ACCENT_PENALTY`, the brightness thresholds, `POINTS_PER_STEP`). `OCCASIONS` is a vocabulary of codes; an `Occasion` (code, target formality, weights) is only ever built by a caller, as `POST /outfits/score` does from its body. Nothing makes an outfit.

## Decisions

### One `Tuning` object, passed down

```ts
export const DEFAULT_TUNING = {
  maxFormalityGap: 2,
  color: { calm: 0.5, accent: 0.75, extraAccentPenalty: 0.5,
           bright: { minSaturation: 0.5, minLightness: 0.25, maxLightness: 0.85 } },
  formality: { pointsPerStep: 0.5 },
  picking: { topK: 14, keep: 7, noise: 0.25 },
} as const;
```

`Tuning` is its type with every leaf a `number` (in `scoring.interfaces.ts`). Each function takes `tuning: Tuning = DEFAULT_TUNING` as its last parameter, so every existing call and test keeps working, and `POST /outfits/score` needs no change. A partial override is the caller's business (`{ ...DEFAULT_TUNING, color: { ...DEFAULT_TUNING.color, accent: 1 } }`); a deep-merge helper is not worth its tests yet.

Alternative: a module-level setter. Rejected: global state in a pure package, and two comparisons in one test run would step on each other.

`MAX_FORMALITY_GAP` stays exported as an alias of the default, since a test and possibly the client read it.

### System occasions are constants beside the vocabulary

`scoring/occasions.ts`: `SYSTEM_OCCASIONS: Record<OccasionCode, Occasion>`, each passing `occasionSchema` (a test checks it). Values to start from, to be tuned: home 1, sport 1, casual 2, travel 2, date 3, work 3, party 4; weights 1 everywhere except party (color 1.5) and work (formality 1.5). The author's decision: no table until there are custom occasions ([data-model.md](../../../docs/data-model.md#occasion) keeps the table for then).

### The generator

```ts
generateOutfits(input: {
  items: readonly OutfitItem[];
  occasion: Occasion;
  mustInclude?: readonly string[];
  exclude?: readonly string[];
  seen?: readonly (readonly string[])[];  // item ids of outfits already shown
  limit?: number;                          // default 1
  random?: () => number;                   // default Math.random
  tuning?: Tuning;
}): GeneratedOutfit[]                      // { itemIds: string[]; score: OutfitScore }
```

Steps, each its own small function in `generator/`:

1. **Pool:** drop `exclude`; split by slot. A `mustInclude` id that is not in the pool returns `[]` at once.
2. **Bases:** every top × bottom, and every one-piece alone. A base that cannot hold the `mustInclude` items of the base slots (two one-pieces, a top and a one-piece, two tops) is dropped. `mustInclude` of shoes or outerwear constrains the layers in step 5, not the base.
3. **Filter and score** each base with `checkHardFilters` and `scoreOutfit`.
4. **Pick** (`pick.ts`): sort by total, keep the best `topK`, add `(random() * 2 - 1) * noise` to each, keep the best `keep`, then a weighted random choice with weight `max(1, score − min + 1)²` ([outfit-algorithm.md](../../../docs/outfit-algorithm.md)). Repeat without replacement for `limit` outfits. Skip any base whose final outfit equals a `seen` one (compare sorted id lists).
5. **Layers**, greedily per picked base: shoes — of the shoes passing the hard filters together with the base, the one with the best total (a `mustInclude` pair is the only candidate); none pass → no shoes. Outerwear — the best passing one, added only if its total is at least the outfit's without it (or it is in `mustInclude`).
6. **Result**: ids in slot order (outerwear, top/one-piece, bottom, shoes) and the score of the whole outfit.

The noise is on the scale of the totals the video used (around 10); our totals are around −2…2. So `noise` starts small (0.25) in `DEFAULT_TUNING`, not 2.5: with 2.5 the ranking would be noise. Note it as the first knob to tune.

`random` is any `() => number` in [0, 1). Tests pass a seeded generator (a 10-line mulberry32 in the test file), never `Math.random`.

Alternative: layers in the Cartesian product. Rejected by the algorithm doc: top × bottom × shoes × outerwear grows fast, and the best shoes for a base do not change which base is best enough to matter.

### Pure and synchronous

No I/O, no dates, no ids made here. The API passes in what it read (available items, the occasion from `SYSTEM_OCCASIONS`, what is excluded) and stores what comes out.

## Structure

- `packages/core/src/scoring/tuning.ts`, `occasions.ts`; `color.ts`, `formality.ts`, `filters.ts`, `score-outfit.ts` take `tuning`.
- `packages/core/src/generator/`: `generate-outfits.ts`, `bases.ts`, `layers.ts`, `pick.ts`, `generator.interfaces.ts`, tests beside them.
- `packages/core/src/index.ts` exports the generator, `DEFAULT_TUNING`, `SYSTEM_OCCASIONS`.

## Pitfalls

- **`readonly` all the way.** `DEFAULT_TUNING` `as const` makes literal types; `Tuning` has to widen them to `number` or no override will type-check.
- **Ties.** Many bases score exactly the same (0 where data is missing). The pick must still be random among them, and a stable sort must not always favour the first item added.
- **Weights of the weighted pick** must be positive: `max(1, …)` is there for that.
- **`limit` larger than the bases** returns as many as exist, not an error and not repeats.
- **The conventions test:** `GeneratedOutfit`, `GenerateInput` and `Tuning` belong in interfaces files.
