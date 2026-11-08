# Design

## Context

The client is grouped by feature (`features/<name>/` reached through `index.ts`), reads server data through TanStack Query, and draws every screen in a 98.css `Window`. Every word comes from `shared/i18n/uk.ts`; occasions already have labels there. Tests render the whole app with MSW (`test/render-app.tsx`, `test/server.ts`, `test/api-fixtures.ts`). The API now answers:
- `POST /outfits/generate` → `{ outfit }`;
- `GET /outfits/:id`, `GET /outfits/saved`;
- `PUT /outfits/:id/reaction`;
- `PUT` and `DELETE /outfits/:id/save`;
- `POST /outfits/:id/wear` → `{ id, outfitId, date }`.

An outfit's `items` are full `ItemView`s, in slot order.

## Decisions

### Feature and routes

`features/outfits/` with `index.ts` exporting `Outfits`, `SavedOutfits`, `OutfitScreen`:

| Route | Screen |
|---|---|
| `/outfits` | Generation. `?occasion=` holds the choice, default `casual`; `?with=<itemId>` asks around an item. |
| `/outfits/saved` | The saved outfits. Declared before `:id`. |
| `/outfits/:id` | One outfit. A 404 or 400 shows `NotFound`, as the item card does. |

A desktop shortcut uses the pixelarticons icon `human` (or the nearest one the package has).

### Server data

- `outfits.api.ts`: one function per route.
- `outfits.queries.ts`:
  - `outfitKeys = { all, saved(), one(id) }`;
  - `savedOutfitsQuery` (infinite, `nextPage` like the wardrobe);
  - `outfitQuery(id)`.
- **Generation is a `useMutation`, not a query.** Every press makes and stores a new outfit, so it must not be cached or refetched on focus. The outfit it answers goes into `outfitKeys.one(id)` with `setQueryData`, and the screen reads the shown outfit from there. A reaction, a save or a wear then updates the same cache entry, and the generation screen and `/outfits/:id` render one component, `OutfitPanel`, from one source.
- **Reaction, save and unsave** answer the outfit. That answer replaces the cache entry, and `saved()` is invalidated.
- **Wear** answers a record. The panel keeps its date in local state for the line "Записано на 02.03.2026". The date is formatted from the `YYYY-MM-DD` string by splitting it, never through `new Date`, which would move it a day west of UTC.

### Generation screen

- An occasion `<select>` (labels from `uk.occasions`) and "Скласти образ".
- `seen: string[]` in component state holds every outfit id shown on this screen. "Ще один" sends it; changing the occasion clears it.
- `?with=` triggers one request on arrival, with `mustInclude: [id]`.
- `{ outfit: null }` → `uk.outfits.nothing` ("З цього поки не скласти образ"), and "around an item" its own line. A failed request → `ErrorDialog`, as forms do.

### `OutfitPanel`

The doll, the reason and the actions:
- **The reason:** `uk.outfits.components[name]` and the score with one decimal for each component of the breakdown. A total below 0 shows "MIS-MATCH" in the title-bar style.
- **Actions:**
  - like and dislike as `aria-pressed` toggle buttons; pressing the pressed one sends `null`;
  - "Зберегти" / "Прибрати зі збережених";
  - "Вдягнула сьогодні".
  
  Each is disabled while its own request runs; a failure opens `ErrorDialog`.

### The doll: auto-fit only

- **`doll/mannequin.ts`:** one silhouette as an SVG path in a `viewBox` of 100 × 220, and its anchors as fractions of the frame:
  - `shoulderY`, `shoulderWidth`;
  - `waistY`, `hipWidth`;
  - `ankleY`, `feetWidth`.

  The render code knows only "picture + anchors", so other bases (step 14) replace this file.
- **`doll/auto-fit.ts`:** `autoFit(slot, anchors): Placement | null`, a pure function. `Placement = { left, top, width, layer }` in percent of the frame, centred horizontally; `null` for an accessory.

  | Slot | Top edge | Width | Layer |
  |---|---|---|---|
  | top | shoulder line | `shoulderWidth × 1.5` (sleeves) | 2 |
  | bottom | waist | `hipWidth × 1.3` | 1 |
  | one-piece | shoulders | `shoulderWidth × 1.5` | 2 |
  | outerwear | shoulders | `shoulderWidth × 1.75` | 3 |
  | shoes | ankle line | `feetWidth` | 4 |

  The factors sit in one `FIT` constant, to be tuned by eye on real cut-outs.
- **Height is never set:** each `<img>` gets `left`, `top` and `width` in percent and `height: auto`, so the browser keeps the image's proportions without the client measuring it. Length is not adjusted either, as try-on.md says: a crop top stays short.

  So the spec's "Proportions are kept" is checked as "given a width and no height", the part the client controls.
- **`Doll` component:** a relative container with the 100:220 aspect ratio, the silhouette as inline SVG, then the items with a cut-out as absolutely placed `<img>` sorted by layer. Items without a cut-out go to a row of small photos under the doll.

### Trimming the cut-out at capture

- `photo/trim.ts`: `opaqueBox(rgba, width, height, threshold = 8): Box | null`, a pure function over the alpha channel.
- `cutOut` draws the model's PNG to a canvas, reads its pixels once, and encodes the cropped box with `encode` (which already accepts any `SizedImage`; it gains an optional source rectangle). An image with no opaque pixel keeps its full size.
- Reading pixels here is safe: the image came from the model in this tab, not from storage.

### Item card

`ItemSheet` gets a link-styled button "Скласти образ з цією річчю" to `/outfits?with=<id>` when `status !== 'archived'`. `features/outfits` reads `Item` and `ItemTile`-like thumbnails from `features/wardrobe/index.ts`; wardrobe does not import outfits, a `Link` to a path is enough.

## Structure

`features/outfits/`:
- `index.ts`;
- screens: `outfits.tsx` (generation), `outfit-screen.tsx`, `saved-outfits.tsx`, `outfit-panel.tsx`;
- `outfits.api.ts`, `outfits.queries.ts`, `outfits.interfaces.ts`;
- `doll/`: `doll.tsx`, `auto-fit.ts`, `mannequin.ts`, `doll.interfaces.ts`, `auto-fit.spec.ts`;
- `outfits.spec.tsx`;
- `outfits.css` if the doll needs more than utilities.

## Pitfalls

- **`useMutation` and StrictMode:** `?with=` must ask once; guard the effect with a ref keyed by the item id.
- **Presigned image URLs expire** (minutes). An outfit opened from the cache long after can show broken images. `outfitQuery` gets a `staleTime` below the URL lifetime, as the wardrobe's queries rely on refetching.
- **Changing the occasion clears `seen`**, or "another one" for a new occasion would skip outfits never shown for it.
- **The date line** must not go through `Date` (see Server data).
- **The conventions test:** props types and `Placement`, `Anchors`, `Box` go in interfaces files; no Cyrillic outside `uk.ts`.
