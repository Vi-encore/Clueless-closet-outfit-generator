# Proposal

## Why

`add-web-shell` left an application that can be signed into and does nothing. This is the second of the three changes in step 8 of [docs/roadmap.md](../../../docs/roadmap.md): the wardrobe itself, in a browser, and with it the moment a browser first uploads something.

That moment is why the change carries more than screens. Step 7 moved bytes with `fetch` from Node, which has no CORS, so a Backblaze bucket with no rules looked fine. A browser's upload is a cross-origin `PUT` with a `Content-Type`, which preflights, and a bucket with no rules refuses it before anything is sent. Asking the real bucket confirmed it has none. MinIO allows every origin by default, so all of this works locally and fails on Backblaze: only the real bucket can prove it.

## What Changes

- A `storage:cors` script that applies the bucket's CORS rules from `WEB_ORIGINS`, a thing a person runs once per deployment, for the same reason `storage:init` is.
- Presigned upload URLs that carry no checksum. The SDK adds one by default, computed over an empty body, and a browser sending real bytes cannot match it.
- `@closet/core` in the client, and Ukrainian labels for the codes a screen shows, so that a form is built from the same vocabularies the API validates against.
- A wardrobe screen: your items with their photographs, a page at a time, narrowed by slot.
- Adding an item: a slot, a type that follows it, a name, and a photograph chosen with a plain file input. The photograph is required: a wardrobe item nobody can see is no use to the doll or the generator.
- An item's card: what it is, whether friends can see it, and archiving it with a reason.
- A shortcut on the desktop, which until now had nothing to open.
- A form that fails says so in the small error window Windows would open, and everything a pointer can press answers it.

Out of scope:
- **The camera, background removal and WebP.** Step 9, `add-item-capture`. A file input is what lets the upload be proved now without building any of that.
- **The full tag form.** Colours, materials, seasons, warmth and the rest are step 9's, where `TagSuggestion` arrives to fill them. This change adds an item with the three things a person can say in a few seconds.
- **Editing an item's tags, and replacing its photo.** They belong with that same form.
- **Showing archived items.** The list is the part of a wardrobe you can still wear.
- **Friends' wardrobes.** `add-social-screens`. The visibility switch is here because it belongs to the owner.
- **Quotas and a size limit.** A presigned `PUT` cannot enforce a size, and step 9 shrinks what is uploaded.
- **A data-fetching library.** See the design.

## Capabilities

### New Capabilities
- `web-wardrobe`: the wardrobe as a person sees it.

### Modified Capabilities
- `photo-storage`: a browser, and not only a test, can upload.
- `web-session`, `web-shell`: a refused form opens a dialog.

## Impact

- `apps/api/src/storage/` — the client's checksum settings, the rules, and the script.
- `apps/web/src/` — screens, `api/items.ts`, the labels, and a small hook for loading.
- `apps/web/package.json` — `@closet/core` as a workspace dependency, which means it is built before the client is.
- The Backblaze bucket gains CORS rules. Nothing else about it changes.
- No migration.
- Requires `add-web-shell` and `add-photo-storage`, both archived.
