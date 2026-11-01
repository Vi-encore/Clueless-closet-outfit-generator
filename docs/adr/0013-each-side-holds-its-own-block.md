# 13. Each side of a pair holds its own block

- **Status:** accepted
- **Decided in:** `add-friends-screens`, roadmap step 8
- **Date:** 2026-11-01

## Context

[ADR-0004](0004-a-pair-is-one-sorted-row.md) makes two people one row, and the
row recorded a block in one column, `blockedById`. One column can name one
person, which was wrong twice over.

Somebody blocked could block back, which made the column theirs, and then remove
the relation, lifting the block on themselves. And had that been closed by simply
ignoring the second block, a person would not get what they asked for, and would
be able to notice that it was missing.

## Decision

The row keeps being one row, and each side holds its own block: `blockedByLower`
and `blockedByHigher`, named for the sorted pair. `status` is `blocked` while
either is set.

The server knows both. A person sees only their own: `GET /friends/blocked` lists
the people they blocked, and nothing anywhere says who blocked them. Lifting a
block clears your own side, and the row goes only when neither side holds one.

## Consequences

- A block belongs to whoever placed it, and nobody else can touch it.
- Two people can block each other, and each keeps theirs when the other lets go.
- Blocking back reveals nothing, because it simply works.
- Removing a blocked relation has a case it did not have: clearing one side rather
  than deleting the row.
- Every query about a block has to pick its column by which side the person is on,
  the same price ADR-0004 already names.
