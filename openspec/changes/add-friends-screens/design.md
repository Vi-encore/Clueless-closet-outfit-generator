# Design

## The shape of it

One screen for people, because the things on it are one list seen from different sides: somebody moves from "asked" to "friend" to "blocked", and a person should watch that happen rather than change tabs to find out. A second screen for a friend's wardrobe.

## Decisions

### One screen, in sheets

`/friends` holds a sheet each for finding somebody, requests waiting, your friends, requests you sent, and the people you blocked, the last three only when they have something in them. Tabs were the alternative, and 98.css draws good ones, but a phone would then hide a waiting request behind a tab nobody has a reason to press.

### After an action, ask again

Every action reloads the lists rather than editing them in place. Accepting a request changes two lists and blocking can change three, and working out which by hand is a second copy of rules the API already holds. The screen is small and the answer is fast. `useLoad` needs a way to ask again, so it gains `reload`.

### The desktop's choices are shortcuts, not links

The author looked at the desktop and found it flat: a blue link on a grey window does not say "choose me". With a second destination arriving, each becomes a shortcut, a large pressable tile with a pixel icon and its name, raised on 98.css's bevel and answering a pointer as the other actions do. [docs/ui.md](../../../docs/ui.md#computer) already calls for shortcuts on a desktop, and `pixelarticons` is the icon set it names as safe. They stay links, so a test finds them by role and a long press works as a link does.

### Removing and blocking ask first

`ConfirmDialog`, the sibling of `ErrorDialog`, with the same frame and an OK and a Cancel. Only for these two: declining a request or unblocking can be undone by asking again, and a dialog on every press would teach people to dismiss them. It needs its question and its answer: Enter must not default to the destructive one, so focus starts on Cancel.

### 404 is one answer

Asking for somebody who blocked you and asking for a name nobody has both answer 404, by design, and the screen keeps them one message. That is the whole of what [ADR-0002](../../../docs/adr/0002-not-found-rather-than-forbidden.md) asks of a client, and it is the kind of thing that a helpful error message would quietly undo.

### Blocked lists only your own blocks

`blockedById` is what makes this honest. A list of rows with status `blocked` on either side would show somebody who had blocked you, which is the one thing that must never leak.

### The two new lists follow `listRequests`

Same view, same order, one clause different. `requestedById: me` for what you sent, `blockedById: me` for what you blocked. Declared before `:username` as the routes around them are, and `requests/sent` has two segments so it could not collide anyway.

## Where the code goes

```
apps/api/src/friends/
  friends.controller.ts   two routes
  friends.service.ts      two queries
apps/web/src/
  api/friends.ts          every friends route
  api/api.interfaces.ts   gains Person and Relation
  shell/confirm-dialog.tsx
  shell/use-load.ts       gains reload
  shell/person-name.ts    display name, or username
  screens/friends.tsx
  screens/friend-wardrobe.tsx
```

## Signatures, as orientation

```ts
// api/friends.ts
export function listFriends(): Promise<Relation[]>;
export function listRequests(): Promise<Relation[]>;
export function listSentRequests(): Promise<Relation[]>;
export function listBlocked(): Promise<Relation[]>;
export function askToBeFriends(username: string): Promise<Relation>;
export function acceptRequest(username: string): Promise<Relation>;
export function endRelation(username: string): Promise<void>;
export function block(username: string): Promise<Relation>;
export function listFriendItems(username: string, cursor?: string): Promise<Page<Item>>;

// shell/use-load.ts
export function useLoad<T>(load: () => Promise<T>): { value: T | null; error: unknown; reload(): void };
```

## Pitfalls

- **`DELETE /friends/:username` means four things**: declining, withdrawing, unfriending and unblocking. One function, `endRelation`, and the screens say which they mean in their own words.
- **Asking somebody who already asked you accepts.** `POST` answers 200 rather than 201 and the relation is `accepted`, so the list has to be read again rather than assumed to hold a sent request.
- **`ItemTile` lives in `wardrobe.tsx`**, and two screens need it now. It moves to `shell/`, without the link, which only the owner's wardrobe wraps it in.
- **A username has rules of its own**: the API lowercases and validates it, so what was typed is not always what comes back. The list shows what the API answers.
- **Sheets on a phone stack long.** Requests waiting go first, because they are what somebody came for.
