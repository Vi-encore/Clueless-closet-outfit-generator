# Proposal

## Why

`add-diary-api` gave the API a diary: a month of wear records, a note and a photo on each, and memories of the same day a year and a month ago. Nothing in the client reads it yet. This change draws [roadmap step 12](../../docs/roadmap.md#step-12--outfit-diary) on the screen and closes the step:

- the calendar shows what was worn each day, with photos;
- the home screen shows a "a year / a month ago" memory when there is one.

## What Changes

- **A diary shortcut on the desktop.** It opens the current month.
- **A month is a calendar.** Weeks start on Monday.
  - A day with a record shows its photo. A day without a photo shows a small doll wearing the outfit, as the author chose.
  - More than one outfit on a day is shown as a count.
  - Today is marked. Photos load only when they come into view.
  - The previous and the next month are a press away, and the month is in the address, so it can be returned to.
- **A day is a page of its own.** It shows each outfit worn that day on the doll, with its note and its photo. A day with nothing on it says so.
- **A day takes a note and a photo.**
  - The person writes a note of up to 2000 characters, chooses a photo of themselves, or takes either away, and saves.
  - The photo is read and shrunk as an item's is, but its background is never cut out: it is a photo of a person, not of a thing.
- **Memories on the desktop.** When the API answers a memory, the desktop shows a card: "a year ago" or "a month ago", the photo or the doll, and a link to that day. With none, nothing is shown.
- **"Wore it today" leads to the diary.** The line that says the date it was recorded for also links to that day, where the note and the photo are added.

Out of scope:

- **Recording a past day and undoing "wore it".** The API does neither (`add-diary-api`).
- **Sharing a diary photo with friends.**
- **Statistics of what is worn.** That is step 13.
- **Week or year views, and searching the diary.**

## Capabilities

### New Capabilities
- `web-diary`: the diary in the client. It covers the month calendar, a day with its note and photo, and memories on the desktop.

### Modified Capabilities
- `web-outfits`: after "wore it today", the screen links to that day of the diary.

## Impact

- **`apps/web`:**
  - a new `features/diary/` (screens, api, queries, constants, interfaces, utils, styles);
  - `app/app.tsx` gets two routes, `/diary` and `/diary/:date`;
  - the desktop gets the diary shortcut and the memory card;
  - `features/outfits` shares the doll's figure without its controls, for the small dolls;
  - `features/wardrobe` shares reading a photo;
  - `shared/i18n/uk.ts` gets the diary's words.
- **No API change.**
- **Docs:** the roadmap step's checkboxes, `openspec/config.yaml`.
