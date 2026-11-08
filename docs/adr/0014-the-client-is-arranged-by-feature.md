# 14. The client is arranged by feature

- **Status:** accepted
- **Decided in:** `arrange-code-by-feature`, between roadmap steps 8 and 9
- **Date:** 2026-11-03

## Context

`apps/web` grew one screen at a time under two rules at once: folders by layer
(`api/`, `screens/`, `shell/`, `platform/`) and folders by feature (`chat/`,
`session/`). One feature was spread over up to five folders. The chat lived in
`api/chat.ts`, `chat/`, `platform/chat-socket.ts` and two files in `screens/`,
and its styles sat in a stylesheet every screen shared. The API never had this
problem, because Nest modules already group by feature.

## Decision

`apps/web/src` has three parts:

- **`features/<feature>/`** holds everything one feature is: its API calls, interfaces,
  hooks, screens, stylesheet and specs. Today the features are session, wardrobe,
  friends, chat and desktop.
- **`shared/`** holds what several features use: the API client and token store, the
  window frame and dialogs, the loading hooks, the dictionary and the theme. It
  imports no feature.
- **`app/`** holds the routes, the providers and the shell around every screen. It is
  the one place that knows every feature.

A feature is reached from outside only through its `index.ts`. A feature's
stylesheet sits beside it but is imported by `index.css` into the `components`
cascade layer, never by a component.

`apps/web/test/conventions.spec.ts` checks all three rules.

## Consequences

- A feature can be read, changed or removed in one folder, and its index lists
  what the rest of the client depends on.
- What two features share has to be decided: it moves to `shared/` or is exported
  from one feature's index. Today there are three such edges: friends uses
  wardrobe, chat uses friends, and the desktop uses chat.
- The taskbar lives in `app/`, not `shared/`, because it signs out and so needs a
  feature.
- An index cannot export a type and a component under one name. Where those
  collide, as the chat's `Conversation` screen and `Conversation` shape do, a
  caller outside the feature imports the type from its interfaces file. Today only
  the test fixtures do that.
- A stylesheet imported from a component would put its rules outside every layer,
  where they beat every Tailwind utility. The test checks for this, because
  nothing else would notice until a screen looked wrong.
