# Proposal

## Why

"Вдягнула сьогодні" already writes a `WearLog`, and the table already has a `photoKey` and a `note` that nothing fills or reads. [Roadmap step 12](../../../docs/roadmap.md#step-12--outfit-diary) turns those records into a diary:

- a photo of oneself in the outfit and a note;
- a month's calendar;
- "a year ago you wore…".

The author chose to split the step in two, as step 10 was. This first change gives the API what the diary screens will read and write. `add-diary-screens` follows.

## What Changes

- **A wear record takes a note and a photo of the person in it.** `PATCH /diary/:id` takes `{ note?, photoKey? }`, either set or cleared with `null`.
  - The photo is uploaded the way an item's is, through `POST /diary/upload-url`, to a key under `diary/<ownerId>/`.
  - A key that names somebody else, or a key of an item's photo, is refused.
  - A replaced photo is removed from storage, as an item's is.
- **A month of the diary.** `GET /diary?month=YYYY-MM` answers that month's records in date order. Each comes with its outfit, as `GET /outfits/:id` describes it, with the items' photo links, plus the note and a view link to the photo.
- **Memories.** `GET /diary/memories` answers the records dated exactly one year and exactly one month before today, in the person's time zone. A day that does not exist that month, such as 31 March to February, has no memory.
- **The diary is private.** Its routes read and write only the signed-in person's records. Somebody else's id is a 404, and a diary photo is never part of anything a friend can read. Body photos are not shared by default ([social.md](../../../docs/social.md#privacy-and-visibility)).
- **No new tables.** The `photoKey` and `note` columns exist since `add-outfits-api`.

Out of scope:

- **The screens:** the calendar, a day, the memory on the desktop. That is `add-diary-screens`.
- **Recording a past day, and undoing "wore it".**
- **Sharing a diary photo with friends.**

## Capabilities

### New Capabilities
- `outfit-diary`: notes and photos on wear records, a month of the diary, and memories of a year and a month ago, all private to their owner.

### Modified Capabilities
- `photo-storage`: keys gain a second folder, `diary/`. A key from one folder is refused where the other is expected.

## Impact

- **`apps/api`:**
  - a new `diary/` module (controller, service, requests, interfaces, constants, utils);
  - `storage/keys.ts` takes the folder (`items` or `diary`);
  - `OutfitsModule` exports what the diary needs to describe an outfit;
  - the date helpers in `outfits/calendar-date.ts` gain month arithmetic.
- **No migration:** the columns and the `(ownerId, date)` index exist.
- **Docs:** `docs/data-model.md` (WearLog), `openspec/config.yaml`.
