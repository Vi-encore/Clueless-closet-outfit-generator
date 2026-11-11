# Proposal

## Why

Step 9 of the [roadmap](../../../docs/roadmap.md#step-9--adding-an-item-from-a-phone): adding an item from a phone. Today the form takes a slot, a type, a name and any file, and stores that file as it is. The PoC needs 10–20 real items added from a phone ([poc.md](../../../docs/poc.md)), and the doll in step 10 needs each of them cut out of its background. The flow is described in [architecture.md](../../../docs/architecture.md) (the photo pipeline) and [auto-tagging.md](../../../docs/auto-tagging.md#flow); the risks on an iPhone are in [mobile.md](../../../docs/mobile.md).

Step 9 is split in two. `restore-archived-items` comes first and carries the archive; this change is the photo and the tags.

## What Changes

- **A photo comes from the camera or the gallery,** whatever format the phone hands over, HEIC included where the browser can read it.
- **The background is cut out in the browser,** shown for the person to accept, and the original is kept either way. Where cutting out fails or the person declines it, the item is saved with the original alone.
- **Both images are made smaller and sent as WebP** (the original at most 1600 px on its longer side, the cut-out at most 1024 px), falling back to JPEG and PNG where a browser cannot encode WebP.
- **The API stores a cut-out beside the original:** `photoCutoutKey` on create and patch, checked like the original's, a replaced one removed from storage, and a `cutoutUrl` beside `photoUrl`. The wardrobe and the card show the cut-out where there is one.
- **Colors are computed from the cut-out's pixels** by a pure function in `@closet/core`, and offered on the form, where they can be removed.
- **The form covers every tag** in the vocabularies, with only slot and type required, and the card shows what was filled in.
- **`TagSuggestion` lands in `@closet/core`:** every tag nullable plus a list of uncertain fields, with a reader that turns an invalid field into `null` rather than refusing the whole suggestion. The form is filled from one, and today the only thing that makes one is the color reader; step 15's tagger will make the rest.

Out of scope:
- **The `TaggingProvider` in the API and a suggestions route.** The roadmap lists a manual provider as groundwork, but with no route to call it, it would be code nothing runs. It lands with its first real caller, Gemini, in step 15; the shape it answers with is defined here.
- **Editing an item's tags after it is saved.** `PATCH /items/:id` exists; the screen for it is a later change.
- **Removing backgrounds on the server,** the fallback [mobile.md](../../../docs/mobile.md) names if Safari cannot cope. This change finds out whether it is needed.
- **Laundry, the doll and the generator**, which are step 10.

## Capabilities

### Modified Capabilities
- `wardrobe-taxonomy`: a tag suggestion and its reader; colors read from pixels.
- `wardrobe-items`: an item keeps a cut-out beside its original, and answers with a link to each.
- `web-wardrobe`: the new item flow (camera, cutting out, smaller images, colors, the full form), the cut-out shown in the wardrobe and on the card, and labels for every vocabulary.

## Impact

- `packages/core/src/taxonomy/`: `tag-suggestion.ts`, `colors-from-pixels.ts`, tests, exports.
- `apps/api/src/items/` (create and update requests, service, interfaces), `apps/api/test/items.db-spec.ts`, `photos.db-spec.ts`. No migration: `photoCutoutKey` exists.
- `apps/web/src/features/wardrobe/`: the new item screen becomes a flow with its own modules for the photo; `item-tile.tsx`, `item-card.tsx`; `shared/i18n/uk.ts` gains every vocabulary's labels.
- A new dependency in `apps/web`: `@imgly/background-removal` (AGPL, fine for a personal PoC per [try-on.md](../../../docs/try-on.md)), loaded only on the new item screen. Its model is fetched from IMG.LY's CDN on first use; the photo itself never leaves the device for this.
- `docs/roadmap.md` and `docs/auto-tagging.md`: the provider moves to step 15.
