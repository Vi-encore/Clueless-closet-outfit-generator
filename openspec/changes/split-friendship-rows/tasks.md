# Tasks

## 1. The two sides in the database

- [ ] 1.1 Claude writes the tests "One record per side", "Who asked is kept" and "Removed with either person" in `apps/api/test/schema.db-spec.ts`, against the new columns; and removes the test of the requirement this replaces; verify they fail
- [ ] 1.2 Change `Friendship` and `User` in `schema.prisma` and write the migration by hand; verify `prisma migrate diff` from the migrations to the schema is empty and the three tests pass
- [ ] 1.3 Apply the migration to the development database and compare the relations before and after: the block between `formcheck` and `friendcheck` must be on `formcheck`'s side only

## 2. The service on two sides

- [ ] 2.1 Claude writes the test "Both sides change together" in `apps/api/test/friends.db-spec.ts`; verify it fails to compile or fails
- [ ] 2.2 Rewrite `FriendsService` on two rows, every write in one transaction; remove `blockColumns`, `pairOf`, `eitherSide` and `PairColumns`; verify the whole of `pnpm --filter @closet/api test:db` passes with no other test changed, and `pnpm test`

## 3. Docs

- [ ] 3.1 Write ADR-0016 (each person holds their side of a relation) superseding ADR-0004 for friendships, mark ADR-0004's status, correct `sorted-pair.ts`'s comment and `openspec/config.yaml`
