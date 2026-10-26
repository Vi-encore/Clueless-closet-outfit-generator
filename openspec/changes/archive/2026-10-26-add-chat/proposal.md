# Proposal

## Why

`add-friends` left two people connected with nothing to say to each other. This is the other half of roadmap step 6, and the first part of the project where the server speaks first: everything so far has answered requests, and a chat has to push.

It is also where two pieces built earlier are finally used for what they were built for. `AuthService.verifyAccessToken` exists because step 4 decided a token would one day have to be checked outside HTTP, where no Passport strategy can run — this is that day. `FriendsService.areFriends` was written in `add-friends` and called by nothing but the wardrobe; here it becomes the gate on every message.

## What Changes

- A Socket.IO gateway that authenticates the connection at the handshake, from the `auth` payload rather than the URL.
- `message:send` stores a message and pushes it to both people's live connections; the sender gets an acknowledgement carrying what was stored.
- A conversation comes into being with the first message, not with the friendship, so nobody accumulates empty rooms for every friend they have.
- `GET /conversations` lists the conversations that exist, and `GET /conversations/with/:username/messages` reads their history a page at a time, newest first.
- The same route with `after` returns what arrived while a client was away, which is how a reconnection catches up.
- `Conversation`, `ConversationMember` and `Message` records.

Out of scope:
- **"Typing…" and read receipts.** The roadmap asks for messages that arrive, are stored, and can be caught up on; these are the layer above that.
- **Attachments.** Forwarding an item or an outfit into a conversation is listed after the proof of concept, and needs its own access check.
- **Group, loan and advice conversations.** The table carries a `type` so they fit later; only `direct` exists now.
- **Editing and deleting a message.** The columns are there, nothing writes them.
- **Several API instances.** The gateway holds its rooms in one process; more than one needs the Socket.IO Redis adapter, which is the same note the rate limiter carries.

## Capabilities

### New Capabilities
- `chat`: messages between friends, live and afterwards.

### Modified Capabilities
- `data-persistence`: conversations, their members and their messages.

## Impact

- New `apps/api/src/chat/` — the gateway, a service, the REST controller and the request schemas.
- New dependencies: `@nestjs/websockets`, `@nestjs/platform-socket.io` and `socket.io`, all 12.2.0 / 4.8.4 and compatible with Nest 12; `socket.io-client` for the tests.
- A third application factory in the tests: a socket client needs a real port, which `supertest` never opens.
- A migration: three tables.
- Requires `add-friends`, done and archived.
