# Proposal

## Why

Archiving keeps an item's row, photograph and reason ([ADR-0010](../../../docs/adr/0010-archive-rather-than-delete.md)), but nothing shows an archived item or brings it back, so on screen archiving looks exactly like deleting. Step 8 left this to step 9 ([roadmap](../../../docs/roadmap.md#step-9--adding-an-item-from-a-phone)). Step 9 was split in two: this change is the archive, small and independent of the photo work, and `add-item-capture` follows it.

The API already answers `GET /items?status=archived`. What is missing is a way to undo an archive, and the screens for both.

## What Changes

- **`POST /items/:id/restore`** puts an archived item back in the wardrobe: `status` becomes `available`, and `archivedAt` and `archivedReason` are cleared. Restoring an item that is not archived changes nothing and answers with it, as archiving twice does. Somebody else's item is 404.
- **The wardrobe's filter gains "Архів"**, kept in the URL like the slot, which lists the archived items. It combines with the slot.
- **An archived item's card says it is archived, when and why,** and offers "Повернути в шафу" in place of the archive form. Restoring refreshes the card and every list.

Out of scope:
- **Deleting an item for good**, which still does not exist.
- **Laundry** (`status=laundry`) on screen, which belongs with the outfit generator in step 10.
- **The photo pipeline and the tag form**, which are `add-item-capture`.

## Capabilities

### Modified Capabilities
- `wardrobe-items`: an archived item can be put back.
- `web-wardrobe`: archived items can be listed, and put back from their card.

## Impact

- `apps/api/src/items/` (controller, service) and `apps/api/test/items.db-spec.ts`.
- `apps/web/src/features/wardrobe/` (`wardrobe.tsx`, `item-card.tsx`, `wardrobe.api.ts`, `wardrobe.queries.ts`, interfaces, spec) and `shared/i18n/uk.ts`.
- No change to the database: the columns exist.
- `docs/roadmap.md`: step 9 names two changes.
