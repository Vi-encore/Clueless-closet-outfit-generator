# Design

## Context

- **Colours are read from the cut-out** by `colorsFromPixels` in `packages/core/src/taxonomy/colors-from-pixels.ts`.
  - It answers up to three `{ family, hex, share }`, largest share first, and drops anything under `LEAST_SHARE` (0.1).
  - Its `REFERENCES` hold one to three typical RGB values per family. They are private to that file.
- **What reads colours:**
  - the scorer reads `mainColor` (the largest share) and its hex, through `hexToHsl`;
  - the doll's backdrop (`add-diary-screens`) reads each item's main hex.
- **The API:** `PATCH /items/:id` already accepts `colors`, because the update schema is the create schema made partial. An empty array is valid. `ItemsService` writes the patch as given, so `colors` is replaced, not merged.
- **The new item form** keeps `draft.colors: ItemColor[]` and shows them in `ColorList` (`features/wardrobe/color-list.tsx`) with a remove button each.
- **The card** (`item-sheet.tsx`) shows colours in `TagLines` and edits only visibility (`SharingSwitch`) and the archive (`ArchiveForm`). Both are a small mutation that writes its answer into `itemQuery`'s cache.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One editor, used by the form and the card.
- What the person chooses is what the scorer and the doll read, in its hex as well as its family.

**Non-Goals:**
- Exact shades, reordering colours, or editing shares by hand.

## Decisions

### 1. A typical colour per family, in `core`

`COLOR_SWATCHES: Record<ColorFamily, string>` and `LEAST_COLOR_SHARE = 0.1` go into `packages/core/src/taxonomy/taxonomy.constants.ts`.

- `colors-from-pixels.ts` imports the share, instead of keeping its own `LEAST_SHARE`.
- The swatches are each family's middle reference, written as hex. For example, white is `#f5f5f2` and grey is `#808080`.

*Why in core:* the vocabulary of families lives there, and `Record<ColorFamily, …>` makes a family added later fail to compile until it has a swatch.

*Alternative:* keep the measured hex when the family changes. A white top read as `#bdbdbd` would then be "white" whose hex is grey. The scorer and the backdrop would still see grey, and the fix would only be a label.

### 2. Three pure edits

These are functions in `features/wardrobe/wardrobe.utils.ts`, on `readonly ItemColor[]`, each answering a new list:

- **`withFamily(colors, index, family)`** changes one colour's family and sets its hex to the swatch.
  - If that family is already listed, the two are merged: shares are summed, capped at 1, and the merged colour takes the swatch.
- **`withAdded(colors, family)`** appends `{ family, hex: swatch, share }`. The share is `LEAST_COLOR_SHARE`, or 1 when the list was empty.
- **`withoutColor(colors, index)`** removes one.

They are unit-tested apart from the screens.

### 3. `ColorEditor` replaces `ColorList`

`color-editor.tsx` takes `{ colors, onChange }`. For each colour it draws:
- a swatch;
- a `<select>` of families, named after the family, which calls `withFamily`;
- the remove button it has today.

Below them is one `<select>` "Додати колір" of the families not yet listed, with an empty first option. Choosing one calls `withAdded` and the select goes back to empty. When every family is listed, the select is not drawn.

The new item form draws `ColorEditor` where `ColorList` was, and `ColorList` is deleted. The editor is drawn with no colours too, so that a person whose photo gave none can add one.

### 4. The card

`item-colors.tsx` (`ItemColors`) is drawn under the tags when the item is not archived.

- **Closed:** a `.secondary` button "Змінити кольори".
- **Open:** `ColorEditor` over a local copy, plus `.action` "Зберегти" and a plain "Скасувати".
- **Saving:** a `useMutation` sends `setColors(id, colors)`, which is `PATCH /items/:id` with `{ colors }`.
  - On success it writes the answer into `itemQuery(id)`, as `SharingSwitch` does, refreshes `itemKeys.lists()`, and closes.
  - On failure it shows `ErrorDialog` and keeps the copy, so nothing typed is lost. The card's own lines still read from the cache, so they show the colours as they were.

### Pitfalls

- **A `<select>` per colour needs its own name.** Use `aria-label={uk.newItem.colorFamily(uk.colors[family])}`, or a test cannot tell them apart.
- **Keys.** Key rows by family, since families are unique in the list. An index key would keep the wrong select open after a removal.
- **`share` sums.** After a merge, cap at 1. The schema refuses more than 1.

## Risks / Trade-offs

- **[Trade-off]** A swatch is a typical colour, not the real one. A cream top set to "white" is scored as pure white. The family was already the coarse unit of the scorer, so this matches what the person said.
- **[Trade-off]** An added colour takes the smallest share. It never becomes the main colour unless it is the only one. To make a colour the main one, the person changes the main colour's family instead of adding.

## Migration Plan

No schema change. Rollback is a revert.
