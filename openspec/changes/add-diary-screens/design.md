# Design

## Context

- **The diary API** (`add-diary-api`) has four routes:
  - `GET /diary?month=YYYY-MM` answers `DiaryEntry[]`: `{ id, date, note, photoUrl, outfit }`, where `outfit` is described exactly as `GET /outfits/:id` describes one;
  - `GET /diary/memories` answers `{ kind: 'year' | 'month', entry }[]`;
  - `POST /diary/upload-url` answers `{ key, url }`;
  - `PATCH /diary/:id` takes `{ note?, photoKey? }`, where `null` clears a field.
- **`features/outfits/doll/doll.tsx`** draws an outfit on the mannequin. Around the figure it has an outerwear checkbox and a list of the items that have no cut-out.
- **`features/wardrobe/photo/prepare.ts`** has `readPhoto(file)`. It turns a phone's photo the right way up (`imageOrientation: 'from-image'`) and encodes it for sending. `wardrobe.api.ts` uploads a blob with a signed `PUT`.
- **The desktop** draws its shortcuts from `desktop.constants.ts`, and badges come from other features through their `index.ts`.
- **`OutfitActions`** says "recorded for <date>" after "wore it today".

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Every screen reads through TanStack Query, and its keys live in `diary.constants.ts` (ADR-0017).
- The month grid is pure arithmetic on `YYYY-MM` strings, unit-tested, like the API's `monthRange`.

**Non-Goals:**
- A date picker, drag-and-drop, or editing which outfit was worn.

## Decisions

### 1. A `diary` feature with two routes

`apps/web/src/features/diary/` holds:

- **Screens:**
  - `diary.tsx`, the month, at `/diary?month=`;
  - `diary-day.tsx`, the day, at `/diary/:date`;
  - `memories.tsx`, the desktop card.
- **Parts:**
  - `month-grid.tsx` and `day-cell.tsx`;
  - `entry-editor.tsx`, one record with its form;
  - `use-day-photo.ts`, the chosen file → the blob to send.
- **The rest:** `diary.api.ts`, `diary.queries.ts`, `diary.constants.ts` (keys, the note limit), `diary.interfaces.ts`, `diary.utils.ts`, `diary.css`, `diary.spec.tsx`, `diary.utils.spec.ts`.
- **`index.ts`** exports `Diary`, `DiaryDay` and `Memories`.

**The day reads its month's query and picks its date.** No route answers one record, and the month is almost always in the cache already, because a person arrives from the calendar. Saving writes the answer into that month's cache and refreshes the memories.

*Alternative:* `/diary/entry/:id`. Two outfits on one day would be two pages, and the API has no route to read one record.

### 2. The month grid

`weeksOf(month): (string | null)[][]` gives Monday-first weeks, padded with `null`. The rest of `diary.utils.ts`:

- `shiftMonth(month, by)`;
- `monthOf(date)`;
- `currentMonth(now)`;
- `isMonth(text)`.

They work on strings, like the API's.

- **Today** is the browser's local date. The API counts days in the person's time zone, which is Kyiv by default. The two differ only for a person abroad near midnight, and there it only moves the mark.
- **Markup.** The grid is an `<ol>` of weeks drawn with CSS grid, seven columns on a phone as well. Each day with a record is a link whose accessible name says the date and the count.

*Pitfall:* `new Date('2026-03-01')` is midnight UTC. In Kyiv it is still 1 March, but west of UTC it is 28 February. Compute weekdays with `Date.UTC` and `getUTCDay`, or with pure arithmetic.

### 3. A small doll

`Doll` is split. `DollFigure({ items })` is the figure alone, with outerwear on, and is exported from `features/outfits/index.ts`. `Doll` keeps its checkbox and the "not on the doll" list around `DollFigure`. A calendar cell and a memory card draw `DollFigure` inside a small box. The figure already scales to its container, because its placement is in percent.

*Alternative:* a `compact` prop on `Doll`. One component with two behaviours is harder to test than two components, one of which wraps the other.

### 4. The day's photo

`readPhoto` is exported through `features/wardrobe/index.ts`, and nothing else of the wardrobe's photo pipeline is.

- The diary never calls `cutOut`. A photo of a person keeps its background, and the model is never fetched for it.
- `diary.api.ts` has its own `uploadDiaryPhoto(blob)`: `POST /diary/upload-url`, then `PUT`.
- **Saving** uploads first, then sends `PATCH` with `{ note, photoKey }`. When the photo is unchanged, the patch leaves `photoKey` out.

*Alternative:* moving `photo/` to `shared/`. It is the wardrobe's pipeline with cut-out and colours, and only reading is shared. Exporting one function is the smaller step.

### 5. Memories on the desktop

`Memories` reads `memoriesQuery()` and renders nothing while it loads, on an error, or when the list is empty. The desktop is the first screen after signing in, so a broken diary must not break it. Each card shows the photo, or else `DollFigure`, and links to `/diary/<date>`.

### 6. Links from "wore it"

`OutfitActions` turns its "recorded for <date>" line into a link to `/diary/<date>`. It builds a URL string and imports nothing from the diary, so `outfits` and `diary` do not import each other (the diary imports `outfits` for the doll).

### Caching

The keys are `diaryKeys.all = ['diary']`, `month(m)` and `memories()`. The queries keep `staleTime` under the photo links' life, as the outfits' do. Wearing an outfit does not have to refresh the diary: the month query has `staleTime` and is read again when the calendar is opened.

### Docs to read

- **TanStack Query:** "Updates from Mutation Responses" (`setQueryData`).
- **MDN:** `loading="lazy"` on `<img>`, and `<input type="file" accept="image/*">`. On a phone, `capture` would skip the gallery, so it is not set.
- **MDN:** `Intl.DateTimeFormat` with `{ month: 'long', year: 'numeric' }` for the month's title in Ukrainian.

## Risks / Trade-offs

- **[Risk]** Photo orientation on an iPhone was never checked (step 11). → The phone check in group 4 includes a portrait photo taken on an iPhone.
- **[Trade-off]** Every calendar cell without a photo draws a doll of up to four images. That is about thirty small figures a month, the images are the same cut-outs the wardrobe has already loaded, and they load lazily.
- **[Trade-off]** "Today" in the calendar is the browser's date, not the API's.

## Migration Plan

Client only. Rollback is a revert.
