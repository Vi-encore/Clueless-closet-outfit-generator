# Proposal

## Why

The third part of step 8 in [docs/roadmap.md](../../../docs/roadmap.md) is friends and the chat, and at about fifteen requirements it is split in two, for the reason step 6 was: the chat needs friends, and friends do not need the chat. This is the first half. Step 6 built friendships on the API and nothing has been able to use them except Swagger.

Reading `block` for this change turned up a hole that has been there since step 6: somebody blocked could block back, which made the single `blockedById` theirs, and then remove the relation, lifting the block on themselves. Each side of a pair now holds its own block, so the server knows both while a person sees only theirs: [ADR-0013](../../../docs/adr/0013-each-side-holds-its-own-block.md).

Building the screens turns up two more gaps in the API. A person can block somebody and has no way to see who, so a block could never be undone from a screen. And `GET /friends/requests` answers only with what is waiting for you, so a request you sent could not be seen or withdrawn.

## What Changes

- `GET /friends/blocked`: the people you have blocked. Only those: somebody who has blocked you stays invisible, as [ADR-0002](../../../docs/adr/0002-not-found-rather-than-forbidden.md) requires.
- `GET /friends/requests/sent`: the requests you made that are still unanswered.
- A friends screen, reached from the desktop: your friends, requests in both directions, and finding a person by their exact username.
- Accepting, declining and withdrawing requests; removing a friend; blocking and unblocking, with a confirmation before the two that hurt.
- A friend's wardrobe: what they marked for friends.

Out of scope:
- **The chat, and a way into it from a friend.** `add-chat-screens`, next.
- **A public directory or search by anything but the exact name.** [docs/social.md](../../../docs/social.md) rules it out, and the API has no such route.
- **A friend's item card.** `GET /items/:id` answers only to the owner, and the tile already carries what is shared. It belongs with lending, after the proof of concept.
- **Notifications about a new request.** The screen shows them when it is opened. Live ones need the socket, and arrive with the chat if at all.
- **Display names on the account.** Sign-up does not ask, and a screen shows the username where there is none.

## Capabilities

### New Capabilities
- `web-friends`: friends as a person sees them.

### Modified Capabilities
- `friendships`: the two lists above.

## Impact

- `apps/api/src/friends/` — two routes and two queries, and blocks by side.
- `apps/api/prisma/` — `blockedById` becomes `blockedByLower` and `blockedByHigher`, by a hand-written migration that carries existing blocks across.
- `apps/web/src/` — `screens/friends.tsx`, `screens/friend-wardrobe.tsx`, `api/friends.ts`, `shell/confirm-dialog.tsx`, a shortcut on the desktop.
- `docs/roadmap.md` and `openspec/config.yaml` — step 8 becomes four changes.
- Requires `add-friends` and `add-wardrobe-screens`, both archived.
