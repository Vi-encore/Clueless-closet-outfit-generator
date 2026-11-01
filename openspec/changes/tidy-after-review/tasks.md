# Tasks

## 1. Names that mean what they say

- [x] 1.1 Rename `Friendship.userAId` / `userBId` to `lowerUserId` / `higherUserId` and the back-relations to `friendshipsAsLowerUser` / `friendshipsAsHigherUser`, with a comment saying Prisma requires them and nothing reads them; read the generated migration before applying it, so it renames rather than drops and adds
- [x] 1.2 Rename `ConnectedUserGuard` to `AuthenticatedSocketGuard`, and `conversations.controller.ts` to `chat.controller.ts` with `ChatController`, leaving the routes at `/conversations`
- [x] 1.3 Make `JwtAuthGuard` state which contexts it covers: `http` as now, `ws` returning early with the handshake named as the reason, anything else throwing
- [x] 1.4 Run the whole suite: nothing here should need a test changed except where a name appears in one

## 2. One definition of each rule

- [ ] 2.1 Move `MessageView`, `ConversationView` and `SentMessage` to `chat/chat.interfaces.ts`
- [ ] 2.2 Move the P2002 check to `src/prisma/errors.ts` and both shapes of the sorted pair to `src/sorted-pair.ts`, built from one comparison, and use them from both services that had their own
- [ ] 2.3 Extract `makeS3Client` and `ensureBucket` into `storage/s3.ts`, free of decorators so the script can import them, and have `StorageService` and `init-bucket.ts` share them
- [ ] 2.4 Write the convention into `openspec/config.yaml`: anything two files could want, or that takes a paragraph to explain, gets its own home

## 3. The gateway keeps only the socket

- [ ] 3.1 Extract `ChatBroadcaster` with the rooms, `socketsJoin` and `emit`, and say in it why it is separate: it is the only thing that knows a room exists, so a Redis adapter would change one file
- [ ] 3.2 Say in the gateway why `identify` stayed — six lines handed to `server.use`, with no second reason to change
- [ ] 3.3 Run the chat suite

## 4. The database does the ordering

- [ ] 4.1 Claude writes the tests "Storing a message records the moment", "A later message replaces the moment", "The most recent conversation is first" and "A new message moves a conversation up"
- [ ] 4.2 Add `Conversation.lastMessageAt` and write it as part of storing a message
- [ ] 4.3 Order `conversationsOf` in the query, and reduce what is left to one `flatMap` — which also removes the type predicate the filter needed; verify the 4.1 tests pass and the whole suite stays green
