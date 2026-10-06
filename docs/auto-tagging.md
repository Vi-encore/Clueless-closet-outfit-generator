# Auto-tagging: recognizing an item from a photo

## Summary

- **We call Gemini on the free tier.** All you need is a Google account and a key from [AI Studio](https://aistudio.google.com/), no card.
- **The response format is fixed in advance:** JSON following our schema (structured output). The model cannot answer with free text — only with an object that can go straight into the form.
- **The model only suggests tags.** The user reviews them in the form; we write to the database only after confirmation.

## Single source of truth: enums in core

- All allowed values (slots, types, patterns, fabrics, styles, occasions…) are `as const` arrays in `packages/core`.
- From them we derive: TS types, the `TagSuggestion` zod schema, the JSON Schema for Gemini (in zod 4 — `z.toJSONSchema()`), DTO validation in Nest, form options on the client. Add a new item type — it appears everywhere.
- The database stores **codes** (`blouse`, `silk`), and the Ukrainian labels live in the UI dictionary. That way translating or renaming doesn't touch the data.

## Response format (draft)

```json
{
  "name": "Біла атласна блуза",
  "slot": "top",
  "type": "blouse",
  "pattern": "solid",
  "fabricType": "satin",
  "materials": [{ "material": "silk" }],
  "fit": "regular",
  "length": "regular",
  "seasons": ["spring", "summer", "autumn"],
  "warmth": 2,
  "formality": 3,
  "styles": ["classic", "romantic"],
  "occasions": ["work", "date"],
  "uncertain": ["materials", "fabricType"]
}
```

- `uncertain` lists fields the model isn't sure about; the form highlights them for review. `materials` is always there: the composition is only visible on the label.
- Whatever the model can't determine is `null`.
- `name` is the only free-text field (in Ukrainian, as the prompt says — "White satin blouse" in the example); everything else is codes from the enums.
- **The model doesn't determine colors** — we compute them ourselves from the pixels of the cut-out photo (`node-vibrant` / `colorthief`): more accurate and free.
- `rise`, `avoidOccasions`, brand, size, price are manual only.
- The full field list: [data-model.md](data-model.md#item).

## Flow

1. The client already has the cut-out photo (step 9). In parallel it:
   - computes colors from the pixels (on the client);
   - downsizes the photo to ~512 px → `POST /ai/tag-suggestions` (multipart, ≤ 1 MB). If the user has already picked a slot, it's sent as a hint (`slotHint`), which improves accuracy. The photo is not stored anywhere for recognition.
2. Nest checks the daily limit (`UsageCounter`, `auto_tag`) → `TaggingProvider.suggest(image, hints)`.
3. `GeminiTaggingProvider`: prompt + image + JSON Schema → response → **validation with the zod schema**. We don't trust the model's answer even with a schema: values can be inappropriate (e.g. a `type` from another slot). Invalid fields → `null`.
4. The client gets `{ suggestion, taggingVersion }` → **the form is pre-filled but fully editable**:
   - AI-filled fields carry a small "AI" badge, uncertain ones are highlighted;
   - multi-value fields (seasons, styles, occasions) are chips; seasons have an "All-season" button;
   - only `slot` and `type` are required — you can save quickly and fill in the rest later.
5. The user reviews → a regular `POST /items`; `aiSuggestion` and `taggingVersion` are saved along with it, so we can later compare what the AI suggested with what the person corrected.

If the AI is unavailable (limit, no network) — the same form, just empty.

For the [pre-purchase check](features.md#pre-purchase-check) — the same endpoint; the item isn't stored (or is stored with status `wishlist`).

## Providers

`TaggingProvider` is an interface, like `TryOnProvider`:
- **`ManualTaggingProvider`** returns an empty suggestion. At step 9 the form is filled in manually, but already in the same format.
- **`GeminiTaggingProvider`** — step 15.
- **Later, if needed** — a local vision model (e.g. via Ollama) or a paid Gemini tier.

## Free tier: limitations

- **Request limits are per key, i.e. shared by all users.** Hence: a daily per-user limit; if the quota is exhausted (HTTP 429), quietly fall back to the manual form.
- **Data:** on the free tier Google may use requests to improve its products. We send only item photos (never photos of people) and mention this in the privacy policy. For production with many users — the paid tier (≈ $0.0002 per item).
- **The model is configurable** (`GEMINI_TAGGING_MODEL`): names and prices change often.
- **Exact SDK field names** for structured output — check against the [current documentation](https://ai.google.dev/gemini-api/docs/structured-output) at step 15, the API evolves. Gemini supports a subset of JSON Schema: `type`, `properties`, `required`, `enum`, `items`; very large or deeply nested schemas may be rejected.

## Versioning

`taggingVersion` (prompt version + schema version) comes back with the suggestion, so we can later re-run recognition for old items or compare the quality of versions.

## Testing

- Tests never call Gemini — a `TaggingProvider` mock.
- A set of 10–20 photos of your own items with expected tags, to compare prompt versions.
