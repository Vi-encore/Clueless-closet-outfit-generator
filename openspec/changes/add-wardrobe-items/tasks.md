# Tasks

## 1. The vocabularies and adding an item

- [x] 1.1 Claude writes the tests "Statuses are defined", "Visibilities are defined", "Archive reasons are defined", "A value outside the vocabulary is rejected", "Item stored", "Owner comes from the token", "Type does not belong to the slot" and "Signing in is required"
- [x] 1.2 Add `ITEM_STATUSES`, `VISIBILITIES` and `ARCHIVE_REASONS` to `packages/core` beside the other vocabularies, and export them
- [x] 1.3 Write `createItemRequestSchema` from `itemTagsSchema` with `.safeExtend()`, accepting only the columns a person fills in by hand
- [x] 1.4 Add the items module, service and `POST /items`, taking the owner from `@CurrentUser()`; verify the 1.1 tests pass

## 2. Reading the wardrobe

- [ ] 2.1 Claude writes the tests "Own items returned", "Another wardrobe stays invisible", "Owner reads the item", "Somebody else's item is not found", "An unknown id answers the same way", "Archived items are left out", "Archived items on request", "Narrowed by slot" and "Unknown slot rejected"
- [ ] 2.2 Add the private `ownedOrNotFound` helper, so that one query answers both "does it exist" and "is it mine"
- [ ] 2.3 Add `GET /items/:id` and `GET /items` with the `slot` and `status` query schema, leaving archived items out by default; verify the 2.1 tests pass

## 3. Correcting tags

- [ ] 3.1 Claude writes the tests "One tag changed", "The pair is judged after merging", "Slot and type change together" and "Somebody else's item cannot be changed"
- [ ] 3.2 Write `updateItemRequestSchema` as the partial form of the create request, and decide what an empty patch means
- [ ] 3.3 Add `PATCH /items/:id`, validating the merged item rather than the patch, and raising the pipe's 400 shape when the merged item breaks a rule; verify the 3.1 tests pass

## 4. Archiving

- [ ] 4.1 Claude writes the tests "Item archived with a reason", "Archiving twice is not an error" and "Somebody else's item cannot be archived"
- [ ] 4.2 Add `DELETE /items/:id`, setting the status, the reason and the moment, and leaving an already-archived item as it is; verify the 4.1 tests pass and the whole suite stays green
