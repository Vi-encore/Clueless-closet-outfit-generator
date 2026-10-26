# Tasks

## 1. The records, and a connection that knows who it is

- [x] 1.1 Claude writes the tests "One direct conversation per pair", "A message belongs to a conversation and a sender", "Messages go with their conversation", "A valid token connects", "No token is refused" and "A tampered token is refused"
- [x] 1.2 Install `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` and `socket.io-client`, and confirm in a scratch file that the client imports cleanly in this ESM project before anything is built on it
- [x] 1.3 Add `Conversation` with a nullable unique `directKey`, `ConversationMember` and `Message` with a client-supplied id, and generate the migration
- [x] 1.4 Add a third test factory that calls `app.listen(0)` and reports the port, since a socket client cannot reach an in-memory handler
- [x] 1.5 Add the gateway: authenticate in namespace middleware rather than `handleConnection`, so an unauthenticated socket is never accepted and cannot race the disconnect; put a guard on the gateway class so a handler added later is closed by default
- [x] 1.6 Join the connected socket to its own room and to the rooms of its conversations; verify the 1.1 tests pass

## 2. A message, live

- [x] 2.1 Claude writes the tests "The message arrives", "The sender is acknowledged", "A conversation that did not exist is reached anyway", "The message is stored", "Sending the same message twice stores one", "A stranger cannot send" and "Blocking stops messages"
- [x] 2.2 Add find-or-create by `directKey`, resolving the unique violation by re-reading rather than failing
- [x] 2.3 Add `message:send`: check `areFriends` first, store under the sender's id, pull the recipient's live sockets into a conversation they have just been given, broadcast, and acknowledge with what was stored
- [x] 2.4 Make a repeated id answer with the stored message instead of writing a second; verify the 2.1 tests pass

## 3. History

- [x] 3.1 Claude writes the tests "Messages come back newest first", "History pages", "A stranger reads nothing", "A conversation appears once there is a message" and "A friendship alone is not a conversation"
- [x] 3.2 Add `GET /conversations` and `GET /conversations/with/:username/messages`, paged like the wardrobe and answering 404 to somebody who is not a friend
- [x] 3.3 Verify the 3.1 tests pass

## 4. Catching up

- [x] 4.1 Claude writes the tests "Only what is newer comes back" and "Nothing was missed"
- [x] 4.2 Add `after` to the history query, walking the same ordered list the other way; verify the 4.1 tests pass and the whole suite stays green
