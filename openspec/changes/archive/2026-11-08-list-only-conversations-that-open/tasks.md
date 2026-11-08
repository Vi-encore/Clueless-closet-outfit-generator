# Tasks

## 1. The API

- [x] 1.1 Claude writes the tests for "Only conversations that open are listed" and "A conversation stays readable when a friendship ends" in `apps/api/test/chat.db-spec.ts`
- [x] 1.2 Let a former friend read in `readableConversation`, and filter `conversationsOf` by the same rule; verify `pnpm --filter @closet/api test:db` passes

## 2. The client

- [x] 2.1 Claude writes the test for "A conversation with a former friend is read-only" in `apps/web/src/features/chat/chat.spec.tsx`
- [x] 2.2 Show a former friend's conversation without the field to write in, with `uk.chat.formerFriend`; verify `pnpm --filter @closet/web test` passes and the author checks in a browser that `friendcheck` no longer sees `formcheck`, and that a removed friend's conversation is listed and read-only
