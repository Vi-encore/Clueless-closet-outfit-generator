# Tasks

## 1. Putting an item back, in the API

- [x] 1.1 Claude writes the tests for "An archived item can be put back" in `apps/api/test/items.db-spec.ts`; verify they fail
- [x] 1.2 Add `POST /items/:id/restore` and `ItemsService.restore`; verify `pnpm --filter @closet/api test:db` passes and the route is in Swagger at `/docs`

## 2. The archive on screen

- [x] 2.1 Claude writes the tests for "Archived items can be looked at" and "An archived item can be put back" in `apps/web/src/features/wardrobe/wardrobe.spec.tsx`; verify they fail
- [x] 2.2 Add the archive to the wardrobe's filter, with its key in the cache and its empty message; verify the first group of tests passes
- [x] 2.3 Show the archived line and "Повернути в шафу" on the card; verify `pnpm --filter @closet/web test` passes and the author archives and restores an item in a browser

## 3. Docs

- [x] 3.1 Name both changes of step 9 in `docs/roadmap.md`, and update `openspec/config.yaml`'s context
