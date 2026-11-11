# Tasks

## 1. The domain package: suggestions and colors

- [x] 1.1 Claude writes the tests for "A tag suggestion has the shape of the tags" and "Colors are read from an item's pixels" in `packages/core`; verify they fail
- [x] 1.2 Add `tagSuggestionSchema`, `readSuggestion` and `getTagSuggestionJsonSchema` in `taxonomy/tag-suggestion.ts`; verify their tests pass
- [x] 1.3 Add `colorsFromPixels` in `taxonomy/colors-from-pixels.ts`, with reference colors per family compared in CIELAB; verify its tests pass and `pnpm --filter @closet/core test` is green

## 2. The API keeps a cut-out

- [x] 2.1 Claude writes the tests for "An item keeps a cut-out beside its photograph" and the two new scenarios of "An item answers with a link to its photograph" in `apps/api/test/items.db-spec.ts` and `photos.db-spec.ts`; verify they fail
- [x] 2.2 Accept and check `photoCutoutKey`, remove a replaced one, answer `cutoutUrl`; verify `pnpm --filter @closet/api test:db` passes

## 3. The photo, in the browser

- [x] 3.1 Claude writes the tests for "Photographs are made smaller before sending" against `fitWithin` and an `encode` given a fake canvas; verify they fail
- [x] 3.2 Add `@imgly/background-removal` to `apps/web`, and `photo/` with `readPhoto`, `fitWithin`, `encode` and `cutOut` (imported lazily); verify the tests pass and `pnpm --filter @closet/web build` shows the library in a chunk of its own
- [x] 3.3 Try the four functions on a desktop browser with a real photograph, and show the author the cut-out

## 4. The new item flow

- [x] 4.1 Claude writes the tests for "The background is cut out before saving", "Colors are offered from the photograph" and the modified "An item can be added with a photograph" in `wardrobe.spec.tsx`, with `photo/` mocked; verify they fail
- [x] 4.2 Split `new-item.tsx` into the flow: camera and gallery, preparing, the cut-out to keep or decline, the colors; `createItem` uploads one or two images; verify the group's tests pass and the author adds an item in a browser

## 5. Every tag

- [x] 5.1 Claude writes the tests for "Every tag can be filled in", the modified "An item's card says what it is" and "Every code a person reads has a label"; verify they fail
- [x] 5.2 Add every vocabulary's labels to `uk.ts`; verify the label test passes
- [x] 5.3 Build the tag form from the vocabularies, filled from a `TagSuggestion`, sending only what was filled in; verify its tests pass
- [x] 5.4 Show the cut-out and every tag on the card and the cut-out on the tile; verify `pnpm --filter @closet/web test` passes and the author checks the form and the card in a browser at phone width

## 6. On a phone, and the docs

- [x] 6.1 Move the phone check to step 11 in `docs/roadmap.md`, with what it has to find out (whether an iPhone holds `isnet_fp16`, the first cut-out's time over a phone's connection, storage a phone can reach): the author's decision, since a phone cannot reach the API on `localhost:3000`, MinIO on `localhost:9000`, or the camera without HTTPS until the tunnel exists
- [x] 6.2 Update `docs/roadmap.md` (step 9's two changes, the provider moved to step 15), `docs/auto-tagging.md` (the same) and `openspec/config.yaml`'s context
