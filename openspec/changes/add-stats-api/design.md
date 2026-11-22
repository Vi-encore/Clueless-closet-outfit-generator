# Design

## Context

- **`Item` has what the statistics need:**
  - `slot`;
  - `colors` (JSON: `{ family, hex, share }[]`, or null);
  - `price` (`Decimal(10, 2)`, nullable) and `currency` (default `UAH`);
  - `status` (`available`, `laundry`, `archived`);
  - `wearCount`, `lastWornAt` (`timestamptz`) and `createdAt`.
- **The index.** `@@index([ownerId, status])` serves every query here.
- **Describing items.** `ItemsService.views(rows)` describes items with their photo links, and `ItemsModule` exports `ItemsService`.
- **Main colour.** `mainColor(colors)` in `@closet/core` picks the colour with the largest share.
- **The clock.** The diary reads the time through a `CLOCK` provider (`diary.constants.ts`) that tests replace.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Two routes, each a handful of queries, and the long list a page at a time.
- Arithmetic on money done in cents, never in floating point.

**Non-Goals:**
- Caching, materialised views, or statistics over time.

## Decisions

### 1. A `stats` module

`apps/api/src/stats/` holds:

- `stats.controller.ts`, at `/stats`, with `GET` and `GET unworn`;
- `stats.service.ts`;
- `requests/unworn.query.ts`;
- `stats.interfaces.ts`, `stats.constants.ts` (with `CLOCK` and `UNWORN_DAYS = [30, 90, 180]`) and `stats.utils.ts`.

It imports `ItemsModule`.

*Alternative:* routes under `/items/stats`. They read across the wardrobe and answer something that is not an item, like the diary, so they are a resource of their own.

### 2. Counting: `groupBy` where SQL can, TypeScript where it cannot

- **Totals and per slot.**
  - `prisma.item.groupBy({ by: ['slot'], where: inWardrobe, _count: true })` gives the count per slot. The total is their sum.
  - `prisma.item.count({ where: { ...inWardrobe, wearCount: { gt: 0 } } })` gives the worn count.
  - `inWardrobe` is `{ ownerId, status: { not: 'archived' } }`.
- **Per main colour.** The colours are JSON, and "the family with the largest share" is not a `groupBy`. Read `select: { colors: true }` for the wardrobe, then fold in `stats.utils.ts` with `mainColor`.
  - A wardrobe is tens of items, so one narrow read is cheaper to keep right than JSON SQL.
  - The answer is `{ family: ColorFamily | null, count }[]`, where null means no colours.
- **Most worn.** `findMany({ where: { ...inWardrobe, wearCount: { gt: 0 } }, orderBy: [{ wearCount: 'desc' }, { createdAt: 'asc' }], take: 5 })`, then `views`.

*Learning pointer:* `groupBy` needs `orderBy` when `take` or `skip` is used. Here neither is, so the order of slots is sorted in TypeScript by the vocabulary's order.

### 3. Money

- `price` comes back as `Prisma.Decimal`.
- **Cost per wear** is `price.mul(100).div(wearCount).toDecimalPlaces(0, ROUND_HALF_UP)` in cents, then divided by 100 for the answer, as a string with two decimals. Strings keep the API from promising float precision.
- **Sorting** is by the cents, as numbers, within the list. Mixed currencies are each sorted by their own amount, and the client shows the currency beside each one.
- **The answer:**
  - `costPerWear: { item: ItemView, perWear: string, currency }[]`;
  - `unwornWithPrice: { item, price: string, currency }[]`.

*Pitfall:* `Number(price) / wearCount` gives 3000 / 7 = 428.5714… and a later rounding in the client. Rounding once, in cents, on the server is the single rule.

### 4. Unworn

**The query.** `days` is from `z.coerce.number().pipe(z.union([z.literal(30), z.literal(90), z.literal(180)]))` with a default of 90. The cutoff is `clock()` minus `days × 24 h`, as a moment. `lastWornAt` is a moment too.

The `where` is:
```
inWardrobe AND (lastWornAt < cutoff OR (lastWornAt IS NULL AND createdAt < cutoff))
```

**The order and the pages.** "Longest unworn first" is by `coalesce(lastWornAt, createdAt)` ascending, then `id`, so that two items with the same moment keep one order. Prisma cannot order or page by an expression, so the ids of a page come from one raw query, then the rows from `findMany` and `views`:

```
SELECT id, coalesce("lastWornAt", "createdAt") AS since FROM "Item"
WHERE "ownerId" = $owner AND status <> 'archived'
  AND coalesce("lastWornAt", "createdAt") < $cutoff
  AND (coalesce("lastWornAt", "createdAt"), id) > ($sinceOfCursor, $idOfCursor)  -- only after a cursor
ORDER BY since, id
LIMIT $limit + 1
```

- **The query is built with `Prisma.sql`**, so every value is a parameter and nothing is pasted into the text. The row comparison `(a, b) > (c, d)` is Postgres's way of saying "after this row" in a two-column order.
- **The cursor is opaque to the client.** It is base64url of `<since ISO>_<id>`. A cursor that does not decode, or whose parts are not a date and a uuid, is a 400.
- **The page size** follows `pageQuerySchema`'s `limit`: 24 by default, and at most its maximum. The answer is `Page<UnwornItem>`, `{ items, nextCursor }`, as the wardrobe answers. Each item is `{ item: ItemView, lastWornAt: string | null }`.

*Learning pointer:* this is "keyset" paging. The cursor names the last row seen, not a page number, so an item archived while the person reads does not shift the next page onto one they have already seen.

*Why a moment and not a calendar day:* "not worn for 90 days" does not change with the hour of the day in any way a person would notice. `WearLog.date` is the calendar day for the diary, while `lastWornAt` is the moment for statistics.

### 5. The clock

`CLOCK` is provided as in the diary, `() => new Date()`, and the database suite overrides it through `createDatabaseApp`'s `prepare`. The providers are two separate instances of the same pattern, not a shared module. The diary's is private to it, and a shared `clock/` module for two lines is not worth it yet.

## Risks / Trade-offs

- **[Trade-off]** The colour fold reads every item's colours. At hundreds of items that is still one small query, and the threshold for moving it to SQL is far away.
- **[Trade-off]** The unworn list is one raw query. It is the only one in the API, so a change to `Item`'s columns has to be mirrored in it by hand. A test through the route covers it.

## Migration Plan

No schema change. Rollback is a revert.
