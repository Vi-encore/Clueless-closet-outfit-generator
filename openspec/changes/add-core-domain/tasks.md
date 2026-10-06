# Tasks

## 1. Package scaffold

- [x] 1.1 Create `packages/core` with `package.json` (`@closet/core`, `"type": "module"`, a `test` script), a strict `tsconfig.json` and Vitest as a dev dependency; verify `pnpm --filter @closet/core test` runs a placeholder test green
- [x] 1.2 Add zod 4 as a dependency and `src/index.ts` as the single public entry point; verify `pnpm --filter @closet/core exec tsc --noEmit` passes

## 2. Tag vocabularies and validation (`wardrobe-taxonomy`)

- [x] 2.1 Declare the vocabularies as `as const` arrays with derived types, following docs/data-model.md#item (slots, types per slot, patterns, fabric types, materials, fits, lengths, rises, seasons, styles, occasions); verify a test that every slot has at least one type and no type belongs to two slots
- [x] 2.2 Write the item-tags schema with single-field rules (codes only, slot and type required, whole numbers 1–5); verify tests "Known code accepted", "Unknown code rejected", "Label instead of code rejected", "Minimal item", "Missing type", "Out of range", "Not a whole number" pass
- [x] 2.3 Add the cross-field rules (type belongs to slot, distinct seasons, material composition); verify tests "Type from another slot", "All four seasons", "Duplicate season", "Percentages omitted", "Percentages over 100", "Duplicate material" pass
- [x] 2.4 Export the JSON Schema of item tags; verify the test "Vocabulary reflected in the schema" passes

## 3. Outfit scoring (`outfit-scoring`)

- [x] 3.1 Define the scoring types (`Occasion` with target formality and optional weights, component names, the scoring result); verify `tsc --noEmit` passes
- [x] 3.2 Implement the hard filters returning reasons; verify tests "Gap of three rejected", "Gap of two accepted", "Avoided occasion rejected" pass
- [x] 3.3 Implement the color component (main color, neutrals, bright accents, prints, missing data); verify tests "Neutral with a bright color", "Two neutrals", "Two bright colors", "Two prints", "Missing colors" pass
- [x] 3.4 Implement the formality component; verify tests "Exact match", "Further is worse", "Missing formality" pass
- [x] 3.5 Combine the components into a weighted total with a breakdown (default weight 1); verify tests "Weighted total", "Breakdown lists every component", "Component range" pass

## 4. Integration check

- [x] 4.1 Run the full package suite and the type check; verify `pnpm --filter @closet/core test` is green, `tsc --noEmit` passes, and every scenario name from both delta specs appears in a test name

## Workflow follow-up

- Ask for a review ("перевір") after each group; tasks get ticked once they pass review.
- Archive the change with `/opsx:archive` after the final review; the delta specs then become `openspec/specs/wardrobe-taxonomy/` and `openspec/specs/outfit-scoring/`.
