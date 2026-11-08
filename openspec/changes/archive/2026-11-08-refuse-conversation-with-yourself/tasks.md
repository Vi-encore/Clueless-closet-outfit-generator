# Tasks

## 1. The API

- [x] 1.1 Claude writes the tests for "Nobody has a conversation with themselves" in `apps/api/test/chat.db-spec.ts`; verify they fail
- [x] 1.2 Refuse the viewer's own username with 404 `No such person` in `ChatService`, for the history, marking read and `message:send`; verify `pnpm --filter @closet/api test:db` passes

## 2. The client

- [x] 2.1 Claude writes the test for "A conversation with yourself is not found" in `apps/web/src/features/chat/chat.spec.tsx`; verify it fails
- [x] 2.2 Show `NotFound` in `Conversation` for the signed-in person's own username, before anything is asked; verify `pnpm --filter @closet/web test` passes and the author opens `/chat/<own username>` in a browser
