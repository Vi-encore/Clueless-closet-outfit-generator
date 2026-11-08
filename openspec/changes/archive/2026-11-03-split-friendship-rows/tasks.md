# Tasks

## 1. The two sides in the database

- [x] 1.1 Claude writes the tests "One record per side" and "Removed with either person" in `apps/api/test/schema.db-spec.ts`, against the new columns, and removes the tests of the requirement this replaces; verify they fail
- [x] 1.2 Change `Friendship` and `User` in `schema.prisma` and write the migration by hand; verify `prisma migrate diff` from the migrations to the schema is empty and the two tests pass
- [x] 1.3 Apply the migration to the development database and compare the relations before and after: the block between `formcheck` and `friendcheck` must be on `formcheck`'s side only

## 2. The service on two sides

- [x] 2.1 Claude writes the tests "Who asked is kept" and "Both sides change together" in `apps/api/test/friends.db-spec.ts`, through the API; verify they fail
- [x] 2.2 Rewrite `FriendsService` on two rows, every write in one transaction; remove `blockColumns`, `pairOf`, `eitherSide` and `PairColumns`; verify the whole of `pnpm --filter @closet/api test:db` passes with one other test changed ("Asking twice changes nothing" counts two records rather than one, since a relation is now two), and `pnpm test`

## 3. Docs

- [x] 3.1 Write ADR-0016 (each person holds their side of a relation) superseding ADR-0004 for friendships, mark ADR-0004's status, correct `sorted-pair.ts`'s comment and `openspec/config.yaml`
