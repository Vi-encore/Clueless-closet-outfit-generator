# Design

## The shape of it

HTTP is a question and an answer. A chat needs the server to speak first, so a socket stays open and either side can send at any moment. Almost everything hard about this change follows from that one difference: a connection is a thing with a lifetime, it fails in ways a request does not, and a message can be lost in the gap.

The author asked to understand this part in depth, so each group's report explains its socket work in plain words, and this document says why each piece is the way it is.

## Decisions

### The socket has its own CORS

`app.enableCors` covers Express. Socket.IO runs its own HTTP handling for the handshake, so without its own `cors` option a browser on `localhost:5173` is refused, and it is the first thing that would fail. `@WebSocketGateway({ cors })` cannot read `ConfigService`, because a decorator's argument is evaluated at import. A small `IoAdapter` subclass takes the origins from `setupBrowserAccess`, so there is one list, `WEB_ORIGINS`.

A true WebSocket is not subject to CORS at all, and only the polling transport is. Credentials here travel in `auth`, never in a cookie, so a page on another origin has nothing to ride on, which is why this stops at CORS rather than adding an `allowRequest` check.

### One connection, owned by the session

`platform/chat-socket.ts` wraps `socket.io-client`, and is the seam Capacitor would keep. A `ChatProvider` under `SessionProvider` connects when the session is `signed-in` and closes when it is not. Screens subscribe; they never connect. A connection per screen would drop live delivery whenever somebody changed screen.

### A token is read at each attempt, and renewed when refused

Socket.IO's `auth` accepts a function, called for every connection attempt, so a reconnect uses the current token rather than the one from the morning. The token is checked only at the handshake: a connection that is already open outlives its fifteen minutes, which is safe because friendship is checked on every message.

The trap is a reconnect after the token expired. The middleware refuses, `connect_error` says `unauthorized`, and Socket.IO does **not** retry a refusal by the server. The client renews through `renewAccessToken`, the same single-flight as HTTP, and connects again by hand. If the renewal fails, the session is over.

### A message has two lives

It appears the moment it is sent, as waiting, under an id the client made with `crypto.randomUUID()`, and settles on the acknowledgement. That id is [ADR-0008](../../../docs/adr/0008-the-client-generates-ids-it-can-retry.md): sending again is safe, because the server answers a repeat with the stored message. `emitWithAck` with `socket.timeout` turns "no answer" into a rejected promise, which is what lets a person try again.

`crypto.randomUUID` exists only on a secure context. `localhost` and the tunnel's https are both fine; a phone on plain LAN http is not, and the tunnel is how a phone gets here anyway.

### Live messages are merged by id

The room delivers a message to everybody in it, the sender included, so that a second device sees it. So a sender's own message arrives twice, once as the acknowledgement and once as an event. Everything goes through one function that adds or replaces by id, and order comes from `createdAt` rather than from arrival.

### Catching up is one question

On every reconnect the open conversation asks for what came after the last settled message, with the `after` the API already has. Socket.IO's buffering does not cover this: a message emitted while a client was away is simply gone from the socket, and is in the database. That is why storing comes first.

### Unread is counted by the database

`lastReadAt` is on `ConversationMember`, and counting per conversation with `count` would be one query each. The conversation list did not need that when `tidy-after-review` removed exactly such a pattern, and does not now: one `$queryRaw` with a join and a `GROUP BY` beside the list. Raw, because Prisma cannot compare one table's column with another's in a filter.

A null `lastReadAt` means nothing was ever read, so everything from the other person counts.

### Typing is thrown away

No row, no acknowledgement, no retry: if it is lost, nothing is lost. The client sends at most one per three seconds, and the receiver forgets after five, so a person who stopped typing, or dropped, clears by themselves. The gateway checks friendship on each one, since blocking has to stop this too, and it costs one indexed query at that rate.

## Testing a socket

MSW answers HTTP. For the socket, the tests run a real Socket.IO server in the test process, on port 0, with a few lines of handlers. That is better than a fake: reconnecting, refused handshakes and acknowledgements are the protocol's behaviour rather than a stand-in for it. If it cannot run in jsdom, the fallback is a fake behind `platform/chat-socket.ts`, and the group's report will say so.

The two-browser check at the end is what proves the real gateway.

## Where the code goes

```
apps/api/src/browser/
  io-adapter.ts           Socket.IO with the configured origins
apps/api/src/chat/
  chat.controller.ts      POST with/:username/read
  chat.service.ts         unread counts, markRead
  chat.gateway.ts         typing
  chat-broadcaster.ts     typing
apps/web/src/
  platform/chat-socket.ts the socket, and nothing about screens
  api/chat.ts             conversations, history, read
  chat/chat.context.ts    the context, alone, as the session's is
  chat/chat.provider.tsx  connecting, status, unread total
  chat/use-conversation.ts messages, sending, catching up, typing
  screens/chat.tsx        the list
  screens/conversation.tsx
```

## Signatures, as orientation

```ts
// platform/chat-socket.ts
export function connectChat(handlers: ChatHandlers): ChatConnection;

interface ChatConnection {
  send(message: OutgoingMessage): Promise<SendAck>;
  typing(to: string): void;
  close(): void;
}

// chat/use-conversation.ts
export function useConversation(username: string): {
  messages: ShownMessage[];
  send(body: string): void;
  retry(id: string): void;
  loadEarlier(): void;
  theyAreTyping: boolean;
};
```

## What to read

- [Socket.IO client: `auth`](https://socket.io/docs/v4/client-options/#auth), and [connection lifecycle](https://socket.io/docs/v4/client-socket-instance/).
- [Socket.IO: handling CORS](https://socket.io/docs/v4/handling-cors/).
- [Acknowledgements and timeouts](https://socket.io/docs/v4/emitting-events/#acknowledgements).
- [Delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/), for why at-most-once is the default and what the stored id adds.

## Pitfalls

- **`connect_error` from the middleware does not retry**; a dropped connection does. They need different handling, and `socket.active` says which it was.
- **StrictMode mounts twice**, so a provider's effect must close what it opened, or a developer has two sockets and every message twice.
- **A listener added in an effect must be removed**, or each visit to a screen adds another.
- **`Date` does not survive JSON.** A message's `createdAt` is a string on the socket and from REST alike.
- **A failed `POST read` must not stop the screen.** It is bookkeeping.
- **The scroll position** belongs at the newest message on arrival, and must not jump when earlier ones are added above.
- **A long-open tab keeps a socket** when its access token has long expired. That is expected, and is why friendship is checked per message.
