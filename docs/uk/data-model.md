# Модель даних (чернетка)

## Сутності й зв'язки

```
User ─┬─< Item ─┬─< OutfitItem >── Outfit
      │         └─< ItemLoan >── User (позичальник, якщо має акаунт)
      ├─< Outfit ─< WearLog
      ├─< Occasion        (власні; системні мають ownerId = null)
      ├── BodyProfile     (1 : 1, опційно)
      ├─< ReferencePhoto
      ├─< TryOnJob
      ├─< UsageCounter
      └─< Friendship >── User
```

`─<` — «один до багатьох».

Загальні правила: усі id — UUID; усі дати — `timestamptz` (UTC). Сутності чату, обраного й оцінок — у [social.md](social.md#модель-даних-чернетка).

## User

| Поле | Опис |
|---|---|
| `id`, `email`, `passwordHash` | |
| `username` | Унікальний — за ним можна знайти людину |
| `displayName` | |
| `timezone` | Часовий пояс (напр. `Europe/Kyiv`) — для щоденника й «образу дня» |
| `createdAt` | |

## Item

**Хто заповнює:**
- **AI** — пропонує Gemini ([auto-tagging.md](auto-tagging.md)), користувач може змінити будь-що;
- **фото** — рахується автоматично з пікселів вирізаного фото;
- **вручну** — лише користувач;
- **авто** — система.

**Обов'язкові для збереження лише `slot` і `type`**, решту можна дозаповнити пізніше. Генератор не штрафує за порожні поля: компонент оцінки, для якого бракує даних, дає 0.

У базі зберігаються коди (`blouse`, `viscose`), українські назви — у словнику інтерфейсу. Усі переліки живуть у `packages/core`.

### Основне

| Поле | Значення | Хто |
|---|---|---|
| `name` | Коротка назва: «Біла атласна блуза» | AI |
| `slot` | `top`, `bottom`, `one_piece`, `outerwear`, `shoes`, `accessory` | AI, **обов'язкове** |
| `type` | Залежить від слоту: для `top` — `t_shirt`, `blouse`, `shirt`, `sweater`…; для `bottom` — `jeans`, `trousers`, `skirt`, `shorts`… | AI, **обов'язкове** |

### Вигляд

| Поле | Значення | Хто |
|---|---|---|
| `colors` | `[{ family: "blue", hex: "#3b5b8c", share: 0.8 }]` | фото |
| `pattern` | `solid`, `stripes`, `checks`, `floral`, `animal`, `print`… | AI |
| `fabricType` | Фактура, яку видно на фото: `denim`, `knit`, `jersey`, `satin`, `chiffon`, `lace`, `corduroy`, `velvet`, `tweed`, `leather`… | AI |

### Крій

| Поле | Значення | Хто |
|---|---|---|
| `fit` | `fitted`, `regular`, `oversized` | AI |
| `length` | `cropped` / `regular` / `long`; для спідниць і суконь — `mini` / `midi` / `maxi` | AI |
| `rise` (для низу) | `low`, `mid`, `high` | вручну |

### Матеріал і догляд

| Поле | Значення | Хто |
|---|---|---|
| `materials` | Склад з етикетки: `[{ material: "viscose", percent: 70 }, { material: "polyester", percent: 30 }]`, `percent` — необов'язковий. Матеріали: `cotton`, `linen`, `wool`, `cashmere`, `silk`, `viscose`, `polyester`, `polyamide`, `elastane`, `acrylic`, `leather`, `faux_leather`… | вручну (AI — лише здогадка, завжди `uncertain`) |
| `care` (пізніше) | Догляд: `machine_30`, `hand_wash`, `dry_clean`… — з фото етикетки | вручну |

**Фактура ≠ склад.** Атласна блуза може бути з шовку, віскози чи поліестеру — на фото їх не розрізнити. Тому фактуру (`fabricType`) пропонує AI, а склад (`materials`) береться з етикетки.

### Коли носити

| Поле | Значення | Хто |
|---|---|---|
| `seasons` | Будь-які з `spring`, `summer`, `autumn`, `winter`. **«Всесезонна»** — кнопка в інтерфейсі, що обирає всі чотири | AI |
| `warmth` | 1 (спека) … 5 (мороз) — наскільки річ тепла | AI |
| `formality` | 1 (дім) … 5 (урочисто) | AI |
| `styles` | `classic`, `street`, `romantic`, `sporty`, `preppy`, `boho`, `minimal`… | AI |
| `occasions` | `work`, `casual`, `party`, `date`, `sport`, `travel`, `home`… | AI |
| `avoidOccasions` | Топ для вечірки → не для `work` | вручну |

**`seasons` ≠ `warmth`.** `warmth` — фізична властивість речі, за нею підбираємо під погоду. `seasons` — коли річ реально носять:
- чорна футболка — `warmth` 1, але всесезонна (взимку — під светр);
- лляна сорочка — `warmth` 1, лише літо;
- вовняне пальто — `warmth` 5, осінь і зима.

### Покупка (необов'язково)

| Поле | Значення | Хто |
|---|---|---|
| `brand`, `size` | Бренд, розмір (розмір знадобиться при позичанні) | вручну |
| `price`, `currency`, `purchasedAt` | Для статистики (вартість одного вдягання); валюта за замовчуванням — `UAH` | вручну |

### Фото

| Поле | Значення | Хто |
|---|---|---|
| `photoOriginalKey`, `photoCutoutKey` | Ключі файлів у сховищі | авто |
| `dollFit` | Позиція на 2D-ляльці: `{ x, y, scale, rotation }` відносно якорів основи (в одиницях ширини плечей), тож працює з будь-якою основою (див. [try-on.md](try-on.md#етап-0-2d-лялька)) | вручну (екран підгонки) |

### Стан і облік

| Поле | Значення | Хто |
|---|---|---|
| `ownerId` | Власник; не змінюється, коли річ позичено | авто |
| `status` | `available`, `laundry`, `archived` (пізніше — `wishlist` для перевірки перед покупкою) | вручну |
| `archivedReason`, `archivedAt` | Застаріла, віддана, продана, зіпсована | вручну |
| `visibility` | `private` (за замовчуванням) / `friends` | вручну |
| `wearCount`, `lastWornAt` | Оновлюються разом із `WearLog` | авто |
| `aiSuggestion`, `taggingVersion` | Що запропонувала модель (JSON) — щоб оцінювати якість автотегів | авто |
| `notes` | Довільна нотатка | вручну |
| `createdAt`, `updatedAt` | | авто |

### Життєвий цикл речі

- **Річ не видаляється фізично, а архівується з причиною.** Інакше зламаються історія образів і статистика. Повне видалення — лише явною дією «видалити назавжди» або разом з акаунтом.
- **Власність і місцезнаходження — різні речі.** `ownerId` не змінюється; де річ зараз, видно з активного `ItemLoan`. «Позичена» — це не статус, а наявність активного позичання, щоб два поля не розсинхронізувалися.
- **Генератор бере** лише речі зі статусом `available` без активного позичання (пізніше — ще й речі, позичені цьому користувачу).

## ItemLoan (пізніше)

| Поле | Опис |
|---|---|
| `itemId`, `lenderId` | Річ і її власник |
| `borrowerUserId` | Якщо позичальник має акаунт (nullable) |
| `borrowerName` | Якщо акаунта немає — просто ім'я для власного обліку |
| `status` | `pending` (чекає підтвердження), `active`, `returned`, `declined` |
| `lentAt`, `dueAt`, `returnedAt` | |

Сценарії:
- **Позичальник має акаунт** → отримує запит → підтверджує → річ тимчасово з'являється в його гардеробі з позначкою «позичено» й може потрапляти в його образи.
- **Позичальник без акаунта** → лише ім'я й дата, для власного обліку.
- **Повернення** → `returnedAt`, річ знову доступна власнику.
- **Доступ до фото:** позичальник бачить фото речі лише поки позичання активне.

## Friendship (пізніше)

| Поле | Опис |
|---|---|
| `requesterId`, `addresseeId` | |
| `status` | `pending`, `accepted`, `blocked` |
| `createdAt` | |

Знайти людину можна лише за точним `username` — загального каталогу користувачів немає.

## Outfit і OutfitItem

| Сутність | Поля |
|---|---|
| `Outfit` | `id`, `ownerId`, `occasionId`, `score`, `breakdown` (JSON — бали за компонентами), `reaction` (`like` / `dislike` / null), `savedAt`, `createdAt` |
| `OutfitItem` | `outfitId`, `itemId`, `slot` |

## WearLog

`id`, `ownerId`, `outfitId`, `date`, `photoKey?` (фото себе в образі — щоденник), `note?`. Якщо вдягнуто комбінацію, яку не генерували, для неї все одно створюється `Outfit` (без `score`).

`date` — календарна дата в часовому поясі користувача (не момент часу): «що вдягалося 30 вересня» не має з'їжджати на інший день через UTC.

## Occasion

`id`, `ownerId` (null — системна), `name`, `targetFormality`, `rules` (JSON — заборонені / обов'язкові властивості), `weights` (JSON — ваги компонентів оцінки).

## BodyProfile (опційно)

Мірки для [манекена за параметрами](try-on.md#манекен-за-вашими-параметрами). Один на користувача, усі поля необов'язкові.

| Поле | Опис |
|---|---|
| `userId` | Власник (1 : 1) |
| `heightCm`, `bustCm`, `waistCm`, `hipsCm` | Зріст і обхвати |
| `shoulderCm`, `inseamCm` | Ширина плечей, довжина ніг; якщо порожні — рахуються |
| `skinTone` | Тон шкіри манекена; порожнє — нейтральний сірий |
| `dollBase` | Основа ляльки: `default` / `measured` / `photo` (+ `referencePhotoId`) |
| `updatedAt` | |

Лише для власника: не показується друзям, не надсилається в AI.

## ReferencePhoto, TryOnJob, UsageCounter

| Сутність | Поля |
|---|---|
| `ReferencePhoto` | `id`, `ownerId`, `kind` (`face` / `full_body`), `storageKey`, `cutoutKey` (без фону), `anchors` (JSON — якорі для 2D-ляльки), `isDollBase`, `version` |
| `TryOnJob` | `id`, `ownerId`, `outfitId`, `referencePhotoId` (базове фото), `provider` (`local_worker` / `modal` / `gemini`), `status` (`pending` / `running` / `done` / `failed`), `cacheKey`, `resultKey`, `error`, `createdAt`, `startedAt`, `finishedAt` |
| `UsageCounter` | `ownerId`, `date`, `kind` (`try_on` / `auto_tag`), `count` — для добових лімітів |
