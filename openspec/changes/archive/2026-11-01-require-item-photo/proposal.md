# Proposal

## Why

`add-wardrobe-screens` made a photograph required in the form and left it optional in the API, and recorded that the rule therefore held for one client only. The author has asked for it to hold everywhere. An item nobody can see is no use to the doll or to the generator, and a rule that lives in one form is a rule the next client has to remember.

## What Changes

- `POST /items` refuses an item with no `photoOriginalKey`, with status 400.

Out of scope:
- **A migration.** The column stays nullable. Rows from before this rule are still rows, and tightening it would need a decision about each of them. Reads keep answering `photoUrl: null` for those.
- **Checking the object is really there.** `add-photo-storage` left that out for a reason that still holds: the key is what stops theft, and a missing object is a broken image rather than a breach.
- **Removing a photograph from an item.** `PATCH` has no way to do that today, so nothing has to be closed.
- **Putting an archived item back.** Recorded in the roadmap at step 9.

## Capabilities

### Modified Capabilities
- `wardrobe-items`: an item needs a photograph.

## Impact

- `apps/api/src/items/requests/create-item.request.ts` — one field stops being optional.
- `apps/api/test/` — the helpers that post items now carry a key, and the two scenarios about an item with no photo write their row directly, as an old row would be.
- `docs/roadmap.md` and `openspec/config.yaml` — both record the rule as living only in the form.
- No migration, and nothing in `apps/web`, whose form already requires one.
