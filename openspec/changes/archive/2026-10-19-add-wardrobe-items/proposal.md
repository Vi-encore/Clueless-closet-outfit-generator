# Proposal

## Why

Everything built so far operates on items that exist only inside a request body. `POST /outfits/score` is handed an outfit and scores it; nothing can put a blouse in a wardrobe and find it there tomorrow. The `Item` table has been waiting since step 3 with every column the model needs, and `itemTagsSchema` has been validating item tags since step 1 — this step is where the two meet and the wardrobe becomes a thing a person owns.

It is also the first time ownership is enforced on data rather than on a route. Step 4 decided who you are; this step decides what is yours, and it is the pattern every later feature copies.

## What Changes

- `POST /items` adds an item to the signed-in person's wardrobe, `GET /items` lists it, `GET /items/:id` reads one, `PATCH /items/:id` corrects its tags and `DELETE /items/:id` archives it.
- Every one of those is scoped to the owner: an item belonging to somebody else is answered exactly as an item that does not exist.
- `DELETE` archives rather than deletes, recording when and why, because outfit history and statistics will keep pointing at the item.
- `GET /items` is narrowed by slot and status, and hides archived items unless they are asked for.
- `packages/core` gains the three vocabularies this needs: item statuses, visibilities and archive reasons.

Out of scope:
- **Photos** (`photoOriginalKey`, `photoCutoutKey`) — step 7 has the storage to put them in.
- **`dollFit`** — step 14, and it needs a fitting screen to produce the numbers.
- **`aiSuggestion` / `taggingVersion`** — written by the tagger, step 9.
- **`wearCount` / `lastWornAt`** — maintained by the wear log, step 12, not by hand.
- **Sharing with friends.** `visibility` is accepted and stored, but `friends` grants nothing until friendships exist in step 6; until then it reads the same as `private` because nobody is a friend yet.
- **Pagination.** A personal wardrobe is hundreds of items, not millions, and the chat in step 6 is where cursor pagination earns its first keep.
- **Deleting forever.** Only an explicit "delete forever" action or closing the account removes an item, and neither exists yet.

## Capabilities

### New Capabilities
- `wardrobe-items`: a person's own wardrobe, over HTTP.

### Modified Capabilities
- `wardrobe-taxonomy`: the states an item can be in are named in the same place as the tags that describe it.

## Impact

- New `apps/api/src/items/` — module, controller, service and the request schemas.
- `packages/core` gains `ITEM_STATUSES`, `VISIBILITIES` and `ARCHIVE_REASONS`.
- No migration: step 3 already created every column this uses.
- Requires step 4 (`add-auth`), done and archived.
