# The app in short: screens and features

A summary of everything planned. Details are behind the links.

## What it is

A digital wardrobe styled after Cher's computer in "Clueless": you photograph your clothes, pick an occasion, and the app picks an outfit and shows it on a 2D doll. It works on a phone and a computer (PWA); every user has their own account and wardrobe, and users can befriend and message each other.

## The main loop

```
add items → pick an occasion → outfit on the doll → "wore it today" → diary and statistics
                                    ↑                                         │
                                    └──── likes, "another one", history ──────┘
```

The generator takes into account what was worn and when, plus your likes, so outfits get better over time.

## What it looks like

Windows 98 with "Clueless" accents: grey bevelled windows, pink title bars, Cher's yellow plaid on the desktop, and a "MATCH!" verdict in pixel letters. Style and library details: [ui.md](ui.md).

- **Phone:** every screen is a full-screen window; at the bottom there is a taskbar: "Start" + the main sections + a clock and a new-messages badge. "Start" opens a menu with the remaining sections.
- **Computer:** a desktop with shortcuts and centered windows. Later: several windows side by side (wardrobe + doll) and dragging.

The "Outfit of the day" screen on a phone (sketch; the UI itself is in Ukrainian):

```
┌──────────────────────────────┐
│ Образ дня              [?][x]│  ← window title bar
├──────────────────────────────┤
│ Нагода: [Робота       v]     │
│ ┌────────────┐  Колір   ████ │
│ │    (  )    │  Силует  ███░ │  ← per-component scores
│ │   блуза    │  Стиль   ██░░ │
│ │   штани    │               │
│ │   туфлі    │   MATCH!      │  ← verdict
│ └────────────┘               │
│ [Лайк] [Ні]  [Ще варіант]    │
│ [Вдягнула сьогодні]          │
├──────────────────────────────┤
│[Пуск] Гардероб Образ Чат 9:41│  ← taskbar
└──────────────────────────────┘
```

## Screens and features (PoC)

| Screen | What is there | Step |
|---|---|---|
| **Sign in / sign up** | Email and password | 4, 8 |
| **Wardrobe** | A grid of cut-out photos; filters (slot, season, color, status), search; an "Add item" button | 5, 8 |
| **Add item** | Camera or gallery → background removal → tag form. Manual at first, later AI pre-fills it ([auto-tagging.md](auto-tagging.md)); only category and type are required | 9, 15 |
| **Item card** | Photo, tags, how many times it was worn; actions: edit, "to the laundry", "outfit with this item", archive with a reason | 5, 10 |
| **Outfit of the day** | Occasion → outfit on the doll + scores; like / "no" / "another one" / save / "wore it today" | 10 |
| **Doll fitting** | Drag and scale an item on the mannequin once — after that it sits in place by itself ([try-on.md](try-on.md#stage-0-2d-doll)) | 10 |
| **Saved outfits** | List of saved and liked outfits | 10 |
| **Friends and chat** | Search by `username`, friend requests, live conversations | 6, 8 |
| **Diary** | Calendar of "what was worn", photos of yourself in the outfit, "a year ago you wore…" | 12 |
| **Statistics** | Cost per wear, "not worn for a long time — give away?", distribution by color and category | 13 |
| **Settings** | Name, time zone, sign out | 8 |
| **My mannequin** | Doll base: the standard mannequin, a mannequin from your measurements, or your own photo ([try-on.md](try-on.md#mannequin-from-your-measurements)) | 10, 14 |

System occasions (work, everyday, party, date, sport, home, travel) — from step 10.

## After the PoC

| Feature | Summary | Where it is described |
|---|---|---|
| AI try-on | A photo of yourself in the outfit via CatVTON | [try-on.md](try-on.md) |
| Favorites and ratings | A star on an item or outfit; likes from friends | [social.md](social.md#likes-favorites-ratings) |
| "Help me pick an outfit" | 2–3 outfit options sent to friends for a vote | [social.md](social.md) |
| Lending | Lend an item to a friend, chat about the loan | [data-model.md](data-model.md#itemloan-later), [social.md](social.md) |
| Pre-purchase check | Photo in a shop → how many new outfits the item gives | [features.md](features.md#pre-purchase-check) |
| Travel suitcase | City and dates → the fewest items for the most outfits | [features.md](features.md#travel-suitcase) |
| Custom occasions | "Airport", "job interview" with their own rules | [outfit-algorithm.md](outfit-algorithm.md#occasions-are-data-not-code) |
| Weather, morning "outfit of the day" | Open-Meteo, push notifications | [idea.md](idea.md#ideas-bank) |
| App store apps | The same code inside Capacitor | [mobile.md](mobile.md) |

Other ideas (capsule, challenges, retro sounds…) are in the [ideas bank](idea.md#ideas-bank).
