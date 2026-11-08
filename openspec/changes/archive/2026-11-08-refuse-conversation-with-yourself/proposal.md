# Proposal

## Why

Opening `/chat/<own username>` shows an empty conversation with yourself and a field to write in, where any other address nobody can be written to shows the not-found window. It was seen when a person signed in and the session guard returned them to the address the previous account had left open: `formcheck` landed on `/chat/formcheck`.

The cause is in the API. `ChatService.readableConversation` lets a person through when the username is their own, so `GET /conversations/with/:username/messages` answers an empty page and `POST /conversations/with/:username/read` answers 204. `message:send` already refuses, but with 400 and words of its own, so the client has nothing it recognises as "this conversation does not exist".

## What Changes

- **The API answers a person's own username as it answers a stranger's:** 404 `No such person` on the history and on marking read, and the same refusal on `message:send`, in place of 400 `You cannot message yourself`. One check in `ChatService`, beside the lookup, like `FriendsService`'s `You are already your own friend`.
- **The client shows `NotFound` for the signed-in person's own username** without asking the API: it already knows who is signed in, and the not-found window is what it shows for a 404 anyway.

Out of scope:
- **Where the session guard sends a person after signing in.** Returning to the previous account's address is how this was found, not what this change is about.
- **Typing to yourself,** which already reaches nobody: nobody is their own friend.
- **Any other screen addressed by username,** such as a friend's wardrobe.

## Capabilities

### Modified Capabilities
- `chat`: nobody has a conversation with themselves.
- `web-chat`: a conversation with yourself is not found.

## Impact

- `apps/api/src/chat/chat.service.ts` and `apps/api/test/chat.db-spec.ts`.
- `apps/web/src/features/chat/conversation.tsx` and `chat.spec.tsx`.
- No change to the database, the routes or the shapes they answer with.
