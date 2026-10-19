# Design

## Context

The `Item` table was designed in step 3 and has forty-odd columns, filled by four different hands: the tagger, the photo pipeline, the person, and the system. This step opens only the person's share of them. Which columns the API refuses to accept is as much a decision as which it takes.

## Goals / Non-Goals

**Goals:** a wardrobe only its owner can see or change; the slot/type rule still enforced when a tag is corrected; an ownership check written once, so step 6 can reuse it for the chat.

**Non-Goals:** photos, the doll, the tagger's output, wear counts, pagination, real deletion.

## Decisions

### 1. Somebody else's item is answered 404, not 403

403 means "this exists and you may not have it", which confirms the id is real. A wardrobe is private enough that the existence of an item is itself worth not confirming — someone guessing ids should not be able to tell a hit from a miss. The owner check and the existence check therefore collapse into one query, `findFirst({ where: { id, ownerId } })`, and one answer.

This costs nothing in honesty: a person who owns an item never meets the 404.

### 2. One method answers "is this mine", and it is not the controller's business

```ts
// items.service.ts
private async ownedOrNotFound(ownerId: string, id: string): Promise<Item>
```

Every route that names an item goes through it. Step 6 forwards items into the chat and needs the same question answered about a different caller, so the rule has to live somewhere a gateway can reach — the roadmap's groundwork note for this step.

### 3. The request schemas are built from `itemTagsSchema`, never beside it

`itemTagsSchema` already encodes every vocabulary and the cross-field rule. The create request is that schema plus the handful of columns a person fills in by hand:

```ts
export const createItemRequestSchema = itemTagsSchema.safeExtend({
  brand: z.string().trim().min(1).max(80).optional(),
  // ...size, price, currency, purchasedAt, notes, visibility
});
```

`.safeExtend()` and not `.extend()`: `itemTagsSchema` carries a `superRefine`, and plain `.extend()` throws on a schema with checks. This bit the project once already in `outfitItemSchema`.

Columns the API does not accept at all: `ownerId` (it comes from the token — accepting it would be the whole vulnerability this step exists to prevent), `status`, `wearCount`, `lastWornAt`, `archivedAt`, `archivedReason`, `photoOriginalKey`, `photoCutoutKey`, `dollFit`, `aiSuggestion`, `taggingVersion`.

### 4. A patch is validated after merging, not before

This is the one place where the obvious arrangement does not work. `PATCH` takes a partial item, so `slot` and `type` may arrive one at a time — but `typeBelongsToSlot` needs both. Validating the request body alone would have to either reject a lone `type` or let an invalid pair through.

So the pipe validates the patch's shape (every field optional, each value still checked against its vocabulary), and the service validates the *result*:

```ts
const merged = itemTagsSchema.parse({ ...tagsOf(stored), ...patch });
```

The cross-field rule then runs against what the item will actually be. The cost is that one class of validation error is raised by the service rather than the pipe, which has to be translated into the same 400 shape the pipe produces — otherwise a client meets two different error formats for the same kind of mistake.

### 5. `DELETE` archives, and the reason comes from a vocabulary

The route is `DELETE` because that is what a client means, and archiving is what the project decided happens — items outlive their owner's interest in them because outfit history points at them. `archivedReason` becomes an enum (`worn_out`, `given_away`, `sold`, `damaged`, `other`) rather than free text, so step 13's statistics can count them; `other` keeps the person from being forced into a lie.

An already-archived item archived again is left alone and answered 200. Archiving is a statement about the world, not an event, and a client that retries a dropped request should not get an error for being right.

### 6. The three new vocabularies belong in `packages/core`

`ITEM_STATUSES`, `VISIBILITIES` and `ARCHIVE_REASONS` go where every other vocabulary lives, for the reason stated in the project conventions: defined once, derived everywhere. The database keeps its string columns and plain defaults — the enum is enforced by zod at the edge, exactly as `slot` and `type` already are.

### 7. The owner gets the whole row back

Nothing in `Item` is a secret from the person who owns it, so the response is the stored record, not a trimmed view. This is the opposite of `AccountView`, and the difference is the point: a user's row holds a password hash, an item's row holds nothing that is not already theirs.

## Module layout

```
apps/api/src/items/
  items.module.ts
  items.controller.ts        // five routes, no logic
  items.service.ts           // ownership, merging, archiving
  requests/
    create-item.request.ts
    update-item.request.ts
    list-items.query.ts
```

## Common pitfalls

- **`price` comes back as a Prisma `Decimal`, not a number.** It serialises through `toJSON`, so the wire format needs deciding and asserting in a test rather than discovered later.
- **`@Public()` is not on this controller, and must not be.** The global guard protects these routes; the only thing to get right is reading the owner from `@CurrentUser()` rather than from the body.
- **An empty `PATCH` body.** `z.object({})` rejects a missing body, which is the bug the refresh route already hit. Decide whether an empty patch is a 400 or a no-op and test it.
- **`seasons` and `styles` are `String[]` columns.** Prisma writes them with `set`, and an update that omits them must not clear them.

## Risks / Trade-offs

- [Validation lives in two places: the pipe for shape, the service for the merged result] → unavoidable while partial updates and cross-field rules coexist; contained by making the service raise the pipe's error shape.
- [`visibility: friends` is accepted months before it grants anything] → the column exists and the vocabulary is fixed; refusing the value now would mean a migration of intent later, and until step 6 it is simply a private item with a note on it.
