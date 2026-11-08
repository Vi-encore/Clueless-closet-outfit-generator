# Data model (draft)

## Entities and relations

```
User ─┬─< Item ─┬─< OutfitItem >── Outfit
      │         └─< ItemLoan >── User (borrower, if they have an account)
      ├─< Outfit ─< WearLog
      ├─< Occasion        (custom; system ones have ownerId = null)
      ├── BodyProfile     (1 : 1, optional)
      ├─< ReferencePhoto
      ├─< TryOnJob
      ├─< UsageCounter
      └─< Friendship >── User
```

`─<` means "one to many".

General rules: all ids are UUIDs; all timestamps are `timestamptz` (UTC). Chat, favorites and ratings entities are in [social.md](social.md#data-model-draft).

## User

| Field | Description |
|---|---|
| `id`, `email`, `passwordHash` | |
| `username` | Unique — people can be found by it |
| `displayName` | |
| `timezone` | Time zone (e.g. `Europe/Kyiv`) — for the diary and the "outfit of the day" |
| `createdAt` | |

## Item

**Who fills it in:**
- **AI** — suggested by Gemini ([auto-tagging.md](auto-tagging.md)); the user can change anything;
- **photo** — computed automatically from the pixels of the cut-out photo;
- **manual** — the user only;
- **auto** — the system.

**Only `slot` and `type` are required to save**; the rest can be filled in later. The generator doesn't penalize empty fields: a scoring component that lacks data scores 0.

The database stores codes (`blouse`, `viscose`); the Ukrainian labels live in the UI dictionary. All enums live in `packages/core`.

### Basics

| Field | Values | Who |
|---|---|---|
| `name` | A short name: "White satin blouse" | AI |
| `slot` | `top`, `bottom`, `one_piece`, `outerwear`, `shoes`, `accessory` | AI, **required** |
| `type` | Depends on the slot: for `top` — `t_shirt`, `blouse`, `shirt`, `sweater`…; for `bottom` — `jeans`, `trousers`, `skirt`, `shorts`… | AI, **required** |

### Look

| Field | Values | Who |
|---|---|---|
| `colors` | `[{ family: "blue", hex: "#3b5b8c", share: 0.8 }]` | photo |
| `pattern` | `solid`, `stripes`, `checks`, `floral`, `animal`, `print`… | AI |
| `fabricType` | The texture visible in the photo: `denim`, `knit`, `jersey`, `satin`, `chiffon`, `lace`, `corduroy`, `velvet`, `tweed`, `leather`… | AI |

### Cut

| Field | Values | Who |
|---|---|---|
| `fit` | `fitted`, `regular`, `oversized` | AI |
| `length` | `cropped` / `regular` / `long`; for skirts and dresses — `mini` / `midi` / `maxi` | AI |
| `rise` (bottoms) | `low`, `mid`, `high` | manual |

### Material and care

| Field | Values | Who |
|---|---|---|
| `materials` | Composition from the label: `[{ material: "viscose", percent: 70 }, { material: "polyester", percent: 30 }]`; `percent` is optional. Materials: `cotton`, `linen`, `wool`, `cashmere`, `silk`, `viscose`, `polyester`, `polyamide`, `elastane`, `acrylic`, `leather`, `faux_leather`… | manual (AI only guesses, always `uncertain`) |
| `care` (later) | Care: `machine_30`, `hand_wash`, `dry_clean`… — from a photo of the label | manual |

**Texture ≠ composition.** A satin blouse can be silk, viscose or polyester — you can't tell them apart in a photo. So the texture (`fabricType`) is suggested by AI, and the composition (`materials`) comes from the label.

### When to wear

| Field | Values | Who |
|---|---|---|
| `seasons` | Any of `spring`, `summer`, `autumn`, `winter`. **"All-season"** is a UI button that selects all four | AI |
| `warmth` | 1 (heat) … 5 (frost) — how warm the item is | AI |
| `formality` | 1 (home) … 5 (black tie) | AI |
| `styles` | `classic`, `street`, `romantic`, `sporty`, `preppy`, `boho`, `minimal`… | AI |
| `occasions` | `work`, `casual`, `party`, `date`, `sport`, `travel`, `home`… | AI |
| `avoidOccasions` | A party top → not for `work` | manual |

**`seasons` ≠ `warmth`.** `warmth` is a physical property of the item; it's what we match against the weather. `seasons` is when the item is actually worn:
- a black T-shirt — `warmth` 1, but all-season (in winter — under a sweater);
- a linen shirt — `warmth` 1, summer only;
- a wool coat — `warmth` 5, autumn and winter.

### Purchase (optional)

| Field | Values | Who |
|---|---|---|
| `brand`, `size` | Brand, size (the size matters for lending) | manual |
| `price`, `currency`, `purchasedAt` | For statistics (cost per wear); default currency — `UAH` | manual |

### Photo

| Field | Values | Who |
|---|---|---|
| `photoOriginalKey`, `photoCutoutKey` | File keys in storage | auto |
| `dollFit` | Position on the 2D doll: `{ x, y, scale, rotation }` relative to the base's anchors (in shoulder-width units), so it works with any base (see [try-on.md](try-on.md#stage-0-2d-doll)) | manual (fitting screen) |

### State and bookkeeping

| Field | Values | Who |
|---|---|---|
| `ownerId` | Owner; doesn't change when the item is lent out | auto |
| `status` | `available`, `laundry`, `archived` (later — `wishlist` for the pre-purchase check) | manual |
| `archivedReason`, `archivedAt` | Worn out, given away, sold, damaged | manual |
| `visibility` | `private` (default) / `friends` | manual |
| `wearCount`, `lastWornAt` | Updated together with `WearLog` | auto |
| `aiSuggestion`, `taggingVersion` | What the model suggested (JSON) — to assess auto-tagging quality | auto |
| `notes` | Free-form note | manual |
| `createdAt`, `updatedAt` | | auto |

### Item lifecycle

- **An item isn't physically deleted, it's archived with a reason.** Otherwise outfit history and statistics break. Full deletion only via an explicit "delete forever" action or together with the account.
- **Ownership and location are different things.** `ownerId` doesn't change; where the item is now is shown by an active `ItemLoan`. "Lent out" isn't a status but the presence of an active loan, so two fields can't get out of sync.
- **The generator takes** only items with status `available` and no active loan (later — also items lent to this user).

## ItemLoan (later)

| Field | Description |
|---|---|
| `itemId`, `lenderId` | The item and its owner |
| `borrowerUserId` | If the borrower has an account (nullable) |
| `borrowerName` | If there's no account — just a name for your own records |
| `status` | `pending` (awaiting confirmation), `active`, `returned`, `declined` |
| `lentAt`, `dueAt`, `returnedAt` | |

Scenarios:
- **The borrower has an account** → gets a request → confirms → the item temporarily appears in their wardrobe marked "borrowed" and can show up in their outfits.
- **The borrower has no account** → just a name and a date, for your own records.
- **Return** → `returnedAt`, the item is available to the owner again.
- **Photo access:** the borrower sees the item's photo only while the loan is active.

## Friendship

One person's side of a relation with another. A relation is two records, one held by each person,
written and removed together ([ADR-0016](adr/0016-each-person-holds-their-side-of-a-relation.md)).

| Field | Description |
|---|---|
| `userId` | whose record this is |
| `otherUserId` | the person it is about; unique together with `userId` |
| `status` | `pending`, `accepted`, `blocked` — the same on both sides, `blocked` while either side blocks |
| `requestedByMe` | whether this person asked |
| `blocked` | whether this person has blocked the other; the other never reads it |
| `createdAt`, `updatedAt` | |

A person can only be found by their exact `username` — there's no public user directory.

## Outfit and OutfitItem

| Entity | Fields |
|---|---|
| `Outfit` | `id`, `ownerId`, `occasion` (an `OCCASIONS` code; a nullable `occasionId` joins it when custom occasions arrive), `score`, `breakdown` (JSON — per-component scores), `reaction` (`like` / `dislike` / null), `savedAt`, `createdAt` |
| `OutfitItem` | `outfitId`, `itemId`, `slot` |

## WearLog

`id`, `ownerId`, `outfitId`, `date`, `photoKey?` (a photo of yourself in the outfit — the diary), `note?`. If a combination that wasn't generated is worn, an `Outfit` (without a `score`) is still created for it.

`date` is a calendar date in the user's time zone (not a point in time): "what was worn on September 30" must not drift to another day because of UTC. One record per outfit per day (a unique index on `outfitId` + `date`): wearing the same outfit twice in a day counts once.

## Occasion

`id`, `ownerId` (null — system), `name`, `targetFormality`, `rules` (JSON — forbidden / required properties), `weights` (JSON — scoring component weights).

## BodyProfile (optional)

Measurements for the [mannequin from your measurements](try-on.md#mannequin-from-your-measurements). One per user, all fields optional.

| Field | Description |
|---|---|
| `userId` | Owner (1 : 1) |
| `heightCm`, `bustCm`, `waistCm`, `hipsCm` | Height and circumferences |
| `shoulderCm`, `inseamCm` | Shoulder width, leg length; computed if empty |
| `skinTone` | The mannequin's skin tone; empty — neutral grey |
| `dollBase` | Doll base: `default` / `measured` / `photo` (+ `referencePhotoId`) |
| `updatedAt` | |

Owner only: not shown to friends, not sent to AI.

## ReferencePhoto, TryOnJob, UsageCounter

| Entity | Fields |
|---|---|
| `ReferencePhoto` | `id`, `ownerId`, `kind` (`face` / `full_body`), `storageKey`, `cutoutKey` (background removed), `anchors` (JSON — anchors for the 2D doll), `isDollBase`, `version` |
| `TryOnJob` | `id`, `ownerId`, `outfitId`, `referencePhotoId` (base photo), `provider` (`local_worker` / `modal` / `gemini`), `status` (`pending` / `running` / `done` / `failed`), `cacheKey`, `resultKey`, `error`, `createdAt`, `startedAt`, `finishedAt` |
| `UsageCounter` | `ownerId`, `date`, `kind` (`try_on` / `auto_tag`), `count` — for daily limits |
