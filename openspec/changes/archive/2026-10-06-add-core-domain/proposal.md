# Proposal

## Why

The API, the tag form, the auto-tagging schema and the outfit generator all need one shared vocabulary for describing items and one set of scoring rules. Step 1 of the roadmap (`docs/roadmap.md`) builds that foundation as a pure, fully tested package before any backend exists, so later steps import it instead of redefining it — and it's the first TDD practice in the project.

## What Changes

- A new workspace package `packages/core` (`@closet/core`): pure TypeScript, no Nest or database imports.
- Canonical tag vocabularies for items: slots, types per slot, patterns, fabric types, materials, fits, lengths, rises, seasons, styles, occasions; warmth and formality scales. Field meanings follow `docs/data-model.md#item`.
- Validation of an item's tags against those vocabularies: only slot and type are required, a type must belong to its slot, scales are 1–5, material percentages add up to at most 100.
- A machine-readable JSON Schema of item tags, generated from the same vocabularies (used by Gemini at step 15, see `docs/auto-tagging.md#single-source-of-truth-enums-in-core`).
- The first scoring rules from `docs/outfit-algorithm.md`: hard filters (formality gap, avoided occasion), the color and formality components, and a weighted total with a per-component breakdown.

Out of scope (later steps):
- The generator itself — combinations, top-K, randomness, `mustInclude` / `exclude` → step 10 (`add-outfit-generator`). This change only keeps scoring pure so the generator can reuse it.
- The silhouette, style, fabric / season, novelty and preference components → step 10.
- Extracting colors from photo pixels → step 9; persistence → step 3; UI labels and translations → step 8.

## Capabilities

### New Capabilities
- `wardrobe-taxonomy`: the shared vocabularies for describing items and the rules for validating an item's tags.
- `outfit-scoring`: rating a candidate outfit for an occasion — hard filters, component scores and a weighted total with a breakdown.

### Modified Capabilities
None — this is the first change; `openspec/specs/` is empty.

## Impact

- New package `packages/core`; nothing else changes.
- Dependencies: zod 4 (runtime); TypeScript and Vitest (dev).
- Future consumers: `apps/api` (DTO validation, generator), `apps/web` (form options), `GeminiTaggingProvider` (JSON Schema).
- Requires step 0 (the pnpm workspace skeleton).
