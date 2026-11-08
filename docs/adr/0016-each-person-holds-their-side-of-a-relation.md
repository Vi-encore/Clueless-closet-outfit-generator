# 16. Each person holds their side of a relation

- **Status:** accepted; supersedes [ADR-0004](0004-a-pair-is-one-sorted-row.md) for friendships
- **Decided in:** `split-friendship-rows`, between roadmap steps 8 and 9
- **Date:** 2026-11-03

## Context

ADR-0004 made a friendship one row for two people, identified by the sorted pair.
Both of them read that row, so its columns could not say "mine" and "theirs" and
were named for the sort order instead: `lowerUserId`, `higherUserId`, and after
[ADR-0013](0013-each-side-holds-its-own-block.md), `blockedByLower` and
`blockedByHigher`. The author found the schema unclear for exactly that reason,
and no name for a position in a pair would have read better.

The code already thought the other way. A helper turned the two block columns
into `mine` and `theirs`, and every query asked for a person on "either side".
ADR-0013 had given each side its own block: the first piece of state that
belongs to one person rather than to the pair.

## Decision

A relation between two people is two `Friendship` records, one held by each:
`userId` (whose record), `otherUserId` (about whom), `status`, `requestedByMe` and
`blocked`. `status` is the state of the relation and is the same on both sides;
the other two belong to the side that holds them. The table is unique on
`(userId, otherUserId)`.

`FriendsService` writes and removes both records in one transaction, and a person
only ever reads their own. The two writes go in a fixed order, the side whose
holder's id sorts first going first, so that two people acting at once wait for
each other instead of deadlocking.

Conversations are unchanged. A conversation is still identified by the sorted pair
joined into `directKey`, and ADR-0004 still holds for it.

## Consequences

- The schema says what the code means. "My friends" is `userId = me`, a block I
  placed is my `blocked`, and nothing has to pick "the other person" out of one of
  two columns.
- A block stays unannounced by construction: it is a column on the blocker's record,
  and nobody reads anyone else's record.
- What ADR-0004 had the database guarantee, "one per pair", is now two guarantees.
  The unique index makes it one record per side. "Both sides or neither" is kept by
  the service, not by SQL, and a write that forgot one side would go unnoticed by the
  database. The scenario "Both sides change together" exists to catch that.
- `status` is copied, so every change of state is two writes.
- Two people asking each other at the same moment still resolve to a friendship. Both
  transactions write both records in the same order, so the second meets the unique
  index and takes the path that already treats that as a yes.
