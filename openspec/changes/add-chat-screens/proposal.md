# Proposal

## Why

The last of step 8's changes in [docs/roadmap.md](../../../docs/roadmap.md): the chat, in a browser and on a phone, which is what step 8's last "done when" asks for. Step 6 built the socket and the history, and nothing but a test has ever connected to them.

The author asked for this one to go deeper into sockets than the roadmap required, so it also carries two things the API does not have yet: unread counts, and "typing…".

## What Changes

- The socket allows the client's origin. Socket.IO has its own CORS, separate from `enableCors`, and without this a browser's first handshake is refused.
- `GET /conversations` carries how many messages are unread, and `POST /conversations/with/:username/read` marks them read, through the `lastReadAt` column step 6 left waiting.
- A `typing` event, relayed to friends only and never stored.
- `apps/web`: a connection that lives with the session, and that survives an expired token.
- A chat screen: conversations by most recent, each with its unread count; a shortcut on the desktop, showing the total; a way in from a friend.
- A conversation: history a page at a time, a message that appears at once and settles when acknowledged, messages arriving live, catching up after a dropped connection, and "typing…".

Out of scope:
- **Editing and deleting messages.** The columns wait, as `docs/social.md` left them.
- **Group conversations, lending and advice threads.** After the proof of concept.
- **Attachments, reactions, and sending an outfit.** The generator does not exist yet.
- **Push notifications to a closed app.** They need a service worker, step 11 at the earliest.
- **Rate limiting on socket events.** Named as unaddressed since step 6. The client throttles `typing`, and nothing stops a dishonest client: it is recorded rather than built.

## Capabilities

### New Capabilities
- `web-chat`: the chat as a person sees it.

### Modified Capabilities
- `chat`: the socket's origin, unread counts, and typing.

## Impact

- `apps/api/src/browser/` and `src/chat/` — an adapter that gives the socket its origins, one route, one query, one event.
- `apps/web/src/` — `socket.io-client`, `platform/chat-socket.ts`, a chat context, two screens.
- No migration: `lastReadAt` is already there.
- Requires `add-chat` and `add-friends-screens`, both archived.
