# Proposal

## Why

`add-stats-api` gave the API the wardrobe in numbers (`GET /stats`) and the items not worn for a long time (`GET /stats/unworn`). Nothing in the client reads them yet. This change draws them and closes [roadmap step 13](../../docs/roadmap.md#step-13--wardrobe-statistics):

- a statistics screen with 3–4 metrics and charts;
- a "not worn for a long time" list with an "archive" action.

The author asked for pie charts as well as the project's own styles. Pie charts can be drawn with CSS alone (`conic-gradient`), so there is no chart library.

## What Changes

- **A statistics shortcut on the desktop**, opening `/stats`.
- **The wardrobe in numbers.** At the top: how many items there are, and how many of them are worn, as a share ("ви носите 12 з 40 речей, 30%").
- **Two pie charts, by category and by main colour.**
  - Each is a circle cut into sectors, drawn with CSS, with a legend that lists every sector with its count.
  - A colour's sector is that colour, its family's swatch. Items with no colours are a grey sector of their own.
- **The most worn,** as bars in the 98.css style, each with the item's picture, name and wear count.
- **Cost per wear,** cheapest first, in the item's own currency.
  - Items bought and not yet worn are listed below it, with their price.
  - Nothing is shown for a wardrobe with no prices.
- **"Давно не вдягала".**
  - A choice of 30, 90 or 180 days, kept in the address. The items are read a page at a time with "Показати ще", each a link to its card, with when it was last worn or "ще не вдягала".
  - Each item offers "В архів": it asks why, with the same reasons as the card, and once archived the item leaves the list and the numbers.
- **Empty states.** An empty wardrobe says so, and so does a list with nothing unworn.

Out of scope:

- **Statistics over time,** converting currencies, and filters by season or occasion.
- **A chart library.** The pie charts and the bars are CSS.

## Capabilities

### New Capabilities
- `web-stats`: the statistics screen in the client, its charts, and the list of items not worn for a long time with archiving from it.

### Modified Capabilities
None.

## Impact

- **`apps/web`:**
  - a new `features/stats/` (screen, charts, lists, api, queries, constants, interfaces, utils, styles);
  - a route `/stats` in `app/app.tsx`;
  - the desktop shortcut;
  - `features/wardrobe` shares `archiveItem`, `itemKeys` and `ItemTile` through its index;
  - `uk.ts` gets the words.
- **No API change.**
- **Docs:** tick step 13 in `docs/roadmap.md`, and `openspec/config.yaml`.
