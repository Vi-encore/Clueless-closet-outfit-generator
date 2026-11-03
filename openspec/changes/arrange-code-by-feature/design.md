# Design

## The tree

```
apps/web/src/
  main.tsx            the Vite entry, named by index.html
  index.css           the cascade order, and nothing else
  vite-env.d.ts
  app/                app.tsx: routes and providers; the one place that knows every feature
  shared/
    api/              client.ts, api-error.ts, token-store.ts, api.interfaces.ts (Page, Person, RequestOptions)
    ui/               window, taskbar, shell, field, dialog-frame, error-dialog, confirm-dialog, not-found
    hooks/            use-close, use-form-submit, use-load, use-pages
    i18n/uk.ts
    styles/retro.css  the theme: 98.css adjustments, inputs, buttons, sheets, dialogs
    config.ts, person-name.ts
  features/
    session/          session.api.ts, context, provider, use-session, require-session, sign-in, sign-up
    wardrobe/         wardrobe.api.ts, wardrobe, new-item, item-card, item-tile, wardrobe.css
    friends/          friends.api.ts, friends, friend-wardrobe
    chat/             chat.api.ts, chat.socket.ts, context, provider, hooks, chat, conversation,
                      bubble, unread-badge, chat.css
    desktop/          desktop, desktop.css
```

Each feature has an `index.ts`, a `<feature>.interfaces.ts` and a `<feature>.spec.tsx` (two for chat if it grows). `test/` keeps only what every spec uses (MSW server, the Socket.IO test server, fixtures, `renderApp`), plus the specs about the whole client (`web-shell.spec.tsx`, `conventions.spec.ts`).

### Who may import whom

- `app` imports any feature, through its index.
- A feature imports `shared`, and another feature only through that feature's `index.ts`. Today that means three edges:
  - friends → wardrobe (`ItemTile`, `Item`);
  - chat → friends (`listBlocked`);
  - desktop → chat (the unread total, `UnreadBadge`).
- `shared` imports no feature and not `app`.

The client knows nothing about a session. This is what lets it live in `shared`: it owns the token store and the single-flight renewal, and tells whoever listens through `onSessionLost`. The session feature holds sign-in, sign-up and sign-out on top of it.

**Why `index.ts` and not deep imports:** the index is the list of what a feature promises the rest of the client. Anything left out of it can be renamed without looking elsewhere. The alternative, importing any file, makes every file public, and the folder is then only a folder.

**Why a test rather than a lint rule:** oxlint's `no-restricted-imports` can forbid paths, but not "another feature's internals from inside a feature", which depends on where the importing file is. A test that reads the imports does that in a few lines, as the dictionary test already does for Cyrillic.

## Styles stay in one layer

A feature's stylesheet sits beside it (`features/chat/chat.css`). It is **not** imported from a component. `import './chat.css'` in a `.tsx` would put its rules outside every cascade layer, and an unlayered rule beats every Tailwind utility, so a `gap-2` beside `.messages` would quietly stop working. `index.css` imports each one `layer(components)`, after `retro.css`, and the guard test checks that every `.css` file under `src/` is imported there, in that layer.

What moves out of `retro.css`:
- **to `chat.css`:** `.messages`, `.bubble`, `.badge`;
- **to `desktop.css`:** `.shortcut`;
- **to `wardrobe.css`:** `.details`, `.well`.

`.sheet`, `.person-link`, `.action` and the dialog rules are used by more than one feature, so they stay.

## Shapes are named in interfaces files

**The rule:** every interface, every type alias written out by hand, and every object type a parameter or an assertion would otherwise spell inline is declared in a `*.interfaces.ts` file and imported. Component props get a name (`WindowProps`), and so does the router state two screens read (`NamedState`).

**One exception: a type computed from a value** (`z.infer<typeof schema>`, `(typeof SLOTS)[number]`, Prisma's `GetPayload<{ include: typeof withBothPeople }>`) stays beside that value. Moving it would put a type in one file and the only thing that defines it in another. It is not written by hand, so there is nothing to keep in step. The guard tells them apart by `typeof` on the right-hand side.

**Where the files go:** one interfaces file per feature in the client, and one per module in the API, as `chat.interfaces.ts` already is. API test helpers share `test/test.interfaces.ts`. `*.d.ts` files are declarations and are left alone.

This supersedes the sentence in the project context that allowed "a type used by one service and its controller" to stay in the service.

## No `any`

`typescript/no-explicit-any` goes to `error`. Nothing in the source uses `any` today, so turning it on changes no code. The conventions test also looks for `any` in a type position, so that a `// oxlint-disable` cannot hide one.

## One guard per package

The same three checks in three places: `packages/core/src/conventions.test.ts`, `apps/api/test/conventions.spec.ts`, `apps/web/test/conventions.spec.ts`. Each reads only its own package. A shared helper would need a package of its own or a test that reaches across the repository, and both cost more than thirty repeated lines. Like the dictionary test, each first asserts that it found a file it knows exists, so a wrong path cannot pass by finding nothing.

## State: why no Redux

There are two pieces of state the whole client shares:
- **who is signed in:** `SessionProvider`, a three-state machine;
- **the chat connection:** `ChatProvider`, one socket, the unread counts, and a subscription for screens.

Both are React contexts. Everything else is server data a screen loads when it opens (`useLoad`, `usePages`, `useConversation`) and drops when it closes.

Redux, or Zustand, would add a store and actions around those two without solving a problem they have. If a later step makes several screens share cached server data, the generator reading the wardrobe for instance, the tool for that is a server-cache library (TanStack Query), not a global store. That would be its own decision then.

## Pitfalls

- **`git mv`, not delete and create,** so that `git log --follow` still finds a file's history.
- **Tests that import from `../src/...`** move with their feature, and the paths inside `vi.mock()` must change too. A mock of a path that no longer exists silently mocks nothing.
- **`vite.config.ts`'s `test.include`** must take `src/**/*.spec.{ts,tsx}`, or the moved specs stop running while the suite stays green. Compare the test count before and after: 173.
- **The dictionary test** names `i18n/uk.ts` relative to `src/`, so it changes to `shared/i18n/uk.ts`. Specs now under `src/` must hold no Cyrillic either; today none do.
- **React Fast Refresh** wants a `.tsx` file to export only components. An `index.ts` that re-exports both components and hooks is fine, because it is not itself a component module.
