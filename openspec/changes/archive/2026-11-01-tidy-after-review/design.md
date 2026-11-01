# Design

## Context

Seven review notes, and a check of each against the code. Most are naming and placement; two needed a decision rather than a rename, and one was answered differently from how it was asked.

## Goals / Non-Goals

**Goals:** names that mean what they say; one definition of each rule; the same behaviour, proved by the same tests.

**Non-Goals:** ADRs (next), merging the guards, `reduce`.

## Decisions

### 1. The columns are renamed, not only the relations

The review named the relations — `friendshipsAsA`, `friendshipsAsB` — but the opacity starts one level down, at `userAId` and `userBId`. Any relation name built on `A` and `B` inherits it.

So: `lowerUserId` and `higherUserId`, with `friendshipsAsLowerUser` and `friendshipsAsHigherUser` above them. "Lower" carries the rule: the pair is sorted, and you are in the column the comparison put you in.

`firstUserId` / `secondUserId` reads better in English and is rejected for it — "first" invites the reading "first to ask", which is a different column entirely (`requestedById`). A name that can be misread as another field is worse than a dull one.

The relations are never read by anything; Prisma simply requires a field on both sides. The comment says so, so nobody goes looking for the code that uses them.

### 2. A guard states which contexts it covers

The review found `return true` for a non-HTTP context alarming, and proposed one interface choosing a guard per connection, raising an explicit error when something is off.

The instinct is right and the mechanism would break the chat. `JwtAuthGuard` returning early for a socket is not laxity: a socket was authenticated at its handshake, before any handler could run, so a guard that threw there would refuse every message in the application. And the two cannot be merged, because they protect at different moments — one on every request, one once per connection. Joining them would hide that difference, which is the thing worth seeing.

What is fair is that `return true` does not say which of those two it means. So it is spelled out, and the explicit error goes where it belongs — the context nobody designed for:

```ts
switch (context.getType()) {
  case 'http':
    break;
  case 'ws':
    // Authenticated at the handshake, before any handler could run.
    return true;
  default:
    throw new Error(`JwtAuthGuard does not cover ${context.getType()} contexts`);
}
```

`ConnectedUserGuard` becomes `AuthenticatedSocketGuard`: a reader meeting it next to `JwtAuthGuard` should see a pair.

### 3. Delivery leaves the gateway, and identity does not

The domain is already in `ChatService`. What remains in the gateway is transport, and it is two different things: how a message reaches people, and how a connection proves who it is.

`ChatBroadcaster` takes the first — rooms, `socketsJoin`, `emit`. It is the only place that knows a room exists, which is what makes it worth separating: when a second instance needs the Redis adapter, exactly one file changes.

`identify` stays. It is six lines, it exists only to be handed to `server.use`, and a file holding one function called from one line above it buys a name and costs a jump. Separation pays when it isolates a reason to change; there is no second reason here.

### 4. Types and helpers leave the service

`chat.interfaces.ts` takes `MessageView`, `ConversationView` and `SentMessage`. They are the vocabulary of the module, and a reader looking for them should not have to read a service to find them.

The helpers are the sharper half, because the check turned up what their placement had already cost:

| Written twice | In |
| --- | --- |
| `isAlreadyThere` — the P2002 check, identical both times | `chat.service.ts`, `friends.service.ts` |
| the sorted pair — as columns, and as a joined string | `friends.service.ts` (`pairOf`), `chat.service.ts` (`directKeyOf`) |

Both duplications happened because the helper lived in whichever service needed it first, and the second author did not go looking. So `src/prisma/errors.ts` gets the error check, and `src/sorted-pair.ts` gets both shapes of the pair, built from one comparison.

The rule being adopted is not "no types in a service file" — a type used by one service and its controller is fine where it is. It is: **anything two files could want, or that takes a paragraph to explain, gets its own home.** Written into `openspec/config.yaml`, because that is where the rules for the next change are read from.

### 5. The ordering moves to the database

The review asked for `reduce` in place of `map` and `filter`. Declined: the array is one person's conversations, three passes over tens of items cost nothing next to the `sort` that follows, and `reduce` with a push into an accumulator reads worse than what it replaces.

But the chain was doing too much, and the part worth removing is the sort. A conversation list is always wanted by recency; computing that in JavaScript means fetching each conversation's newest message only to throw it away after comparing.

So `Conversation.lastMessageAt`, written whenever a message is stored, and `orderBy` in the query. The cost is a column that can disagree with the messages if anything ever writes one without going through `send`; nothing does, and the alternative — ordering by a related maximum — Prisma cannot express without raw SQL.

What is left of the chain is a single `flatMap`, which also deletes the type predicate `filter` needed: returning `[]` or `[view]` means no `null` is ever produced, so nothing has to be narrowed afterwards.

### 6. The URL names the resource, the file names the module

`conversations.controller.ts` beside `chat.gateway.ts` and `chat.service.ts` is the odd one out. It becomes `chat.controller.ts` with `ChatController`, and the routes stay at `/conversations` — a URL is a noun a client asks for, and conversations is what it gets.

### 7. One definition of making a bucket

`StorageService.ensureBucket` and `init-bucket.ts` both know how. Neither runs at startup, so nothing is created twice — but the knowledge is written twice, which is the real complaint.

The script cannot import the service: Node runs TypeScript directly and decorators are not type syntax, so anything carrying `@Injectable` is out of reach. So the shared part moves below both into `storage/s3.ts` — `makeS3Client(settings)` and `ensureBucket(client, bucket)`, no decorators, importable by a Nest provider and by a bare script alike.

## Common pitfalls

- **Renaming a Prisma field renames the column.** The migration has to be read before it is applied: a generated `DROP`/`ADD` pair would lose the data, where a rename keeps it. There is nothing but development data here, and it is still the habit worth having.
- **`lastMessageAt` is written on the same path as the message.** If a second way to store a message ever appears, it has to write both or the ordering silently rots.
- **The tests are the whole safety net.** Nothing here should need a test changed except where a name appears in one; a test that needs rewriting means the behaviour moved, which was not the intention.

## Risks / Trade-offs

- [A denormalised `lastMessageAt` can drift from the messages] → one writer today, named in the pitfalls; the alternative needs raw SQL for an ordering every chat wants.
- [Renaming across a migration and six files at once] → done as one change with the suite run between groups, because half-renamed is worse than either end.
