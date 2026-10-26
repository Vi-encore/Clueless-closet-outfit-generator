# Design

## Context

Everything in the API so far has been a request with an answer. A socket is a connection that outlives the request, belongs to a person rather than a call, and can be spoken to at any moment — which changes where identity is established, where authorisation is checked, and what a test has to set up.

The decisions about conversations were taken while planning `add-friends` and recorded in the roadmap; this restates them with the detail the implementation needs.

## Goals / Non-Goals

**Goals:** a connection that knows who it is; a message that arrives live, is stored once, and can be caught up on; friendship as the gate on every message.

**Non-Goals:** typing indicators, read receipts, attachments, group conversations, several instances.

## Decisions

### 1. The token travels in the handshake's `auth`, not the URL

Socket.IO offers both. A query string ends up in access logs, in proxy logs, and in the `Referer` of anything the page loads next; an access token is a bearer credential and belongs in none of those.

The token goes to `AuthService.verifyAccessToken` — the method step 4 built for exactly this, because a Passport strategy needs a request and there is none here.

### 2. The check is namespace middleware, not `handleConnection`

`handleConnection` runs after the connection has been established, and it is asynchronous because verifying means a database lookup. A client that emits `message:send` immediately is therefore racing the disconnect: the window is small, and it is the window in which an unauthenticated socket can be heard.

Middleware runs before the connection exists at all, and refusing is how it says no:

```ts
afterInit(server: Server) {
  server.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') return next(new Error('unauthorized'));
    try {
      socket.data.user = await this.auth.verifyAccessToken(token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
}
```

Nothing can be emitted at a socket that was never accepted.

Beside it, a guard on the gateway class checking that `socket.data.user` is there. The middleware already guarantees it, so the guard never fires today — it is there so that the project's rule survives into a gateway: a handler added later without a thought is still closed, because the thing to remember is on the class rather than on each method. That is the same bargain `@Public()` makes over HTTP, read the other way round.

### 3. The conversation is created by the first message

Creating one with every friendship would mean an empty room per pair, most of them never used. The cost of the other way round is two things, both small, and the second is wanted anyway.

**A race.** Two people writing to each other at the same moment would each find no conversation and create one. The fix is the same as `Friendship`: a `directKey` of the two ids sorted and joined, with a unique index, so the second write loses and re-reads. The column is nullable — group conversations later have no such key, and Postgres allows many nulls in a unique index.

**A room nobody is in yet.** A socket joins the rooms of the conversations it is a member of when it connects. A conversation created afterwards has a room the recipient's socket never joined, so the broadcast would reach only the sender. Socket.IO can pull them in:

```ts
await this.server.in(userRoom(recipientId)).socketsJoin(conversationRoom(id));
```

which needs a room per user, joined at connect. That room is wanted regardless — live notifications, and the try-on status in step 15, are addressed to a person rather than a conversation.

### 4. A direct conversation is addressed by the person, not by its id

`message:send` carries a username, and so does the history route. For a conversation between two people the conversation itself is bookkeeping: the client knows who it is talking to, and making it learn an id first would mean a round trip before the first message.

Group, loan and advice conversations will have to be addressed by id, because a set of people has no shorter name. That is a later shape and this does not block it: the records already carry a `type` and a member table.

### 5. The client makes the message id, and that is what makes a retry safe

A socket can drop between the server storing a message and the acknowledgement arriving. An honest client then resends, and without an id of its own that would be a second message.

So the client generates a UUID and the server stores it as the primary key. A resend collides on that key, and the collision is the answer rather than an error: the stored row is read back and acknowledged as though it had just been written. The client cannot tell the two cases apart, and should not have to.

### 6. Friendship is checked on every message, not only at creation

The alternative is checking at creation and trusting membership afterwards, which would let somebody keep messaging after being blocked — and blocking exists precisely to stop that.

Because `areFriends` already answers false for a blocked pair, one check covers unfriending and blocking both, and the gateway needs no idea what blocking is.

### 7. Reading the history and catching up are one route with two directions

`GET /conversations/with/:username/messages` answers newest first with a cursor for older ones, like the wardrobe. `?after=<id>` reverses it: everything newer than a message the client already has, oldest first, which is what a reconnection asks for.

Two modes on one route rather than two routes, because they differ only in which way they walk the same ordered list.

## Module layout

```
apps/api/src/chat/
  chat.module.ts
  chat.gateway.ts            // connection, disconnection, message:send
  chat.service.ts            // find-or-create, store, history
  conversations.controller.ts
  requests/
    send-message.request.ts
    list-messages.query.ts
  rooms.ts                   // userRoom(id), conversationRoom(id)
```

## Common pitfalls

- **A global `APP_GUARD` does run for a gateway, and both of ours break there.** This was written the other way round first, and the tests corrected it: `JwtAuthGuard` extends Passport's and reads the request's `authorization` header, so on a socket message it throws `TypeError` on `undefined.authorization` — a bug wearing a refusal's clothes. `ThrottlerGuard` has nothing to count and would key every socket on one `undefined` tracker. Both now return early unless `context.getType()` is `http`, and a socket is guarded where its identity is established instead. Flooding a socket is a real concern that nothing addresses yet; it is named rather than pretended away.
- **Nothing cascades to a `Conversation`.** It holds no user column — membership does — so deleting every member leaves the conversation behind with none. It does not matter yet, because deleting an account is not built, but a test that empties the database has to say so explicitly.
- **A fixed port in the tests is a trap.** Two test files, or one process left over from a previous run, would collide, and the failure reads as a flaky test rather than a busy port. `app.listen(0)` asks the operating system for a free one and `getHttpServer().address()` says which.
- **A socket that goes wrong says nothing, so a test hangs instead of failing.** Every wait gets a timeout — the acknowledgement wrapper and the one that waits for an incoming event both reject after a couple of seconds, so a broken gateway produces a readable error rather than a run that has to be killed.
- **Clients must be closed before the application.** Track every client a test opens and disconnect them all in `afterEach`, then close the app: the other order leaves `app.close()` waiting on connections that nobody is going to end.
- **`socket.io-client` types are their own shape.** Compile `import { io, type Socket } from 'socket.io-client'` in a scratch file before building on it — task 1.2, and the same precaution that saved an evening on `passport-jwt` in step 4.
- **Acknowledgements are a callback, not an event.** `socket.emit('message:send', payload, (ack) => …)` — a test that listens for an event instead waits forever, which is what the timeouts above turn into a failure.

## Risks / Trade-offs

- [Rooms live in one process, so a second instance would not see the first one's sockets] → the Socket.IO Redis adapter when that day comes; the same note the rate limiter already carries.
- [Friendship is read from the database on every message] → one indexed lookup per message, and correctness here is worth more than the saving; a cache would have to be invalidated by blocking, which is the case that matters most.
