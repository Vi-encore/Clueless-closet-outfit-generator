# Idea

## Summary

A digital wardrobe that answers "what should I wear?" every morning.

1. Every item in the wardrobe is photographed, cut out from the background and described with tags (color, cut, fabric, formality, occasions).
2. You pick an occasion. The app goes through possible combinations, drops the inappropriate ones, scores the rest and suggests one of the best outfits (not the same one every time).
3. You can "try on" the outfit: generate an image of yourself wearing it.

The interface mood is a 90s retro computer, like Cher's in "Clueless", but comfortable on a phone: Windows 98 with accents from the film ([ui.md](ui.md)). All screens and features in short: [overview.md](overview.md).

## Who it is for

Anyone who signs up: each person has their own account and wardrobe, available from a phone and a computer. The first user is the project author.

## Main scenarios

1. **Add an item.** Photo from the phone → background removed automatically → AI suggests tags → review and save.
2. **Get an outfit.** Pick an occasion (work, everyday, party, date, airport…) → outfit → "another one" / save / "don't like" / "wore it today".
3. **Try on.** Tap "try on" → scanning animation → an image of yourself in this outfit.
4. **Wardrobe.** Browse items, filter, mark "in the laundry".
5. **Item management.** Archive with a reason (worn out, given away, sold); lend to another person, with or without an account in the app.
6. **History.** What was worn and when; saved outfits.

## MVP scope (by stage)

**Stage 1 — accounts and wardrobe**
- sign-up / sign-in
- adding an item: photo → background removal → tags (manual first, then AI)
- item list with filters, "in the laundry" / archived statuses

**Stage 2 — generator**
- occasions (system + custom, with their own rules)
- matching algorithm: top + bottom, dresses / jumpsuits
- "another one", saving, like / dislike, "wore it today"
- outfit shown on a 2D "paper doll": cut-out item photos on a silhouette, no AI

**Stage 3 — try-on**
- uploading reference photos of yourself
- an open model (CatVTON) on Modal (serverless GPU)
- result caching, daily limits

**Later**
- lending items and friends (see [data-model.md](data-model.md#itemloan-later))
- social features between friends: chat about lending, "help me pick an outfit" with voting, favorites, ratings (see [social.md](social.md))
- weather (Open-Meteo: free, no key)
- shoes, outerwear, accessories as extra outfit layers
- "don't repeat an outfit for N days", "not worn for a long time" statistics
- capsule wardrobe, packing a travel suitcase
- algorithm weights that adapt to likes / dislikes
- sign-in with Google

## Ideas bank

Not commitments, just a stock for the future. The last column says what each one teaches.

| Idea | Summary | What it teaches |
|---|---|---|
| **Pre-purchase check** → [features.md](features.md#pre-purchase-check) | Photograph an item in a shop → "what it goes with in your wardrobe" + "you already have 5 similar black T-shirts" | Reusing the generator for a temporary item, similarity search |
| **Travel suitcase** → [features.md](features.md#travel-suitcase) | Dates + city → weather forecast → the fewest items that give the most outfits | An interesting optimization problem, external APIs |
| **Capsule** | Pick 10–15 items → how many outfits they give, what is missing | Combinatorics |
| **Weekly plan** | A calendar of outfits with weather; "outfit of the day" as a morning push notification | Scheduled jobs (cron), Web Push |
| **Wardrobe statistics** → step 13 of the [roadmap](roadmap.md) | Cost per wear (price / number of wears), "not worn for half a year — give away?", color distribution | SQL aggregations, charts |
| **Outfit diary (OOTD)** → step 12 of the [roadmap](roadmap.md) | Photo of yourself in the outfit of the day → calendar; "a year ago you wore…" | Working with dates, a gallery |
| **Laundry and seasons** | Automatic "in the laundry" status after N wears (jeans — after 4); "in storage" for off-season items | Rules and background jobs |
| **Add an item from a shop screenshot** | Product photos are already on a white background, so background removal is nearly perfect | — (quick win) |
| **Care label** | Photograph the label → fabric composition into tags | In-browser text recognition (Tesseract.js) |
| **Challenges** | "30 days without repeats", "a week with one item" | Gamification, progress |
| **Retro mode** | 90s interface sounds, "MIS-MATCH", pixel frames | Animations, Web Audio |

## Not doing for now

- a public feed (sharing is friends-only, see [social.md](social.md#privacy-and-visibility))
- shopping recommendations
- native apps in the App Store / Google Play (the PWA covers the phone need)
