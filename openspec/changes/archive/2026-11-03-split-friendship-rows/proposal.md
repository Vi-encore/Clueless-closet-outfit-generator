# Proposal

## Why

A friendship is one row for two people ([ADR-0004](docs/adr/0004-a-pair-is-one-sorted-row.md)). Both of them read the same row, so its columns cannot say "mine" and "theirs" and are named for the sorted pair instead: `lowerUserId`, `higherUserId`, `blockedByLower`, `blockedByHigher`, and on `User`, `friendshipsAsLowerUser` and `friendshipsAsHigherUser`. The author read the schema after step 8 and found these names unclear. Any name for a position in a pair (`first`/`second`, `A`/`B`) would be as abstract, because the trouble is the shape and not the words.

The code already thinks in the other terms. `blockColumns(me, row)` turns the two block columns into `mine` and `theirs`, and every query asks for a person on "either side". [ADR-0013](docs/adr/0013-each-side-holds-its-own-block.md) gave each side its own block, which was the first piece of state that belongs to one person rather than to the pair.

Two rows per pair, one held by each person and naming the other, make the schema say what the code means: "my record about Dionne: friends, I have not blocked her".

## What Changes

- **`Friendship` becomes one person's side:** `userId` (whose record), `otherUserId` (about whom), `status`, `requestedByMe` and `blocked`. It is unique on `(userId, otherUserId)` and indexed on `(userId, status)`.
- **On `User`:** `friendships` (the records a person holds) and `friendshipsAboutMe` (the ones others hold about them, which only Prisma needs).
- **`FriendsService` writes and removes both sides in one transaction,** so they always agree on `status`. Reading becomes `where: { userId: me }`, with no `OR` over two columns and no `blockColumns`.
- **A hand-written migration carries every existing row across as two,** with each side's block and who asked.
- **The API answers exactly as before.** The friends, chat and items suites pass unchanged.
- **ADR-0016** supersedes ADR-0004 for friendships. Conversations keep their sorted pair key.

Out of scope:
- **TanStack Query**, which is the next change.
- **Conversations.** A conversation is identified by a joined pair key and its members are already one row each, so nothing there has the problem.
- **Any change to what a person sees,** including who learns about a block.

## Capabilities

### Modified Capabilities
- `data-persistence`: a friendship is two records, one per person, written together.

## Impact

- **`apps/api/prisma/schema.prisma`,** plus a hand-written migration.
- **`apps/api/src/friends/`:** the service, and `PairColumns` in its interfaces, which goes.
- **`apps/api/src/sorted-pair.ts`:** now used by conversations only, and its comment says so.
- **`apps/api/test/schema.db-spec.ts`:** the friendship scenarios. `friends.db-spec.ts` gains one.
- **Docs:** `docs/adr/0016-…`, ADR-0004's status line, `openspec/config.yaml`.
