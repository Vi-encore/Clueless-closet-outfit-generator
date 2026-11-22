# Design

## Context

- **The API (`add-stats-api`).**
  - `GET /stats` answers `{ items, worn, bySlot, byColor, mostWorn, costPerWear, unwornWithPrice }`. Money comes as strings with two decimals, plus a `currency`.
  - `GET /stats/unworn?days=&limit=&cursor=` answers `{ items: { item, lastWornAt }[], nextCursor }`.
- **Paging in the client.** Lists read a page at a time through `useInfiniteQuery` and `shared/hooks/shown-pages.ts`, as the wardrobe does.
- **Archiving.** `features/wardrobe`'s `ArchiveForm` archives from the card: it requires a reason (no default, "so the statistics count how clothes really end"), then leaves the card. `archiveItem(id, reason)` is in `wardrobe.api.ts`.
- **The look.** `COLOR_SWATCHES` (core) gives each colour family a typical hex. The 98.css segmented bar is already drawn for the cut-out progress, in `wardrobe.css`.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- No chart library: the pie charts and the bars are CSS.
- A chart's numbers can always be read as text, from its legend.

**Non-Goals:**
- Animation, hover tooltips, or interactive filtering by a sector.

## Decisions

### 1. A `stats` feature

`apps/web/src/features/stats/` holds:

- **Screens and parts:**
  - `stats.tsx`, the screen at `/stats?days=`;
  - `pie-chart.tsx` and `worn-bars.tsx`;
  - `cost-per-wear.tsx`, `unworn-list.tsx` and `unworn-row.tsx`, the row with its archive step.
- **The rest:**
  - `stats.api.ts` and `stats.queries.ts`;
  - `stats.constants.ts`, with `statsKeys` and the slot palette;
  - `stats.interfaces.ts` and `stats.utils.ts`;
  - `stats.css` and `stats.spec.tsx`.
- **`index.ts`** exports `Stats`.

**What it uses from the wardrobe.** `features/wardrobe/index.ts` additionally exports `archiveItem`, `itemKeys` and `ItemTile`. The stats feature imports the wardrobe, never the other way.

### 2. Pie charts in CSS

`sectorsOf(counts): { from: number, to: number }[]` in `stats.utils.ts` turns counts into fractions of a turn. `pieGradient(sectors, colours)` writes `conic-gradient(white 0turn 0.5turn, red 0.5turn 0.75turn, …)`.

`PieChart({ label, slices })` takes `{ key, label, count, colour }[]` and draws:

- a `<figure aria-label={label}>`;
- a round `div` with that background, `aria-hidden`, since the legend says the same;
- a `<ul>` legend with a swatch, the label and the count.

**Colours.**
- **By colour**, a sector is `COLOR_SWATCHES[family]`, and items with no colours are silver. A white sector gets a grey outline in the legend swatch, so it is seen on white.
- **By category**, a fixed palette per slot in `stats.constants.ts`, from the app's own purples, navy and teal, distinct from each other.

*Alternative:* SVG arcs (`<path d="M … A …">`). That means more arithmetic, and the same picture. `conic-gradient` works in every browser this project targets.

### 3. Bars for the most worn

Each bar's width is `wearCount / max` as a percent (`barPercent`), set inline. The bar is `.segmented-bar` in `shared/styles/retro.css`: a `div` well with an inner `span`, drawing the same navy blocks as the cut-out's `<progress>`, whose own look stays in `wardrobe.css` because a `<progress>` is styled through its pseudo-elements. A row is the item's small picture, its name, the bar, and "6 разів".

The words for "times" depend on the number in Ukrainian: 1 раз, 2–4 рази, 5+ разів. `uk.stats.times(n)` picks the form with the usual rule, which goes in `shared/i18n/i18n.utils.ts` as `pluralUk(n, one, few, many)`.

### 4. Cost per wear

Two short lists:

- **"Ціна одного вдягання"** — the name, then `200.00 UAH`, with the strings from the API shown as they are. The currency is shown by its code, not formatted, so a mixed wardrobe reads honestly.
- **"Ще не вдягнуті"** — the name, then the price.

Each list is hidden when it is empty.

### 5. Unworn, a page at a time

- **The days.** `?days=` is read with `daysFrom(text)`: `'30' | '90' | '180'`, else `'90'`.
- **The query.** `unwornQuery(days)` is an infinite query with `limit: 12`, keyed `statsKeys.unworn(days)`.
- **The choice** is a `<select>` that writes the address, as the occasion choice on the outfit screen does.
- **A row** is `ItemTile` as a link to `/wardrobe/:id`, then "Востаннє: 01.07.2026" or "Ще не вдягала", then "В архів".

### 6. Archiving from a row

`UnwornRow` keeps `asking: boolean`.

- **"В архів"** opens, in the row, a `<select>` of the reasons (`ARCHIVE_REASONS`, `uk.archiveReasons`, an empty first option) with "Прибрати" and "Скасувати".
- **Without a reason**, it shows `uk.item.noReason` and sends nothing.
- **With one**, a `useMutation` calls `archiveItem(id, reason)`. On success:
  - the item is removed from every `statsKeys.unworn` page in the cache;
  - `statsKeys.summary()` and `itemKeys.lists()` are refreshed;
  - the item's own cache entry is set, as the card does.

*Alternative:* reuse `ArchiveForm`. It closes to the wardrobe on success, which is right for the card and wrong here, and making it optional would mix two screens' behaviour in one component.

### Caching

- `statsKeys = { all: ['stats'], summary: () => [...all, 'summary'], unworn: (days) => [...all, 'unworn', days] }`.
- The queries keep the photo-link `staleTime`, like the outfits'.

## Risks / Trade-offs

- **[Trade-off]** A pie chart of 14 colour families has thin slivers. The legend carries the numbers, and a sector under 2% may be invisible.
- **[Trade-off]** Wearing an outfit does not refresh the statistics. They are read again when the screen is opened, with `staleTime` under a minute.

## Migration Plan

Client only. Rollback is a revert.
