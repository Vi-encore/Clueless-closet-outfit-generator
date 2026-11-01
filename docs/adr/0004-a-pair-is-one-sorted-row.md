# 4. Two people are one row, identified by the sorted pair

- **Status:** accepted
- **Decided in:** `add-friends`, roadmap step 6; applied again in `add-chat`
- **Date:** 2026-10-19

## Context

A friendship between two people is one relationship, but every request that
creates or changes it arrives from one side. The obvious table stores who asked
and who was asked, with a unique index on the two — and that index permits both
`(A, B)` and `(B, A)`. Nothing in SQL stops the second being written a
millisecond after the first.

A direct conversation has the same shape and the same hazard, reached from the
other direction: two people writing to each other at once would each find no
conversation and make one.

## Decision

The identity of the row is the pair itself, with the two identifiers sorted:
`Friendship` keeps `lowerUserId` and `higherUserId` with a unique index on the
two, and `Conversation` keeps the same pair joined into one unique
`directKey`. Who did what is recorded separately — `requestedById`,
`blockedById`.

The comparison lives in `src/sorted-pair.ts`. How each table spells the result
stays with that table.

## Consequences

- The database guarantees what the application wanted to be true, instead of
  the application trying to guarantee it under a race.
- The race becomes a feature rather than an error. Two people asking to be
  friends at the same moment is two people saying yes, and the losing write
  re-reads and accepts; two first messages resolve to one conversation.
- Every query mentions both columns, and "the other person" has to be picked
  out of whichever column is not yours.
- The names must not suggest an order of arrival, which is why they are
  `lower` and `higher` rather than `first` and `second`.
