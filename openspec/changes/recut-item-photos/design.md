# Design

## Context

- **How a cut-out is made.** `cutOut(image)` in `features/wardrobe/photo/prepare.ts` runs `@imgly/background-removal` on a copy at the cut-out's size. It then crops the result with `opaqueBox` (`photo/trim.ts`, threshold `HAZE = 8`) and encodes it.
- **How a failure is handled.** `usePhoto` catches a failure as `.catch(() => null)`. The photo ends `ready` with `cutout: null` and `skipped: null`, and `PhotoStep` shows `cutFailed`.
- **Marking a crashed device.** `cutoutStarted`/`cutoutEnded` mark a cut-out in `localStorage`, so a tab that died in the middle of one is remembered as unfit.
- **What the API already does.** `PATCH /items/:id` accepts `photoCutoutKey`, checks that the key was issued to the caller (`assertOwnKey`), and removes the replaced cut-out from storage.
- **CORS.** `apps/api/src/storage/cors-rules.ts` allows only `PUT`. Its comment expects a screen that reads pixels to add `GET`. `pnpm --filter @closet/api storage:cors` applies the rules to the bucket in `.env`.
- **The doll.** `DollFigure` draws the silhouette (an SVG `circle` and `path`), then the items on top. `Doll` adds the outerwear checkbox.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One way to make a cut-out, used by the new item form and the card alike.
- A failure says enough to be acted on from a phone, with no developer tools.

**Non-Goals:**
- Re-cutting all existing items at once. It is one item at a time, on request.

## Decisions

### 1. Haze is alpha up to 64

`HAZE` goes from 8 to 64. The model's real edge is anti-aliased over one or two pixels, so a quarter of opaque costs at most a pixel of edge, while the specks seen were at 9–13.

*Alternative:* count opaque pixels per row and column, and ignore rows with too few. That is more robust to a stray opaque blob, but no such blob has been seen, and it is a second rule to tune.

### 2. A failure carries its reason

- The `ready` state gets `failure: string | null`.
- `usePhoto` keeps the error instead of swallowing it, through `failureOf(error)` in `photo/photo.utils.ts`: `` `${error.name}: ${error.message}` `` for an `Error`, and `String(error)` otherwise.
- `PhotoStep` shows it under `cutFailed`, in a small `<code>`.

It is technical text in English, shown as data. The words around it still come from `uk.ts`.

### 3. Cutting out again on the card

- **`cutOutAgain(photoUrl)` in `photo/prepare.ts`.** It does:
  - `fetch(photoUrl, { cache: 'no-store', credentials: 'omit' })` → blob → `File`;
  - `readPhoto`, then `cutOut`, so the trim is the same as for a new item;
  - `cutoutStarted`/`cutoutEnded` around it, as the form does.
- **`replaceCutout(id, cutout)` in `wardrobe.api.ts`.** It uploads with the existing private `uploadPhoto`, then sends `PATCH { photoCutoutKey }`.
- **`RecutPhoto` (`recut-photo.tsx`) on the card.**
  - It is drawn when the item is not archived and the `photoCutout` flag is on.
  - It is a `.secondary` button: "Вирізати фон", or "Вирізати фон заново" when there is a cut-out.
  - While working, the button says "Вирізаю фон…" and is disabled. The first run fetches the model, which takes tens of seconds on a phone.
  - On success it writes the answer into `itemQuery` and refreshes `itemKeys.lists()`.
  - On failure it shows `ErrorDialog` with `cutFailed` and the reason.
- **A device marked unfit is still allowed** to try from the card. It is an explicit request, and the marks around it record a crash again.
- **Colours are not touched.**

*Pitfall:* the original was likely shown before in an `<img>`, which is not a CORS request. A cached response without `Access-Control-Allow-Origin` could then answer the `fetch` and fail it. `cache: 'no-store'` avoids that.

### 4. `GET` in the bucket's CORS rules

`AllowedMethods: ['PUT', 'GET']`. Headers stay `content-type`, since a `GET` sends no custom header.

The scenario keeps its old name, "Only an upload is allowed", because a MODIFIED block cannot rename a scenario. Its text says what is allowed now.

After merging, the script is run once against the local bucket, and against any other bucket in use.

### 5. The mannequin, remembered

- **`use-mannequin.ts`** in `features/outfits/doll/`. It reads and writes `localStorage['closet:mannequin']` through `useSyncExternalStore`, so every doll on the page changes together.
  - Every access is in `try`/`catch`: a private window throws, and the answer is then the default, shown.
  - The key goes in `doll.constants.ts`.
- **`DollFigure`** reads the hook and leaves out the silhouette's `svg` when it is hidden. Items keep their placement, because it is in percent of the frame, not of the drawing.
- **`Doll`** gets a second checkbox, "Показати манекен", under the doll, beside the outerwear one.

*Alternative:* a prop on `DollFigure` that each caller passes. Every caller would then read the same preference anyway, and the diary would need its own checkbox.

### 6. Turning a photograph

- **`turn(blob, kind)` in `photo/prepare.ts`.** It draws the blob onto a canvas with width and height swapped, rotated by 90°, and encodes the result with `encode(…, kind)`. A WebP or PNG stays one, and the size is already within the kind's limit.
- **`usePhoto.rotate()`.** It turns the original and, if there is one, the cut-out, under the same "latest choice wins" guard as `choose`. The colours are not read again: turning changes no pixel's colour.
- **The button.** `PhotoStep` shows a plain button "Повернути ↻" beside the preview once the photo is `ready`, disabled while it turns.

*Alternative:* store a rotation and apply it at display time. Every place that draws the item, the doll included, would have to know about it. Turning the pixels once keeps an item an image.

*Not on the card yet:* turning a saved item means uploading a new original and a new cut-out. It is left until it is asked for.

### Docs to read

- **MDN:** `fetch` `cache` and CORS with `<img>` (the "opaque response" pitfall), and `useSyncExternalStore` over `storage` events.
- **The `@imgly/background-removal` README:** the errors it throws.

## Risks / Trade-offs

- **[Risk]** The bucket's CORS rules change on deploy only when the script is run. → The task list says so, and a missing rule shows as the failure reason ("TypeError: Failed to fetch").
- **[Trade-off]** The failure reason is in English and technical. It exists to diagnose, not to explain.
- **[Trade-off]** The mannequin preference is per device, like the cut-out unfit mark. An account-wide setting would need the API, for little gain.

## Migration Plan

- Apply the CORS rules with `storage:cors`.
- No schema change. Rollback is a revert, and `GET` in CORS is harmless to leave.
