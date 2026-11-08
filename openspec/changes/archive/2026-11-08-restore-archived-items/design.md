# Design

## Context

`ItemsService.archive` sets `status`, `archivedAt` and `archivedReason` and keeps the row; `list` leaves archived items out unless `status=archived` is asked for; `findOne` reads an item whatever its status. So the archive is already readable, and the only thing the API lacks is the way back. On the client, the wardrobe filter is one `<select>` for the slot kept in `?slot=`, and the card shows `ArchiveForm` only while the item is not archived.

## Decisions

### `POST /items/:id/restore`, not a status in `PATCH`

`PATCH /items/:id` corrects tags; `status` is not in it, and should not be: putting an item back has to clear `archivedAt` and `archivedReason` too, and a `PATCH` carrying `status: 'available'` would leave the client to know that. A verb route says what happens, the same way `DELETE` means "archive".

Alternative: `PATCH` with `status`. Rejected for the reason above, and because it would also let a client set `archived` without a reason, or `laundry`, which nothing has decided yet.

Restoring is idempotent, like archiving (ADR-0010): an item that is not archived is answered as it is, with 200, so a retried request whose answer was lost is not an error. It goes through `ownedOrNotFound`, so somebody else's item is 404 (ADR-0002, ADR-0003).

Signature, as orientation: `restore(ownerId: string, id: string): Promise<ItemView>`.

### The archive is a second choice in the filter, in the URL

A second `<select>` beside the slot, "У шафі" / "Архів", written to `?status=archived` and read back only if it is that value, as `slotFrom` does for the slot. Two parameters rather than one combined choice, because the API takes them separately and the archive of shoes is a reasonable thing to want.

The cache key grows with it: `itemKeys.list({ slot, status })`, so the archive and the wardrobe are separate lists under the same `lists()` prefix, and every invalidation that already reaches `lists()` reaches the archive too. `withoutItem` stays as it is; restoring invalidates the lists rather than editing them, since the item has to appear in one list and leave another.

### The card's archived state

`Sheet` already branches on `item.status`. For an archived item it shows a line with the date (`toLocaleDateString('uk-UA')`) and the reason's label, and `RestoreButton` in place of `ArchiveForm`. Restoring puts the answer into `itemKeys.one(id)` and invalidates `itemKeys.lists()`, the same as `SharingSwitch`, and stays on the card: the person is looking at the thing they just brought back.

## Structure

- `apps/api/src/items/items.controller.ts`, `items.service.ts`: the route and `restore`.
- `apps/web/src/features/wardrobe/wardrobe.api.ts`: `restoreItem(id)`.
- `wardrobe.queries.ts`: the list key and `wardrobeQuery` take `{ slot, status }`; the shape goes in `wardrobe.interfaces.ts`.
- `wardrobe.tsx`: the second select; `item-card.tsx`: the archived line and `RestoreButton`.
- `shared/i18n/uk.ts`: the filter's words, "Архів порожній", the archived line, "Повернути в шафу".

## Pitfalls

- `@HttpCode(HttpStatus.OK)` on the route: a Nest `@Post` answers 201 by default, and nothing is created here.
- Both search parameters have to survive changing the other one: `setParams` with only the slot would drop the archive.
- The empty message: the wardrobe's "nothing here yet, add something" would be wrong for an empty archive.
