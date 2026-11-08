# Design

## Context

`apps/api/src/outfits/` holds one public route, `POST /outfits/score`, which stores nothing. `@closet/core` now has `generateOutfits` and `SYSTEM_OCCASIONS` (`add-outfit-generator`). `Item` already has `wearCount` and `lastWornAt`; `User.timezone` (default `Europe/Kyiv`) is read by nothing yet. `ItemsService` owns the rule that an item is fetched only together with its owner (`ownedOrNotFound`) and the way an item is answered with its photo links (`withPhoto`, private).

## Decisions

### Tables

```prisma
model Outfit {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerId   String    @db.Uuid            // -> User, onDelete: Cascade
  occasion  String                        // an OCCASIONS code
  score     Float?                        // null for a combination that was not generated (diary, later)
  breakdown Json?
  reaction  String?                       // 'like' | 'dislike'
  savedAt   DateTime? @db.Timestamptz(3)
  createdAt DateTime  @default(now()) @db.Timestamptz(3)
  items     OutfitItem[]
  wearLogs  WearLog[]
  @@index([ownerId, savedAt])
}

model OutfitItem {
  outfitId String @db.Uuid                // -> Outfit, onDelete: Cascade
  itemId   String @db.Uuid                // -> Item, onDelete: Cascade
  slot     String
  @@id([outfitId, itemId])
}

model WearLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerId   String   @db.Uuid             // -> User, onDelete: Cascade
  outfitId  String   @db.Uuid             // -> Outfit, onDelete: Cascade
  date      DateTime @db.Date
  photoKey  String?
  note      String?
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  @@unique([outfitId, date])
  @@index([ownerId, date])
}
```

- **`occasion` is a code, not `occasionId`.** There is no `Occasion` table (author's decision in `add-outfit-generator`); [data-model.md](../../../docs/data-model.md#outfit-and-outfititem) is corrected. Custom occasions will add a nullable foreign key beside it.
- **`ownerId` on `WearLog`** as well as through the outfit: the diary and statistics read wear records by person and date, without a join.
- **`@@unique([outfitId, date])`** makes "once a day" the database's promise, not a hope of the service: two taps at once cannot both count.
- Items are archived, never deleted, so `OutfitItem → Item` cascading only matters when the owner goes.

### Every generated outfit is stored

Author's decision. `generate` writes the `Outfit` with its items in one nested `create`, so like, save and wear work on an id and a dislike is kept for the preferences component later. The table grows with every "another one"; at PoC scale that is nothing, and a clean-up of old unsaved, unreacted, unworn outfits is a later job.

### `POST /outfits/generate`

Body (`generate-outfit.request.ts`): `occasion: z.enum(OCCASIONS)`, `mustInclude?: z.array(z.uuid()).max(6)`, `seen?: z.array(z.uuid()).max(50)`.

1. Read the person's items with `status: 'available'`.
2. Turn each row into an `OutfitItem` with `outfitItemSchema.safeParse({ ...tagsOf(row), id })`. A row whose stored tags no longer parse (a vocabulary changed) is left out, not a 500. `tagsOf` moves from `items.service.ts` to `items/tags-of.ts` so both services use it.
3. Read the item ids of the `seen` outfits, **only the person's own** (`where: { id: { in: seen }, ownerId }`); a foreign id simply contributes nothing.
4. `generateOutfits({ items, occasion: SYSTEM_OCCASIONS[code], mustInclude, seen })`. A `mustInclude` id of someone else's item, an archived one or a made-up one is not in `items`, so the generator answers `[]`. The three cases look the same from outside, so nothing leaks.
5. None → `{ outfit: null }`. One → store it and answer `{ outfit: OutfitView }`.

The answer is always 200 with `{ outfit }`. A 201 only when something was stored would give one route two success codes for one action; the body says what happened.

### Views

`OutfitView` (`outfits.interfaces.ts`): `id`, `occasion`, `score: OutfitScore | null`, `reaction`, `savedAt`, `createdAt`, `items: ItemView[]` in the generator's slot order (outerwear, top or one-piece, bottom, shoes). `ItemsService` gains a public `views(items)` that signs photo links, so the outfit answers items exactly as the wardrobe does. `breakdown` is stored as JSON and read back through a zod schema of `ScoreBreakdown` rather than cast.

### Ownership

One private `ownedOrNotFound(ownerId, id)` in `OutfitsService`, the same shape as the items' one: `findFirst({ where: { id, ownerId } })`, 404 `No such outfit` otherwise. Every route with an id goes through it; ids are checked with `z.uuid()` in the controller as the items' routes do.

### Reaction and save

- `PUT /outfits/:id/reaction` `{ reaction: 'like' | 'dislike' | null }`. `PUT` because it sets a state; repeating it is harmless.
- `PUT /outfits/:id/save` sets `savedAt` only when it is null, so the first moment stays; `DELETE /outfits/:id/save` sets it to null. Both answer the outfit.
- `GET /outfits/saved` uses `pageArgs` (newest created first) with `savedAt: { not: null }`. Declared before `:id`.

### "Wore it today"

- `calendarDateIn(timeZone, now): string` (`outfits/calendar-date.ts`) gives `YYYY-MM-DD` with `Intl.DateTimeFormat('en-CA', { timeZone })`. A pure function with its own unit test, which is where the Auckland scenario is checked; the service passes `new Date()`.
- The date goes to Postgres as `new Date('YYYY-MM-DDT00:00:00Z')` into a `@db.Date` column and is answered as the string again, so no server time zone can shift it.
- In `prisma.$transaction`: create the `WearLog`; `item.updateMany({ where: { id: { in: itemIds }, ownerId }, data: { wearCount: { increment: 1 }, lastWornAt: now } })`.
- Already worn today: look the record up first and answer it untouched. Two requests at once both miss it; the second `create` fails on the unique index (P2002, `isUniqueViolation` in `prisma/errors.ts`), its transaction rolls back the increments, and it answers the record the first one wrote.
- Answers `WearLogView { id, outfitId, date }` with 201 either way, Nest's default for a POST. A retry of a request whose answer was lost is not an error, the body is the same record, and the client has nothing to do differently, so a second code would carry no information.

## Structure

- `apps/api/src/outfits/`: `outfits.service.ts` (generate, findOne, listSaved, react, save, unsave, wear), `outfits.controller.ts` (the existing score route stays `@Public()`, as a method decorator now; the new ones are closed), `requests/` with `generate-outfit.request.ts`, `reaction.request.ts`, `calendar-date.ts`, `outfits.interfaces.ts` (`OutfitView`, `WearLogView`, `GenerateResponse`).
- `OutfitsModule` imports `ItemsModule`, which already exports `ItemsService`.

## Pitfalls

- **`@Public()` on the class** today opens every route in the controller. It moves to the `score` method, or the new routes are open.
- **Prisma `Json` and `Float`**: `breakdown` comes back as `JsonValue`; parse it.
- **`@db.Date` and JavaScript dates**: always build and read the date as UTC midnight; never `new Date(year, month, day)`.
- **An outfit whose item was archived since**: still readable and wearable; only generation leaves archived items out.
- **`seen` and `mustInclude` are capped** so a request cannot make the server read a whole table.
