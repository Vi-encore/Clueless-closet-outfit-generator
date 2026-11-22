# Proposal

## Why

[Roadmap step 13](../../docs/roadmap.md#step-13--wardrobe-statistics) is the wardrobe's statistics:

- cost per wear;
- "not worn for N days — give away?";
- the most worn;
- the distribution by colour and category;
- the share of the wardrobe actually used.

Everything it needs is already stored:

- `Item.price` and `currency` were added for this (data-model.md);
- `wearCount` and `lastWornAt` are kept by "wore it today" since step 10;
- colours and the slot are tags.

As with step 12, the author chose two changes. This one gives the API the numbers, and `add-stats-screens` draws them, with bars and pie charts in the 98.css style.

## What Changes

- **`GET /stats`** answers the signed-in person's wardrobe in numbers, counting only items in the wardrobe (not archived):
  - **how many items there are**, and how many have been worn at least once, which gives the share actually used;
  - **the count per slot**;
  - **the count per main colour family**, the colour covering the largest share of each item. Items with no colours are counted apart;
  - **the five most worn items**, each as the wardrobe describes it, with its wear count;
  - **cost per wear** for every item with a price and at least one wear, cheapest per wear first, in its own currency. Items with a price but no wear are listed apart, as not yet worn for their price.
- **`GET /stats/unworn?days=30|90|180`** answers the items not worn for at least that many days, longest first, a page at a time as the wardrobe is (the same `limit` and `cursor`: 50 unless asked, at most 100; the screen will ask for fewer). An item never worn counts from the day it was added. The default is 90, and any other number is refused. The author asked for pages: a large wardrobe is hard to look through all at once.
- **Both are private.** They read only the caller's items.
- **No new tables, columns or indexes.** `@@index([ownerId, status])` already narrows every query to one wardrobe.

Out of scope:

- **The screen, the charts and the archive button.** That is `add-stats-screens`. Archiving uses the existing `DELETE /items/:id`.
- **Converting currencies.** Cost per wear stays in each item's own currency, and no total across currencies is made.
- **Statistics over time** (a month by month chart). The diary covers what was worn when.

## Capabilities

### New Capabilities
- `wardrobe-stats`: the wardrobe's statistics and its long-unworn items, read by their owner alone.

### Modified Capabilities
None.

## Impact

- **`apps/api`:** a new `stats/` module (controller, service, requests, interfaces, constants, utils). It imports `ItemsModule` to describe items as the wardrobe does, and reads the clock through a `CLOCK` provider like the diary's.
- **`packages/core`:** nothing new. `mainColor` from the scorer picks an item's main colour.
- **Docs:** `docs/data-model.md` (where statistics are mentioned), `openspec/config.yaml`.
