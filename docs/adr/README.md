# Architecture decision records

A record per decision that outlives the change that made it.

## Why these exist beside OpenSpec

Every change in `openspec/changes/archive/` already carries a `design.md` with
its context, its alternatives and its trade-offs. That is a decision log, and a
good one — but it is organised by **change**, and some decisions are not.

Three things it cannot do:

- **Give a decision an address.** "See ADR-002" is something a review comment,
  a pull request or a code comment can say; "see the design of the change that
  added friends" is not.
- **Hold a decision that governs everything.** A rule like "somebody else's
  data answers 404" was first written down in one change and has bound every
  change since. Leaving it there makes it look local.
- **Say that a decision was replaced.** When a later change reverses an earlier
  one, nothing links the two, and the only way to find out is to read every
  archive in order.

So these records are an index, not a copy. Each one states the decision and
points at the change that made it; the full reasoning stays in that change's
`design.md`.

## When to write one

When a decision will bind work beyond the change making it. A decision about
how one route behaves belongs in that change and nowhere else.

## Format

Title, status, where it was decided, then context, decision and consequences —
including what it costs, because a record that lists only benefits is an
advertisement.

Records are not edited once accepted. A decision that changes gets a new record
that supersedes the old one, and the old one is marked as superseded.

## The records

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-closed-by-default.md) | Everything is closed by default | accepted |
| [0002](0002-not-found-rather-than-forbidden.md) | Somebody else's data answers "not found" | accepted |
| [0003](0003-ownership-belongs-in-the-query.md) | Ownership is part of the query, not a check after it | accepted |
| [0004](0004-a-pair-is-one-sorted-row.md) | Two people are one row, identified by the sorted pair | superseded for friendships by 0016 |
| [0005](0005-identity-per-transport.md) | Identity is established per transport, and the guards do not merge | accepted |
| [0006](0006-two-tiers-of-tests.md) | Tests come in two tiers, and most need no container | accepted |
| [0007](0007-files-never-pass-through-the-api.md) | Files go straight to object storage | accepted |
| [0008](0008-the-client-generates-ids-it-can-retry.md) | A client generates the id that makes its retry safe | accepted |
| [0009](0009-vocabularies-live-in-the-domain-package.md) | Vocabularies live in the domain package | accepted |
| [0010](0010-archive-rather-than-delete.md) | Things are archived, not deleted | accepted |
| [0011](0011-the-access-token-lives-in-memory.md) | The access token lives in memory | accepted |
| [0012](0012-the-client-is-another-site.md) | The client is another site, and the settings say so | accepted |
| [0013](0013-each-side-holds-its-own-block.md) | Each side of a pair holds its own block | accepted |
| [0014](0014-the-client-is-arranged-by-feature.md) | The client is arranged by feature | accepted |
| [0015](0015-shapes-are-named-in-interfaces-files.md) | Shapes are named in interfaces files, and nothing is `any` | accepted |
| [0016](0016-each-person-holds-their-side-of-a-relation.md) | Each person holds their side of a relation | accepted |
| [0017](0017-server-data-is-cached-by-tanstack-query.md) | Server data is cached by TanStack Query | accepted |
