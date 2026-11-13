# Proposal

## Why

On a phone, through the tunnel, the author asked somebody to be friends, and the other person accepted. The asker's screen kept showing "you asked" until it was opened again. Requests that arrive are invisible until the friends screen is reopened, and nothing on the desktop says one is waiting.

The chat already answers this kind of problem: its events reach every connection of a person through a room per user. The comment on that room says notifications will want it too. Friends are the first thing that does.

The author also found the way to a friend's wardrobe hidden behind an unstyled name. A "Гардероб" button now leads there, added during the phone check. This change records it in the spec.

## What Changes

- **The API announces every change to a relation** with an event, `friends:changed`, on the chat's connection, to the people whose lists it changes:
  - a request reaches both;
  - accepting, declining, withdrawing and unfriending reach both;
  - blocking a friend or somebody with a request reaches both, because the other person's list loses them, exactly as an unfriending would;
  - blocking a stranger, and lifting a block, reach only the person who did it.
  - The event carries nothing. Each client asks for its own lists again, so the event can say no more than the lists already do.
- **A small `realtime` module in the API** holds the Socket.IO server and the room per person, so that friends can announce without depending on the chat module, which depends on friends.
- **The client refreshes its people when the event arrives.** That covers the friends screen, a friend's wardrobe and the desktop's count. It refreshes the conversations as well, since a block or an unfriending changes what a conversation allows.
- **The desktop's "Друзі" shortcut shows how many requests are waiting,** as "Чат" shows what is unread. The badge becomes one shared component for both.
- **The "Гардероб" button on a friend's row** becomes a scenario of the friend's wardrobe requirement.

Out of scope:

- **Push notifications to a closed app.** That needs a service worker and push subscriptions: `add-pwa` or later.
- **Sounds and pop-ups.**
- **Live updates of a friend's shared items** while their wardrobe is open.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `friendships`: adds the requirement that a change to a relation is announced to the people it changes.
- `web-friends`: adds live updates and the desktop's count of waiting requests, and the wardrobe button as a scenario of "A friend's wardrobe can be read".

## Impact

- **`apps/api`:**
  - a new `realtime/` module (`RealtimeService` with the server and `toPerson`, and `userRoom` moving there from `chat/chat.utils.ts`);
  - `ChatBroadcaster` uses it;
  - `ChatGateway.afterInit` attaches the server to it;
  - `FriendsService` announces after each write.
- **`apps/web`:**
  - `chat.socket.ts` and `ChatProvider` hear `friends:changed` and refresh the people and the conversations;
  - `features/friends` exports a hook for the waiting count;
  - `UnreadBadge` becomes a shared `CountBadge`;
  - the desktop shows it on "Друзі".
- **No database or REST change.**
- **Docs:** `docs/social.md` (how the chat works), `openspec/config.yaml`.
