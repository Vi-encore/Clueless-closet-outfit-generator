# Tasks

## 1. The checks

- [x] 1.1 Claude writes the six scenarios of the two new requirements in `packages/conventions/src/conventions.test.ts`: the four about the checks on sources written in the test, and the two over every package with tests and fixtures left out; verify the two repository scenarios fail and list today's files
- [x] 1.2 Add `crowdedFiles(source, path)`, `exportsMixedWithConstants(source)` and the test-path filter to `packages/conventions/src/conventions.ts`; verify the four check scenarios pass and the two repository lists match the files in design.md (record any the checks found beyond them)

## 2. The API

- [x] 2.1 Split the API's class files and move exported constants: helpers to `<folder>.utils.ts`, constants to `<folder>.constants.ts` (auth, chat, friends, items, outfits, throttling, users, docs, pagination); verify `pnpm --filter @closet/api typecheck`, `test` and `test:db` pass, and that neither repository scenario lists an `apps/api` file

## 3. The client: session, desktop and chat

- [x] 3.1 Split `session/` (`require-session.tsx`, `sign-in.tsx`, `sign-up.tsx`), `desktop/desktop.tsx` and `chat/` (`conversation.tsx`, `use-conversation.ts`, the queries and keys); verify `pnpm --filter @closet/web test` and typecheck pass, and that those folders are off both lists

## 4. The client: friends and wardrobe

- [x] 4.1 Split `friends/` (`friends.tsx` into the screen, `row.tsx`, `sheet.tsx`, `people.tsx`, `find-person.tsx` and `use-friend-action.ts`; the queries and keys)
- [x] 4.2 Split `wardrobe/` (`item-card.tsx`, `new-item.tsx`, `photo-step.tsx`, `tag-lines.tsx`, `wardrobe.tsx`, `tag-form.tsx` into `wardrobe/tag-form/`, `photo/prepare.ts`, the queries and keys); verify the web suite and typecheck pass, and that both folders are off both lists

## 5. The client: outfits

- [ ] 5.1 Split `outfits/` (`outfits.tsx`, `outfit-panel.tsx`, `saved-outfits.tsx`, `doll/doll.tsx`, `doll/auto-fit.ts`, the queries and keys) and `shared/` (`api/api-error.ts`, `hooks/use-form-submit.ts`); verify the web suite and typecheck pass, and that no `apps/web` file is listed

## 6. Core

- [ ] 6.1 Move core's exported constants into `generator/generator.constants.ts`, `scoring/scoring.constants.ts` and `taxonomy/taxonomy.constants.ts`, and `typeBelongsToSlot` into `taxonomy/slots.ts`, keeping `index.ts`'s exports; verify the whole `pnpm test` passes, both repository scenarios included

## 7. Docs

- [ ] 7.1 Write ADR-0018 (one thing per file) and add it to `docs/adr/README.md`; add both rules to the code conventions in `docs/architecture.md` and to "Where code lives" in `openspec/config.yaml`; verify `pnpm lint`, `prettier --check` and `openspec validate --all` pass

## Workflow follow-up

- Archive `one-thing-per-file` when the author asks, commit and push `dev`. PR #4 picks the commits up.
