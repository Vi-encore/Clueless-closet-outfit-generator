# Design

## The model

```prisma
/// One person's side of a relationship with another: a request, a friendship or a
/// block. A pair has two of these, one each, written and removed together.
model Friendship {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String  @db.Uuid   // whose record this is
  otherUserId String  @db.Uuid   // the person it is about
  user        User    @relation("FriendshipHeld", fields: [userId], ..., onDelete: Cascade)
  otherUser   User    @relation("FriendshipAbout", fields: [otherUserId], ..., onDelete: Cascade)
  status        String  @default("pending")   // the same on both sides
  requestedByMe Boolean @default(false)
  blocked       Boolean @default(false)       // this person has blocked the other
  createdAt, updatedAt
  @@unique([userId, otherUserId])
  @@index([userId, status])
}
```

`User` gains `friendships Friendship[] @relation("FriendshipHeld")` and `friendshipsAboutMe Friendship[] @relation("FriendshipAbout")`.

## Status is shared, the rest is per side

**What is copied:** `status` (`pending`, `accepted`, `blocked`) is the state of the relation, so both sides carry the same value. It stays `blocked` while either side's `blocked` is set, as today.

**What belongs to one side:** `requestedByMe` and `blocked`. Each is about the person who holds the record.

**The alternative:** status from each person's point of view (`sent`, `received`, `friends`), which would fold `requestedByMe` into it. It reads well, but the two sides would then hold different words for one state, every transition would need a table of pairs, and `FriendshipView` would have to translate back into what the API answers today. Copying one value is less to get wrong.

## Both sides, always together

Every write touches both rows inside `prisma.$transaction`:

| Operation | Writes |
| --- | --- |
| request | creates my row (`requestedByMe: true`) and theirs (`false`) |
| accept / ask back | `status: accepted` on both |
| block | upserts both; `blocked: true` on mine; `status: blocked` on both |
| lift my block, theirs stands | `blocked: false` on mine only |
| remove | deletes both |

**Concurrent requests:** two people asking each other at the same moment is caught as before. Both transactions insert both rows, so the second hits the unique index on `(userId, otherUserId)` and falls into the existing "they asked at the same moment" path.

What ADR-0004 had the database guarantee, "one per pair", becomes two guarantees:
- the index makes it one per side;
- the service makes it two sides or none.

The second is no longer enforced by SQL. That is the price, and the new scenario "Both sides change together" is there to catch a write that forgets one.

## Reading

- `listFriends` etc.: `findMany({ where: { userId: me, status }, include: { otherUser } })`.
- `listBlocked`: `where: { userId: me, blocked: true }`. A block placed on me is on their row, which I never read.
- `hasBlocked(me, them)`: my row, `blocked`.
- `areFriends(a, b)`: a's row about b, `status: accepted`.
- `findRow(me, them)`: `findUnique({ where: { userId_otherUserId: { userId: me, otherUserId: them } } })`.

`blockColumns`, `pairOf`, `eitherSide` and `PairColumns` go. `sortedPair` stays for conversations.

## The migration

The migration is hand-written, like `block_per_side`, because Prisma would drop the table and create a new one, losing every relation:

1. Copy the old rows aside: `CREATE TEMP TABLE old_friendship AS SELECT * FROM "Friendship"`.
2. `DROP TABLE "Friendship"` and create the new one with the names Prisma expects:
   - `Friendship_pkey`;
   - `Friendship_userId_otherUserId_key`;
   - `Friendship_userId_status_idx`;
   - `Friendship_userId_fkey`;
   - `Friendship_otherUserId_fkey`.
3. Insert two rows from each old one with `UNION ALL`: the lower user's side (`blocked = "blockedByLower"`, `requestedByMe = "requestedById" = "lowerUserId"`), then the higher user's side.
4. Check there is no drift: `prisma migrate diff --from-migrations … --to-schema …` must come back empty.

**Checked on real rows:** the author's development database holds a block between `formcheck` and `friendcheck`. Count and read the rows before and after migrating.

## Pitfalls

- **An `upsert` per side inside the transaction for `block`.** One side can exist without the other only if something went wrong, but blocking a stranger creates both.
- **`include` names change** (`lowerUser`/`higherUser` become `otherUser`), so `FriendshipView` is built from `row.otherUser`.
- **Indexes.** `@@index([userId, status])` replaces the two side indexes. The unique index already covers lookups by `(userId, otherUserId)`.
- **Status rules.** Do not let the copied `status` differ between sides when lifting a block. When theirs stands, both stay `blocked`. When neither does, both rows go.
