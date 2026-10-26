# Proposal

## Why

Roadmap step 6 is friends and a chat between them. Those are one step but not one change: a chat needs a gateway, rooms, a handshake to authenticate and a reconnection story, while friendships need none of it. Splitting them along that line leaves this change entirely over REST, and leaves the WebSocket work with nothing else competing for attention — see `add-chat`, which follows.

Friends are also the first thing in the project that is worth having on its own. After this change two accounts can find each other, agree to be friends, and one of them can see the part of the other's wardrobe that was marked for friends. That marking has existed since step 5 and has meant nothing so far; this is where `visibility: friends` starts being true.

## What Changes

- `GET /users/:username` finds one person by their exact username, and says nothing about anybody else.
- `POST /friends/:username` asks to be friends; `GET /friends/requests` lists the asks waiting for you; `POST /friends/:username/accept` agrees.
- `GET /friends` lists the people who agreed.
- `POST /friends/:username/block` blocks somebody, which hides the wardrobe and refuses further requests.
- `DELETE /friends/:username` removes whatever relation exists — a request nobody answered, a friendship, or a block — so that "we are not connected" has one way of being reached.
- `GET /users/:username/items` shows a friend the items marked `friends`.
- A `Friendship` record, stored once per pair whichever way round it was asked.

Out of scope:
- **The chat.** Conversations, messages, the gateway and everything real-time belong to `add-chat`.
- **A public directory or search.** People are found by an exact username and no other way, which is a decision from `docs/data-model.md`, not a simplification.
- **Sharing outfits.** `Outfit` does not exist yet; `visibility` on it arrives with the generator in step 10.
- **Reporting, muting and moderation.** Blocking is the whole of it for the proof of concept.
- **Notifying somebody that they have a request.** Nothing is pushed anywhere until there is a socket to push it down.

## Capabilities

### New Capabilities
- `friendships`: who is connected to whom, and who refuses to be.

### Modified Capabilities
- `wardrobe-items`: an item marked `friends` becomes readable by one.
- `data-persistence`: the database guarantees one friendship per pair.

## Impact

- New `apps/api/src/friends/` — module, controller, service and request schemas.
- New `apps/api/src/users/` — the one route that finds a person, which is not a friendship concern.
- `ItemsService` gains a second access check beside `ownedOrNotFound`, for a reader who is not the owner.
- A migration: the `Friendship` table.
- Requires step 5 (`add-wardrobe-items`), done and archived.
