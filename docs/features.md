# Features after the PoC

Both features are built on the generator from [outfit-algorithm.md](outfit-algorithm.md#generator-interface): it takes items as a list and supports `mustInclude` / `exclude`. If that is laid down at step 1, both can be added without reworking the core.

## Pre-purchase check

**Scenario:** you photograph an item in a shop → within a few seconds you see:
1. how many good outfits it gives with your wardrobe, and the 3–5 best ones on the 2D doll;
2. similar items you already own ("you already have 5 black T-shirts");
3. a verdict: "Buy" / "Think about it" / "You already have something similar".

### How it works

1. **Photo → background removal → tags.** Auto-tagging is highly desirable: filling in a form by hand in a shop is inconvenient. Without it — a short three-field form: slot, color, formality. Tags come from the same endpoint as for regular items ([auto-tagging.md](auto-tagging.md#flow)); the photo is not stored anywhere.
2. **A "virtual" item.** Not stored in the wardrobe (or stored with status `wishlist`, to decide later).
3. **The generator with `mustInclude: [new item]`** against your real items → the number of outfits scoring above a threshold + the best of them.
4. **Gain is the main metric:** how many new good outfits appear thanks to this item. An item that gives 12 new outfits is more useful than one that gives 2.
5. **Similarity:** the same slot and type + a close color (distance in the Lab color space, not RGB — it's closer to human perception) + shared styles.

### When to add it and how hard it is

After the generator (step 10), ideally after auto-tagging (step 15). If the generator is a pure function with `mustInclude`, it's roughly **a few days of work**: one endpoint, one screen, a similarity function. `wishlist` is added as one more `Item.status` value.

## Travel suitcase

**Input:** a city; dates; which days have which occasions (default "everyday"; you can mark "work", "party"); constraints (e.g. "carry-on only" → at most N items; whether laundry is possible).

### How it works

1. **Weather.** City → coordinates ([Open-Meteo](https://open-meteo.com/) Geocoding) → forecast for the trip days (up to ~16 days ahead). For later dates — averages for the same dates in past years from the weather archive. Open-Meteo is free for non-commercial use and needs no key. For each day — the min and max temperature and precipitation → what clothing warmth is needed and whether outerwear is needed.
2. **Day requirements.** A list of what has to be "covered": day × occasion × weather.
3. **Candidates.** Only items that fit at least one day by warmth and occasion.
4. **The minimal set.** This is a "set cover" problem: the exact solution is expensive, but a greedy approach is enough for a wardrobe:
   - compute each item's "versatility" — with how many candidates it forms good pairs;
   - add items one at a time, picking the one that "covers" the most not-yet-covered days (or gives the most new good outfits) relative to its "weight";
   - once all days are covered, try dropping each item in turn: if the days stay covered, drop it;
   - count shoes as "heavier" — they're bulky.
5. **Schedule.** For each day — an outfit from the set only, with no identical outfits in a row.
6. **Result:**
   - a packing list with checkboxes;
   - a calendar of outfits by day;
   - "8 items → 12 outfits";
   - what to wear on the way (the bulkiest items — on yourself).

### What it teaches

- External APIs with response caching.
- Optimization heuristics.
- Testing an algorithm on prepared data: `planTrip(items, days, constraints)` — a pure function in `core`.
- An optional extra — an exact solver via integer linear programming.

### When to add it

After the generator, together with a general "weather" feature — it will also be needed for the daily outfit.
