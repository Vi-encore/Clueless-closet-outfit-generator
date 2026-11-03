# Proposal

## Why

`apps/web` grew one screen at a time and ended up arranged by two rules at once: by layer (`api/`, `screens/`, `shell/`, `platform/`) and by feature (`chat/`, `session/`). One feature is therefore spread over up to five folders. The chat, for example, lives in `api/chat.ts`, `chat/`, `platform/chat-socket.ts`, `screens/chat.tsx` and `screens/conversation.tsx`, and its styles sit in a shared `retro.css`. The author reviewed the code after step 8 and asked for a folder per feature instead, which is also how `apps/api` is already split into Nest modules. Step 9 is about to add a lot to the wardrobe, so this is the moment to move, before more code lands in the old places.

The author also restated two rules that hold for the whole repository:
- `any` is never used. The linter has `no-explicit-any` switched off today, so nothing enforces it.
- Shapes are named in interfaces files. In practice the code drifted: props typed inline, interfaces at the top of services, and the same `interface Account` written in four API test files.

## What Changes

- **`apps/web/src` is rearranged:**
  - `features/<feature>/` for session, wardrobe, friends, chat and desktop, each holding its API calls, interfaces, hooks, screens, styles and tests;
  - `shared/` for what several features use (the API client, the window frame and dialogs, the loading hooks, the dictionary, the theme);
  - `app/` for the routes and providers.
  - A feature is reached only through its `index.ts`.
- **Each feature's styles move into a stylesheet beside it**, and are still imported into the `components` layer from `index.css`.
- **The rules become tests:** a small workspace package, `packages/conventions`, reads every package's source the way the dictionary test already does, and the client gets a test of its own layout. `typescript/no-explicit-any` goes to `error`.
- **`apps/api` and `packages/core` have their hand-written shapes moved** into `*.interfaces.ts` files, and the four copies of the API tests' `Account` become one.
- **The docs are updated:** `docs/architecture.md`, two ADRs and the project context.

Out of scope:
- **Any change in behaviour or appearance.** Not a word, route or pixel changes, and the existing tests pass unchanged apart from their imports.
- **A state library.** The session and the chat stay React contexts, and server data stays in the screens that load it (see design.md).
- **Splitting the dictionary.** `uk.ts` stays one file in `shared/i18n/`.
- **Step 9 itself.**

## Capabilities

### New Capabilities
- `code-conventions`: rules every package's source keeps: shapes named in interfaces files, and no `any`.

### Modified Capabilities
- `web-shell`: the client's code is grouped by feature.

## Impact

- **`apps/web`:** every file under `src/` and `test/` moves or has its imports changed. `vite.config.ts` gains `src/**/*.spec.tsx` in `include`. `index.css` imports the feature stylesheets.
- **`apps/api` and `packages/core`:** a few interfaces move into interfaces files.
- **`packages/conventions`:** new, private, test-only. The client takes it as a dev dependency.
- **`.oxlintrc.json`:** `no-explicit-any` goes from `off` to `error`.
- **Docs:**
  - `docs/architecture.md`;
  - `docs/adr/0014-the-client-is-arranged-by-feature.md`;
  - `docs/adr/0015-shapes-are-named-in-interfaces-files.md`;
  - `openspec/config.yaml`, whose "Where code lives" paragraph allowed a type beside its service;
  - a line in `docs/roadmap.md` between steps 8 and 9.
