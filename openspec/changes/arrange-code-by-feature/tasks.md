# Tasks

## 1. The rules as tests

- [x] 1.1 Claude writes the tests "A shape is declared in an interfaces file", "No object type is written inline" and "No source says any" over every package in `packages/conventions`, and "A feature is reached through its index", "Shared code knows no feature" and "Every stylesheet is in the components layer" in `apps/web/test/conventions.spec.ts`; verify they fail for the reasons expected
- [x] 1.2 Set `typescript/no-explicit-any` to `error` in `.oxlintrc.json`; verify `pnpm lint` passes

## 2. Shared and app

- [x] 2.1 Move the API client, the error, the token store, the frame, the dialogs, the hooks, the dictionary, the theme and `config.ts` into `shared/`, and `app.tsx`, the shell and the taskbar into `app/`, with `git mv`; name every props and state type in an interfaces file; verify `pnpm --filter @closet/web test` still runs 87 tests besides the layout ones, all passing, and "Shared code knows no feature" passes

## 3. Session, wardrobe and friends

- [ ] 3.1 Make `features/session/` with its API calls, interfaces, `index.ts` and spec; verify the suite
- [ ] 3.2 Make `features/wardrobe/` the same way, with `wardrobe.css`; verify the suite
- [ ] 3.3 Make `features/friends/` the same way, importing the wardrobe through its index; verify the suite

## 4. Chat and desktop

- [ ] 4.1 Make `features/chat/` with the socket, provider, hooks, screens, `bubble.tsx`, `unread-badge.tsx` and `chat.css`; verify the suite
- [ ] 4.2 Make `features/desktop/` with `desktop.css`; remove the emptied folders; verify all six web conventions tests pass, `pnpm lint`, `pnpm typecheck` and `pnpm --filter @closet/web build`
- [ ] 4.3 The author looks at every screen in a browser at desktop and phone width, since jsdom does not apply the cascade and only a person can see a style that went missing

## 5. API and core

- [ ] 5.1 Move the hand-written shapes in `apps/api/src` and `packages/core/src` into interfaces files, and the four test copies of `Account` into `apps/api/test/test.interfaces.ts`; verify the conventions tests pass in both, with `pnpm test` and `pnpm --filter @closet/api test:db`

## 6. Docs

- [ ] 6.1 Write ADR-0014 (the client is arranged by feature) and ADR-0015 (shapes are named in interfaces files, no `any`), update `docs/architecture.md`, the "Where code lives" paragraph in `openspec/config.yaml` and a line in `docs/roadmap.md`
