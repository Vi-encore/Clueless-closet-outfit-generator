# Design

## Context

- **Rooms.** The chat's gateway puts every connection in a room per person, `user:<id>` (`chat/chat.utils.ts`), and `ChatBroadcaster` holds the Socket.IO server that `ChatGateway.afterInit` hands it.
- **Module dependencies.** `ChatModule` imports `FriendsModule`, because the chat asks whether two people are friends. So `FriendsService` cannot reach `ChatBroadcaster` without a cycle.
- **The client.** `ChatProvider` owns the one connection and turns its events into React Query invalidations, as it does for conversations (ADR-0017). The people's lists live under `friendKeys.all` (`['friends']`).
- **Privacy.** A block is never announced (ADR-0013, ADR-0016). Each person only ever reads their own records, and the person blocked sees them disappear as if they had been unfriended.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- A change to a relation shows on every open screen of both people within a moment, with no new route and no payload to keep private.
- Nothing about a block leaks that the lists do not already show.
- No dependency cycle between modules.

**Non-Goals:**
- Delivery to a closed app (push), and retries. A connection that comes back already refetches on mount and on focus.
- Live updates of anything but people and conversations.

## Decisions

### 1. A `realtime` module owns the server and the room per person

`apps/api/src/realtime/` holds:

- **`realtime.module.ts`**, which provides and exports `RealtimeService`;
- **`realtime.service.ts`**, with `attach(server)` and `toPerson(userId, event)`;
- **`realtime.utils.ts`**, with `userRoom`, moved from `chat/chat.utils.ts`.

How the pieces use it:

- `ChatGateway.afterInit` attaches the server to `RealtimeService`.
- `ChatBroadcaster` reads the server from `RealtimeService` instead of holding its own.
- Both `ChatModule` and `FriendsModule` import `RealtimeModule`.

`toPerson` does nothing when no server is attached. That is the HTTP-only test applications, where no connection can exist to be told anything. `ChatBroadcaster` keeps its loud failure for messages, where silence would lose one.

*Alternative:* `FriendsService` returns who to notify, and the controller asks the chat. That puts a side effect in every controller method, and a future caller of the service would forget it.

*Alternative:* Nest's `EventEmitter`. One more package and an indirection for a single caller.

### 2. Who is told, decided from the relation before the write

`FriendsService` already reads the existing record before every write. It announces after the transaction commits:

| Operation | Told |
|---|---|
| `request` that creates a request | both |
| `request` that accepts, because they asked first | both |
| `request` that changes nothing (already friends, already asked) | nobody |
| `accept` | both |
| `remove` of a pending or accepted relation (decline, withdraw, unfriend) | both |
| `remove` of a block (lifting it, whether or not theirs stands) | the person lifting it |
| `block` where a request or a friendship existed | both |
| `block` of a stranger, or of somebody who had blocked them already | the blocker |

The other person is told exactly when their own lists change. That is when the relation was pending or accepted before the write, because a person blocked sees nothing of a block. The rule in code is one line: the other side is told when `existing?.status` is `pending` or `accepted`, and for `request` when the write created or accepted something.

The event's name is `friends:changed`, with no payload. A client that hears it asks for its own lists, which already show only what they may show.

### 3. The client: one more event on the one connection

- **`chat.socket.ts`** gains `onFriendsChanged` in its handlers.
- **`ChatProvider`** invalidates `friendKeys.all` (from the friends feature's index) and `conversationKeys.all`. A friend who blocks or unfriends changes what a conversation allows: it may become read-only, or disappear from the list (`list-only-conversations-that-open`).
- **A reconnect** already refreshes conversations. It refreshes people too, since events sent while the line was down are lost.

### 4. The waiting count on the desktop

- **The query.** `friends.queries.ts` gains `waitingRequestsQuery()`, with the key `['friends', 'requests']` and `listWaitingRequests`. It sits under `friendKeys.all`, so the same invalidation reaches it.
- **The hook.** `useWaitingRequestCount()` in `friends/use-waiting-request-count.ts` is exported from the index.
- **The badge.** `UnreadBadge` moves to `shared/ui/count-badge.tsx` as `CountBadge({ count, label })`, where `label` makes the accessible name. The chat passes "Непрочитаних: N", and friends pass a new "Запитів: N" from `uk.ts`. The desktop shows it on `/friends`.

*Alternative:* derive the count from `peopleQuery()`. That costs four requests on every desktop visit for one number.

## Risks / Trade-offs

- **[Risk]** An event lost while a connection is down leaves a stale list. → The client refetches on reconnect, on mount and on focus.
- **[Trade-off]** Every change costs the other person's client four requests to refresh the friends screen, even when one list moved. That is cheap at this scale, and it keeps the rule that the API decides which list a person appears in.
- **[Risk]** Blocking somebody who had a request or a friendship tells them "something changed" at that moment. → They learn only what the unfriending already shows, at the same moment, which the design of blocks accepts (ADR-0013).

## Migration Plan

No data or route changes. Rollback is a revert.
