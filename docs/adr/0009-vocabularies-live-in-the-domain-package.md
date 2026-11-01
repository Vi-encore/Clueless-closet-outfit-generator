# 9. Vocabularies live in the domain package

- **Status:** accepted
- **Decided in:** `add-core-domain`, roadmap step 1; extended in
  `add-wardrobe-items`
- **Date:** 2026-10-06

## Context

The words an item is described by — its slot, its colours, its fabrics, the
occasions it suits — are needed by the validation at the edge, by the scoring
algorithm, by the database's contents and eventually by the interface. Written
in each, they drift, and the drift shows up as an item that validates and then
scores as though it were something else.

## Decision

Every vocabulary is defined once in `packages/core` and everything else derives
from it. The schemas that validate requests are built from those lists, so a
new fabric is added in one place and is immediately accepted, scored and
storable.

The database stores codes; the interface dictionary holds the words people
read. The two never meet.

`packages/core` holds no framework and no database import, which is what lets
it be the place everything else points at — including, one day, a browser.

## Consequences

- A vocabulary cannot disagree with itself.
- Adding a value is a change to the domain package and a rebuild, not an edit
  in four files.
- The states an item can be in — available, in the laundry, archived — are
  vocabularies too, and live there for the same reason, even though nothing
  validates them against user input.
