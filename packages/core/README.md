# @closet/core

The core of Clueless Closet: a shared language for describing wardrobe items, and the first rules for scoring an outfit. Pure TypeScript — no database, no server, no UI — so the same code runs in the NestJS API and in the browser, and its tests need neither a database nor mocks.

## Why a separate package

- **One source of truth.** The API, the "add item" form and AI auto-tagging all take their categories, styles and seasons from here. Add a new item type once and it appears everywhere.
- **Pure functions.** The same input always gives the same output, which makes the rules easy to test and explain.
- **Runs anywhere.** The package imports nothing specific to Node or the browser, and the compiler enforces it (`lib: ES2022`, no DOM or Node types).

## Structure

```
src/
  taxonomy/
    vocabularies.ts   fixed lists of tag codes + derived TypeScript types
    item-tags.ts      zod schema that validates an item's tags
    json-schema.ts    JSON Schema of item tags (for AI tag suggestions)
  scoring/
    types.ts          Occasion, OutfitItem, component names, result types
    filters.ts        hard filters that reject an outfit outright
    color.ts          color component (neutrals, bright accents, prints)
    formality.ts      formality component
    score-outfit.ts   weighted total with a per-component breakdown
  index.ts            public API — import from '@closet/core' only
```

Tests sit next to the code as `*.test.ts`.

## Part 1. Taxonomy: describing an item

### Vocabularies

| What | Count | Examples |
|---|---|---|
| Slots | 6 | `top`, `bottom`, `one_piece`, `outerwear`, `shoes`, `accessory` |
| Item types | 42 | `blouse`, `jeans`, `dress`, `trench_coat`, `loafers`… — each belongs to exactly one slot |
| Fabric types (texture) | 15 | `denim`, `satin`, `knit`, `corduroy`… |
| Materials (composition) | 14 | `cotton`, `silk`, `viscose`… |
| Styles / occasions / seasons | 9 / 7 / 4 | `classic`, `street`… / `work`, `party`… / `spring`… |
| Color families | 14 | `black`, `denim`, `red`… |

Plus fit, length, rise and pattern; warmth and formality use a 1–5 scale. Field meanings: [`docs/data-model.md`](../../docs/data-model.md#item).

### A valid item

```json
{
  "slot": "top",
  "type": "blouse",
  "fabricType": "satin",
  "materials": [{ "material": "viscose", "percent": 70 }],
  "seasons": ["spring", "summer", "autumn"],
  "formality": 3,
  "styles": ["classic"]
}
```

### Validation rules

- Only `slot` and `type` are required; everything else can be filled in later.
- Values are **codes** (`blouse`), never display labels ("Блуза"). Labels live in the UI, so translating never touches stored data.
- A type must belong to its slot: a blouse can't be a bottom.
- Warmth and formality are whole numbers from 1 to 5.
- Seasons and materials don't repeat; material percentages add up to at most 100.

```ts
import { itemTagsSchema } from '@closet/core';

const result = itemTagsSchema.safeParse({ slot: 'bottom', type: 'blouse' });
// result.success === false
// result.error.issues[0] → { path: ['type'], message: 'Type "blouse" does not belong to slot "bottom"' }
```

### JSON Schema

`getItemTagsJsonSchema()` generates a JSON Schema from the same vocabularies. It will constrain AI tag suggestions (roadmap step 15), so the model can only answer with valid codes. Cross-field rules can't be expressed in JSON Schema, so AI answers are re-validated with `itemTagsSchema`.

## Part 2. Scoring an outfit

```
outfit items → hard filters → component scores → weighted total + breakdown
```

### Hard filters — `checkHardFilters(items, occasion)`

An outfit is rejected outright when:
- the items' formality differs by more than 2 (sweatpants with a blazer);
- an item is marked "not for this occasion" (`avoidOccasions`).

Rejection reasons are structured data — `{ kind: 'formality_gap', gap: 3 }` — not English text, so the UI can phrase them in Ukrainian.

### Components

Each component scores from **−1** (clash) to **1** (ideal). **0** means "no effect" — including when data is missing, so partially described items aren't penalized.

- **Color** (`scoreColor`): neutrals (black, white, grey, beige, denim) go with everything; at most one bright accent; at most one print. "Bright" is computed from the hex value via HSL (saturation and lightness), so navy or pastel pink don't count as bright.
- **Formality** (`scoreFormality`): `1 − |average formality − occasion target| × 0.5`.

### Total — `scoreOutfit(items, occasion)`

A weighted sum of the components; an occasion can boost a component (e.g. color ×2 for a party, default weight 1). The per-component breakdown comes back with the total, so the app can explain "why this outfit".

```ts
import { checkHardFilters, scoreOutfit, type Occasion, type OutfitItem } from '@closet/core';

const outfit: OutfitItem[] = [
  { id: 'blouse-1', slot: 'top', type: 'blouse', colors: [{ family: 'white', hex: '#f5f5f5', share: 1 }], formality: 3 },
  { id: 'jeans-1', slot: 'bottom', type: 'jeans', colors: [{ family: 'denim', hex: '#3b5b8c', share: 1 }], formality: 2 },
];
const work: Occasion = { code: 'work', targetFormality: 3 };

checkHardFilters(outfit, work); // { ok: true }
scoreOutfit(outfit, work);      // { total: 1.25, breakdown: { color: 0.5, formality: 0.75 } }
```

Both colors are neutral (0.5); the average formality 2.5 is half a step from the target 3 (1 − 0.5 × 0.5 = 0.75). An orange top with green trousers would score −0.5 for color: two bright accents clash.

The generator itself (combinations, picking the best, randomness) is roadmap step 10.

## How it's verified

- The rules are written as two OpenSpec specs — [`wardrobe-taxonomy`](../../openspec/specs/wardrobe-taxonomy/spec.md) and [`outfit-scoring`](../../openspec/specs/outfit-scoring/spec.md): **16 requirements, 28 scenarios**.
- Every scenario has a test with the same name (`describe` = requirement, `it` = scenario) — **34 tests** in total.
- One test runs thousands of item combinations and checks that no score leaves the −1…1 range.
- TypeScript in strict mode, including `noUncheckedIndexedAccess`.

```bash
pnpm --filter @closet/core test          # run once
pnpm --filter @closet/core test:watch    # rerun on every save
pnpm --filter @closet/core typecheck
```

## Design decisions

1. **Vocabularies are `as const` arrays.** TypeScript types, zod validation and the JSON Schema are all derived from them — described once, used everywhere.
2. **Codes, not labels.** The database stores `blouse`; the UI shows "Блуза".
3. **Structured rejection reasons**, so the UI can phrase them in any language.
4. **0 means "no data", not "bad"**, so items can be described gradually.
5. **Filters are separate from scoring.** The generator drops unsuitable combinations first and scores only the rest.
6. **The source is exported directly** (`"exports": "./src/index.ts"`), with no build step. Vitest and Vite read TypeScript natively; NestJS will need a build of this package (roadmap step 2).

The starting numbers (0.5, 0.75, the "bright" thresholds) are constants next to each rule. They'll be tuned on real photos and gathered into one `scoring/tuning.ts` at step 10.
