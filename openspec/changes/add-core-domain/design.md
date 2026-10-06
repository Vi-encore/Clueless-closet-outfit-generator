# Design

## Context

Step 1 of the roadmap; the pnpm workspace from step 0 exists, nothing else does. Motivation and scope: see proposal.md. Requirements: see the two delta specs. Field meanings: `docs/data-model.md#item`; scoring background: `docs/outfit-algorithm.md`.

`core` will later run in three places — Nest (step 2+), the browser (step 8+) and tests — so it must not use Node-only APIs.

## Goals / Non-Goals

**Goals:**
- One place where vocabularies are declared; types, validation and the JSON Schema are derived from it.
- Pure functions only: same input → same output, no I/O, no randomness (randomness arrives with the generator at step 10).
- Every scenario in the delta specs has a test whose name matches the scenario name.

**Non-Goals:**
- Any build or publishing setup beyond what Vitest and the type checker need (see Risks).
- Tuning scoring numbers against real photos — that happens once real items exist (step 10).

## Decisions

### 1. Vocabularies as `as const` arrays, types derived from them
Declare each vocabulary as a readonly array and derive the union type from it (`typeof X[number]`). Types per slot go into one object keyed by slot, from which both the full type union and the "which slot owns this type" lookup are derived.
- *Alternative — TypeScript `enum`:* emits extra runtime objects, is awkward to iterate for form options, and doesn't plug into zod as directly.
- *Alternative — zod enums as the source:* works, but makes the plain vocabulary depend on the validation library; arrays stay usable anywhere.

### 2. Validation with zod 4
One schema for item tags, built from the vocabularies. Single-field rules (codes, 1–5 integers) are plain schema rules; cross-field rules (type belongs to slot, distinct seasons and materials, percentages ≤ 100) are refinements that attach the error to the right field path. zod 4 also exports JSON Schema directly, which covers the "Tag schema export" requirement.
- *Alternative — valibot:* smaller bundle, but less familiar and its JSON Schema export is a separate package.
- *Alternative — class-validator:* ties validation to Nest classes; `core` must stay framework-free.

### 3. Scores in [−1, 1], total = weighted sum
Each component returns a number from −1 to 1, 0 meaning "no effect / no data". The total multiplies each component by the occasion's weight (default 1) and sums them. The breakdown is returned alongside the total.
- *Why:* components stay comparable, weights become the only tuning knob, and the breakdown explains "why this outfit".
- *Alternative — the video's 0–10 scale:* easy to map to later for display; internally a signed scale expresses "clash" naturally.

### 4. Hard filters separate from scoring
A filter function returns either "ok" or a list of human-readable reasons; scoring assumes the outfit already passed. The generator (step 10) filters first and scores only survivors, which is cheaper and keeps rejections explainable.

### 5. Color component
- The item's main color is its color with the largest `share`.
- Neutral families: black, white, grey, beige, denim.
- "Bright" = a non-neutral family whose color is saturated enough; compute saturation and lightness from the hex value (a small hex → HSL helper is a good exercise — no library needed). Start with thresholds around saturation ≥ 0.5 and lightness between 0.25 and 0.85, and adjust when real photos arrive.
- More than one bright main color → negative; more than one non-solid pattern → negative; otherwise neutral-friendly pairs → small positive. Color-wheel harmony can refine this later without changing the specs.

### 6. Formality component
Compare the outfit's average formality with the occasion's target. A linear starting point: `1 − |average − target| / 2`, clamped to [−1, 1] (distance 0 → 1, 1 → 0.5, 2 → 0, 4 → −1).

### Target structure (orientation, not prescriptive)

```
packages/core/
  package.json          name "@closet/core", "type": "module", scripts.test = "vitest"
  tsconfig.json         strict
  src/
    index.ts            public API re-exports
    taxonomy/
      vocabularies.ts   as const arrays + derived types
      item-tags.ts      zod schema + cross-field rules
      json-schema.ts    export of the item-tags JSON Schema
    scoring/
      types.ts          Occasion, ComponentName, scoring result
      filters.ts
      color.ts
      formality.ts
      score-outfit.ts
```

Tests can sit next to the code (`*.test.ts`) or in `test/` — pick one and keep it.

Signatures to orient by (names are suggestions):

```ts
type FilterResult = { ok: true } | { ok: false; reasons: string[] };

function checkHardFilters(items: ItemTags[], occasion: Occasion): FilterResult;
function scoreColor(items: ItemTags[]): number;
function scoreFormality(items: ItemTags[], targetFormality: number): number;
function scoreOutfit(items: ItemTags[], occasion: Occasion): {
  total: number;
  breakdown: Record<ComponentName, number>;
};
```

### Read first
- TypeScript Handbook: [Literal types and `as const`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types), [Indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html).
- zod 4: [Basic usage](https://zod.dev/basics), [Refinements](https://zod.dev/api#refinements), [JSON Schema](https://zod.dev/json-schema).
- Vitest: [Getting started](https://vitest.dev/guide/).
- pnpm: [Filtering](https://pnpm.io/filtering) (`--filter @closet/core`).

### Common pitfalls
- Without `as const`, `typeof X[number]` widens to `string` and every check silently passes.
- Defining the same type twice (once by hand, once via `z.infer`) — derive vocabulary types from arrays and object shapes from the schema; don't mix both for one thing.
- Comparing floats with `toBe` — use `toBeCloseTo` for scores.
- Cross-field errors attached to the root instead of the field path — the specs require the error to name the field.
- Importing anything from Node (`fs`, `path`) into `core` — it has to run in the browser too.

## Risks / Trade-offs

- [Nest compiles with `tsc` and can't import raw `.ts` from a workspace package] → at step 2, add a build for `core` (e.g. `tsc -b` to `dist/` with `exports` pointing there) or a TS path mapping; keep `src/index.ts` as the single entry point so the switch is one line.
- [The "bright" thresholds are subjective] → tests use unambiguous colors; tune once real items exist.
- [Vocabulary churn] → codes are stable identifiers: adding a code is safe, renaming one will need a data migration once the database exists (step 3).

## Open Questions

- Exact vocabulary contents beyond what data-model.md lists (e.g. more types per slot) can grow over time without changing the specs.
