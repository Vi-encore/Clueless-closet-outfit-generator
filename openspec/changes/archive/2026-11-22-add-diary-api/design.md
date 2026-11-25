# Design

## Context

- **`WearLog` already has what the diary needs:** `ownerId`, `outfitId`, a `date` column holding a calendar day in the person's time zone, `photoKey`, `note`, and an index on `(ownerId, date)` (`add-outfits-api`).
- **`POST /outfits/:id/wear`** writes one record per outfit per day, using `User.timezone` and `calendarDateIn` from `outfits/calendar-date.ts`.
- **Item photos go through `POST /items/upload-url`.** It issues keys `items/<ownerId>/<uuid>.<ext>` (`storage/keys.ts`). `ownerOf(key)` reads the owner back, and `ItemsService` refuses a key that is not the caller's.
- **`OutfitsService.view`** describes an outfit with its items and their signed photo links. It is private to the outfits module.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Three reads and two writes, each keeping the rule that a person only ever sees their own records.
- Dates computed once, in one place, in the person's time zone.

**Non-Goals:**
- Screens, recording a past day, and deleting a record. Undoing "wore it" would also have to take the wear counts back, and that is a decision of its own.

## Decisions

### 1. A `diary` module over `WearLog`

`apps/api/src/diary/` holds:

- **`diary.controller.ts`**, at `/diary`, with these routes:
  - `GET ?month=`;
  - `GET memories`;
  - `POST upload-url`;
  - `PATCH :id`.
- **`diary.service.ts`**;
- **`requests/`** with `month.query.ts`, `update-entry.request.ts` and `upload-url.request.ts`;
- **`diary.interfaces.ts`**, `diary.constants.ts` and `diary.utils.ts`.

It imports `OutfitsModule`, which now exports `OutfitsService` with a public `describe(outfit)`, the existing private `view` renamed. It also imports `StorageModule`.

The answer for a record is `DiaryEntry`: `{ id, date, note, photoUrl, outfit: OutfitView }`.

*Alternative:* routes under `/outfits/…/wear`. The diary is read by month, across outfits, so it is a resource of its own. The `outfits` module stays about outfits.

### 2. Keys know their folder

`keyFor(folder, ownerId, contentType)` and `ownerOf(folder, key)` take `'items' | 'diary'`. The pattern checks the folder, so a diary key never passes as an item's photo, and the other way round. `ItemsService` passes `'items'` and nothing else changes for it.

*Why separate folders:* a photo of a person in an outfit is more private than a photo of a sweater. Keeping them apart makes "never shared with friends" a property of where the file is, and a future cleanup or export can treat the two differently.

### 3. Dates

These are pure functions in `diary.utils.ts`, on `YYYY-MM-DD` strings, with no `Date` arithmetic that a time zone could shift:

- **`monthRange('2026-03')`** gives `{ from: '2026-03-01', to: '2026-04-01' }`. The query is `date >= from AND date < to`, using the `(ownerId, date)` index.
- **`memoryDates('2026-11-22')`** gives `{ year: '2025-11-22', month: '2026-10-22' }`. The month memory is `null` when the day does not exist in the month before (31 March has none in February). 29 February has no year memory either, unless last year was a leap year.

"Today" comes from `calendarDateIn(user.timezone, now)`, the same rule `wear` uses. The clock is the one input that is not pure. `DiaryService` reads it through a `CLOCK` provider (`() => new Date()`), which a test can replace.

### 4. Writing a note and a photo

- **`PATCH /diary/:id`** takes `{ note?: string | null, photoKey?: string | null }`. An absent field is left alone, and `null` clears it. The note is trimmed: an empty one is `null`, and at most 2000 characters are allowed.
- **A `photoKey`** must satisfy `ownerOf('diary', key) === callerId`, or the answer is 400.
- **Ownership** is checked as `findFirst({ id, ownerId })`, and anything else is a 404.
- **A replaced or cleared photo** is removed with `StorageService.remove` after the update. A failure there is logged and ignored, as items do: the record is already right.

### 5. Reading

**`GET /diary?month=`** reads the month's records, including each outfit with its items, ordered by `date` then `createdAt`. Each one is described with:

- `OutfitsService.describe` for the outfit;
- a view link for the photo, through `StorageService.viewUrl`, which `S3_PUBLIC_URL` already rewrites for the phone mode.

**`GET /diary/memories`** reads at most two dates' records, and marks each one.

## Risks / Trade-offs

- **[Trade-off]** The month answer signs a link for every item of every outfit in it. That is about thirty outfits of four items, local arithmetic with no requests, the same cost a wardrobe page already has.
- **[Risk]** A person who changes time zone sees days that were recorded in the old one. → A record is a calendar day by design (data-model.md). It stays the day it was.
- **[Trade-off]** No delete. A wrong "wore it" stays until undoing is designed.

## Migration Plan

No schema change. Rollback is a revert.
