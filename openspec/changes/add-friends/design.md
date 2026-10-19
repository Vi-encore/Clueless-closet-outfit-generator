# Design

## Context

A friendship is one relationship between two people, but every request that creates or changes it arrives from one side. Most of the difficulty in this change is keeping those two facts from producing two rows, two truths, or a rule that only works in the direction it was written.

## Goals / Non-Goals

**Goals:** one row per pair whichever way round it was asked; a blocked person who cannot reach back; `visibility: friends` finally meaning something.

**Non-Goals:** the chat, a user directory, notifications, moderation beyond blocking.

## Decisions

### 1. The pair is stored sorted, not as requester and addressee

The obvious table is `requesterId` / `addresseeId` with a unique index on the two. It does not work: that index permits `(A, B)` and `(B, A)` to exist side by side, and nothing in SQL stops the second one from being written a millisecond after the first.

So the identity of the row is the sorted pair:

```prisma
userAId  String @db.Uuid   // always the smaller of the two uuids
userBId  String @db.Uuid
@@unique([userAId, userBId])
```

and who did what is recorded separately: `requestedById` for who asked, `blockedById` for who blocked. The database then guarantees what the application wants to be true, instead of the application trying to guarantee it under a race.

The cost is that "my friends" reads `where: { OR: [{ userAId: me }, { userBId: me }] }` and the other person has to be picked out of whichever column is not yours. That is a helper, not a problem.

### 2. Asking somebody who already asked you means yes

With one row per pair, A sending a request to B while B's request is already pending cannot create a second row. The question is what it should do instead of failing.

It accepts. Somebody who asks to be friends with a person who has asked to be friends with them has said yes in every sense that matters, and answering 409 would mean the two of them stare at each other's pending requests until one notices they are supposed to press a different button.

### 3. Every ending is the same ending, and it is a deletion

Declining a request, cancelling one you sent, unfriending and unblocking all leave the same state: these two people are not connected. So they are one route, `DELETE /friends/:username`, and the row goes away.

Keeping a `declined` status instead would record a soft no forever, and would hand the person who was declined a way to find out. The trade-off is that nothing stops a declined request from being sent again - which matters in an application with a public directory and does not in one where a stranger has to know your exact username to reach you at all.

**One exception, and it is the important one:** when the row is blocked, only `blockedById` may delete it. Otherwise the blocked person could lift their own block, which would make blocking decorative.

### 4. Blocking lives on the friendship row

A separate `Block` table would be right in an application where you can be bothered by somebody you have no relationship with. Here you cannot: there is no public directory, and nothing can be sent to a person who is not a friend. A stranger's only way to reach you is a friend request - which creates the row first.

`blockedById` is what makes the row honest. `status = blocked` alone does not say who blocked whom, and `requestedById` does not answer it either, because the person who asked and the person who later blocked may be the same or not.

### 5. A friend reads a wardrobe, not an item id

`GET /items/:id` stays exactly as strict as step 5 made it: owner or 404. Loosening it would mean `ownedOrNotFound` growing a second meaning, and that method's whole value is that it has one.

A friend's view is its own route, `GET /users/:username/items`, served by a second method with its own rule:

```ts
// items.service.ts
listVisibleTo(viewerId: string, ownerUsername: string): Promise<Item[]>
```

which returns items that are `visibility: 'friends'`, not archived, and belonging to somebody the viewer is actually friends with. A viewer who is not a friend gets the same 404 a stranger's item gets - not an empty list, which would confirm the person exists.

### 6. Blocking hides the wardrobe for free

Because visibility goes through "are these two friends", and a blocked pair's status is `blocked` rather than `accepted`, a block removes the wardrobe without a line of code about wardrobes. This is the argument for keeping the block on the friendship row rather than beside it.

## Module layout

```
apps/api/src/users/
  users.module.ts
  users.controller.ts        // GET /users/:username, GET /users/:username/items
  users.service.ts           // finding a person, and the public view of one
apps/api/src/friends/
  friends.module.ts
  friends.controller.ts
  friends.service.ts         // the sorted pair, the state transitions, areFriends()
```

`areFriends(a, b)` is the method `add-chat` will ask before letting a conversation exist, so it belongs to the service rather than inside a query somewhere.

## Common pitfalls

- **Usernames are stored lowercased** (step 4 normalises them at sign-up), so a lookup that does not lowercase will fail to find people whose name was typed with capitals in the URL.
- **Befriending yourself.** The sorted pair collapses to `userAId === userBId`, which the unique index happily accepts. It has to be refused explicitly.
- **A person who does not exist and a person who blocked you should look the same** from the outside, or blocking announces itself.
- **The unique violation is a real outcome, not only a race.** P2002 arrives whenever two requests cross, and translating it into the "already asked" answer rather than a 500 is part of the feature.
- **Listing friends returns people, not rows.** The response should be the other person's public view, which means mapping each row by which side the viewer is on.

## Risks / Trade-offs

- [A declined request can be sent again immediately] → accepted, because reaching somebody at all requires knowing their exact username; revisit if a directory ever exists.
- [The sorted-pair layout makes every query mention both columns] → contained in the service, which is the only place that builds these queries.
