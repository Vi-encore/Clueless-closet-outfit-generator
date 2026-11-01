# Proposal

## Why

A mentor read the code after steps 6 and 7 and found seven things. Six are right, one was right about the symptom and wrong about the cure, and checking them turned up duplication nobody had named yet: `isAlreadyThere` is written twice, identically, and the sorted-pair rule is written twice in two different shapes. Both happened for the same reason — helpers living inside the service that first needed them.

Almost none of this changes what the API does. That is what makes it safe: 205 tests describe the behaviour, so a refactor that keeps them green has kept the behaviour.

## What Changes

- **The sorted pair says so.** `Friendship.userAId` / `userBId` become `lowerUserId` / `higherUserId`, and the back-relations follow. `A` and `B` read like they mean something; they only mean "whichever side the comparison put you on".
- **Both guards say what they cover.** `JwtAuthGuard` handles `http`, returns early for `ws` with the reason written down, and throws for anything else rather than quietly allowing it. `ConnectedUserGuard` becomes `AuthenticatedSocketGuard`, which says what it is beside `JwtAuthGuard`.
- **The gateway keeps only the socket.** Delivery — rooms, `socketsJoin`, `emit` — moves to `ChatBroadcaster`.
- **Types and helpers leave the service files.** `chat.interfaces.ts` for the chat's own, and shared homes for what two services were each keeping a copy of.
- **A conversation remembers when it was last spoken in**, so the list is ordered by the database instead of by JavaScript, and what is left of the chain is one `flatMap`.
- **`conversations.controller.ts` becomes `chat.controller.ts`.** The URL still names the resource; the file names the module.
- **One definition of how a bucket is made.** `StorageService` and the `storage:init` script stop each carrying their own.
- The conventions these follow are written into `openspec/config.yaml`, so the next change made here starts from them rather than repeating the mistake.

Out of scope:
- **Architecture decision records.** Wanted, and next: the decisions should stop moving before they are written down.
- **Merging the two guards behind one interface**, which the review suggested. They protect at different moments — HTTP on every request, a socket once at its handshake — and one of them returning early is correct rather than lax. The fix is to say so loudly, not to join them.
- **Replacing `map`/`filter` with `reduce`**, also suggested. The array is the conversations one person has; three passes over tens of items cost nothing, `sort` cost more than all of them, and `reduce` reads worse. Removing the need to sort in JavaScript at all is the better answer.

## Capabilities

### Modified Capabilities
- `chat`: the conversation list is ordered, and says so.
- `data-persistence`: a conversation records when it was last spoken in.

## Impact

- A migration: two columns renamed on `Friendship`, one added to `Conversation`.
- `apps/api/src/chat/` — a new broadcaster, an interfaces file, a renamed controller.
- `apps/api/src/auth/jwt-auth.guard.ts` and the socket guard beside it.
- New shared modules for the Prisma error check and the sorted pair.
- `apps/api/src/storage/` — the client and the bucket check extracted from the service so the script can share them.
- No change to any route, payload or status code.
