# Tasks

## 1. Tables

- [x] 1.1 Claude writes the `schema.db-spec.ts` tests for "An outfit holds its items and goes with its owner" and "A wear record is a calendar date, once per outfit"; verify they fail
- [x] 1.2 Add `Outfit`, `OutfitItem` and `WearLog` to `schema.prisma` with a migration; verify the tests pass and `prisma generate` leaves no type errors

## 2. Generating

- [x] 2.1 Claude writes `test/outfits.db-spec.ts` for "An outfit is generated from the person's own wardrobe", "An outfit is generated around chosen items" and "Another one is another outfit"; verify they fail
- [x] 2.2 Move `tagsOf` to `items/tags-of.ts`, give `ItemsService` (already exported) a public `views(items)`, move `@Public()` from the controller class to the score route; verify the existing items and outfits tests still pass
- [x] 2.3 Add the generate request schema, `OutfitView`, `OutfitsService.generate` and the route; verify the group's tests pass

## 3. Reading, reacting, saving

- [x] 3.1 Claude writes the tests for "An outfit is readable only by its owner", "An outfit can be liked or disliked" and "An outfit can be saved"; verify they fail
- [x] 3.2 Add `GET /outfits/saved`, `GET /outfits/:id`, `PUT /outfits/:id/reaction`, `PUT` and `DELETE /outfits/:id/save`; verify the tests pass

## 4. Wearing

- [x] 4.1 Claude writes the unit test of `calendarDateIn` (the Auckland scenario) and the db tests for "Wearing an outfit is recorded once a day", including two requests at once; verify they fail
- [x] 4.2 Add `calendar-date.ts` and `POST /outfits/:id/wear` with the transaction and the unique-violation fallback; verify `pnpm --filter @closet/api test`, `test:db`, typecheck and lint pass

## 5. Docs

- [x] 5.1 Correct `docs/data-model.md` (occasion as a code, one wear record per outfit per day), tick the API half of step 10 in `docs/roadmap.md`, and update `openspec/config.yaml`'s context
