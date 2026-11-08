# Design

## Context

`NewItem` is one form: a slot, a type, a name and a `<input type="file">`, submitted through `useFormSubmit`. `createItem` asks `POST /items/upload-url` for a key and a presigned URL, `PUT`s the file there with plain `fetch`, then posts the item with `photoOriginalKey`. The API checks that the key names its owner (`assertOwnKey`), and `update` removes a replaced original from storage. `Item.photoCutoutKey` and `Item.colors` exist in the schema and nothing writes them. `itemTagsSchema` in `@closet/core` already validates every tag, colors included.

The new item screen becomes a short flow on one route: choose a photograph, wait while it is prepared, look at the cut-out, fill in the tags, save.

## Decisions

### The photo pipeline runs in the browser, behind one module

```
File ──read──▶ ImageBitmap ──scale ≤1600──▶ original (WebP | JPEG)
                    │
                    └─scale ≤1024──▶ removeBackground ──▶ cut-out (WebP | PNG)
                                                              │
                                                    pixels ──▶ colorsFromPixels
```

Everything that touches canvas, WASM or the model sits in `features/wardrobe/photo/` behind three functions the screen calls: `readPhoto(file)`, `cutOut(image)` and `encode(image, { maxSide, kind })`. jsdom has no canvas and cannot run the model, so the screen's tests replace that module with `vi.mock` and test the flow; the functions themselves are checked by the author on a phone against [mobile.md](../../../docs/mobile.md#iphone-testing-checklist). The sizing arithmetic (`fitWithin(width, height, maxSide)`) is pure and gets unit tests of its own.

Alternative: send the original to the server and cut it out there. Rejected for now: it costs compute the PoC does not have and sends a photo off the device for no reason. It stays the fallback if Safari cannot cope, which this change exists to find out.

### `@imgly/background-removal`, loaded lazily, on a smaller image

The library runs an ONNX model in WASM, free and without keys. It is imported with `import()` inside `cutOut`, so its code and its model load only when somebody adds an item, not with the app. It is given the image already scaled to 1024 px, not the 12-megapixel original: Safari limits a tab's memory more strictly ([mobile.md](../../../docs/mobile.md)), and the cut-out is never stored larger than that anyway. The plan was to start with the smallest model (`isnet_quint8`) and move up only if the edges were poor. They were: tried in Chrome on a red T-shirt drawn over a grey checked background, `isnet_quint8` kept the background in patches around the item (a third of the picture stayed opaque, and the color reader found grey), while `isnet_fp16` left the T-shirt alone and nothing else. So the code uses `isnet_fp16`. It is about twice the download, and whether an iPhone's tab holds it is what the phone check, moved to step 11, has to find out; `isnet_quint8` stays the fallback if it does not.

Its model files come from IMG.LY's CDN by default (`publicPath`). That is the image segmentation model being downloaded, not the photo being uploaded. Hosting the files ourselves is a later choice, when the app has a host. The ONNX runtime is another matter: Vite bundles it, so the build emits its WASM file (about 24 MB, 5.7 MB gzipped) beside the app. It is fetched only when somebody adds an item, but a host with a per-file limit of 25 MB will have to be checked at step 11.

Measured on a desktop Chrome, first run, model downloaded included: reading and encoding the original took under 0.1 s, cutting out about 22–24 s. The original came out 1600×1200 WebP, the cut-out 1024×768 WebP.

Pointers: the package's README (configuration: `model`, `output`, `publicPath`, `progress`), and `onnxruntime-web` on why the first run is slow.

### The original is kept, and the cut-out is optional

The author's decision: both are stored. The original lets a better model, or step 15's tagger, start again from the full picture. A failed cut-out, or one the person declines, leaves `photoCutoutKey` unset; the item is still an item. The screen shows the cut-out over a checkerboard, so transparency is visible, with a checkbox "Без фону", ticked; unticking it keeps the original alone.

### WebP where the browser can encode it

`canvas.toBlob(callback, 'image/webp', 0.85)` produces WebP in Chromium and Firefox. A browser that cannot encode WebP does not fail: it quietly returns PNG. So the code checks `blob.type` and does not trust the type it asked for. Where WebP did not come back, the original is encoded as JPEG (smaller, and it has no transparency to lose) and the cut-out as PNG (it has). All three are in `PHOTO_CONTENT_TYPES`. An `OffscreenCanvas` with `convertToBlob` is the same idea off the main thread; use whichever the target Safari supports.

### Colors are a pure function in `@closet/core`

`colorsFromPixels(rgba: Uint8ClampedArray): ItemColor[]` takes the RGBA bytes of the cut-out (`getImageData`), skips pixels whose alpha is under half, groups the rest into coarse buckets, names each bucket by its nearest color family, merges buckets of the same family, drops families under 10% of the opaque area, and returns at most three, largest first. Pure, so it is tested in `packages/core` with arrays built by hand, and it uses the same `COLOR_FAMILIES` the scoring reads.

Measure "nearest" in a perceptual space (CIELAB), not RGB: in RGB, navy and black, and beige and white, are closer than they look. Each family needs one or two reference colors; `denim` and `navy` are the ones to watch.

Alternative: `node-vibrant` or `colorthief`, named in the docs. Rejected: they return a palette, not shares of the area, and know nothing of our families, so the work that matters would be ours anyway, around a dependency.

### `TagSuggestion` and its reader live in `@closet/core`

`tagSuggestionSchema` is `itemTagsSchema`'s fields, each nullable, plus `uncertain: string[]` naming fields. `readSuggestion(input: unknown): TagSuggestion` parses field by field, so one bad value costs one field: a type from another slot becomes null and the slot survives. The form takes a `TagSuggestion` and fills itself from the non-null fields. Today the color reader is the only source (`{ colors }`); step 15's Gemini tagger answers with the same object, and its reader is this one. `getTagSuggestionJsonSchema()` comes with it, through `z.toJSONSchema()`, as `getItemTagsJsonSchema()` already does.

### No `TaggingProvider` yet

The roadmap lists a manual provider as step 9's groundwork. Without a route nothing would call it, and a route answering an empty object would be a contract with no meaning. The shape of the answer is what the client and step 15 have to agree on, and that is `TagSuggestion`, here. The provider and the route arrive with Gemini in step 15; `docs/auto-tagging.md` and the roadmap are updated to say so.

### The form

Built from the vocabularies, so a code added to `@closet/core` appears without touching the screen:

- single choice (`pattern`, `fabricType`, `fit`, `length`, `rise`): a `<select>` with an empty first option; `rise` only for bottoms, `length` with the codes that fit the slot is a nicety, not a rule.
- several (`seasons`, `styles`, `occasions`, `avoidOccasions`): checkboxes; seasons get "Усі сезони".
- scales (`warmth`, `formality`): five radio buttons and "не вказано".
- `materials`: rows of a material and an optional percentage, added and removed.
- `colors`: the swatches the photo gave, each with a button to remove it.
- name, brand, size, price, notes: plain fields, as `createItemRequestSchema` already accepts them.

The form keeps its state in one object, with a reducer or `useState` per group; `FormData` no longer fits once materials are rows. What is sent is that object with empty values left out, validated by `itemTagsSchema` on the client before the upload starts, so a broken form costs no upload. Sections that are long on a phone go into `<details>`, closed, below slot and type.

### The API side

`photoCutoutKey: z.string().trim().min(1).max(200).optional()` on the create request (the update request follows by construction). `assertOwnKey` runs on it as on the original. `update` removes a replaced cut-out exactly as it removes a replaced original, after the write. `withPhoto` adds `cutoutUrl`. The tile and the card prefer `cutoutUrl` and fall back to `photoUrl`.

## Structure

- `packages/core/src/taxonomy/tag-suggestion.ts`, `colors-from-pixels.ts`, with tests; exported from `index.ts`.
- `apps/api/src/items/requests/create-item.request.ts`, `items.service.ts`, `items.interfaces.ts`.
- `apps/web/src/features/wardrobe/photo/`: `read-photo.ts`, `cut-out.ts`, `encode.ts`, `fit-within.ts`, `photo.interfaces.ts`.
- `apps/web/src/features/wardrobe/new-item.tsx` split into the flow and its parts (`photo-step.tsx`, `tag-form.tsx` or similar); `wardrobe.api.ts`'s `createItem` uploads one or two images.
- `item-tile.tsx`, `item-card.tsx`; `shared/i18n/uk.ts` with every vocabulary.

## Pitfalls

- **Orientation.** A phone photo carries an EXIF rotation. `createImageBitmap(file, { imageOrientation: 'from-image' })` applies it; drawing the raw file to a canvas may lie on its side.
- **HEIC.** Safari decodes it and Chromium mostly does not. Read whatever arrives with `createImageBitmap`, and turn a failure into "this file cannot be read" rather than a stuck screen.
- **The first cut-out is slow,** since the model downloads. Show progress (`progress` callback) and keep the form usable meanwhile: the tags do not depend on the cut-out.
- **Two uploads, one item.** Upload both, then create. If the second upload fails, nothing is created, as today; the first file is an orphan, storage wasted rather than data wrong.
- **Object URLs** made for previews have to be revoked when the screen closes or the photo changes.
- **Memory on an iPhone.** Release bitmaps (`bitmap.close()`) and canvases as soon as the blobs exist.
- **The name's length.** `itemTagsSchema` allows 80 characters and the current form's input allows 120; make them agree.
