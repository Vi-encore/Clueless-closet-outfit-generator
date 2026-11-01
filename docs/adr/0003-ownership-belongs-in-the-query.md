# 3. Ownership is part of the query, not a check after it

- **Status:** accepted
- **Decided in:** `add-wardrobe-items`, roadmap step 5
- **Date:** 2026-10-19

## Context

"Does this exist" and "is it theirs" are two questions, and code that asks them
separately can be left having asked only the first. That is how an IDOR bug is
written: somebody fetches a record by identifier and adds the ownership check
on the line below — or on a later day, or not at all.

## Decision

The owner is a condition of the lookup:

```ts
this.prisma.item.findFirst({ where: { id, ownerId } });
```

One query, one answer, and no second question to forget. A record that is not
there and a record that is not yours leave by the same door, which is also what
ADR-0002 asks for.

The method doing this is the only way to reach a record by identifier, and
other callers — the chat gateway asking whether an item may be forwarded — go
through it rather than around.

## Consequences

- The mistake cannot be made halfway.
- It is a habit, not a mechanism. Nothing stops somebody writing
  `findUnique({ where: { id } })` tomorrow; what holds the line is that every
  route has a test for another person's access.
- Every query on user data mentions the owner, which is noise on the page and
  the point of the exercise.
