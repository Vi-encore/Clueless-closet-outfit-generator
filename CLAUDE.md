# Clueless Closet

A wardrobe that makes outfits, in the spirit of Cher's closet from *Clueless*: items from a photo with the background cut out, outfits scored and drawn on a 2D doll, friends and a chat. A free proof of concept: no paid service and no payment card.

## Layout

pnpm monorepo:

- `packages/core`: domain types, vocabularies, scoring and the outfit generator, pure TypeScript.
- `packages/conventions`: the code conventions as checks, and a test that runs them over every package.
- `apps/api`: NestJS 12 (ESM), Prisma 7 on PostgreSQL, Socket.IO, photos in S3-compatible storage.
- `apps/web`: React 19, Vite 8, React Router 8, TanStack Query 5, Tailwind v4 over 98.css.

Background lives in `docs/`, in English. Start with `docs/README.md` and `docs/roadmap.md`, and read `docs/adr/` before proposing something that contradicts a decision. `docs/uk/` is a frozen archive: never edit it or use it as a source. `openspec/config.yaml` holds the project's history step by step.

## Working here

- The author writes in Ukrainian. Answer in Ukrainian, addressing them as "ви". Code, docs, specs and commit messages are in English.
- Work happens on `dev`. `main` changes only through a pull request.
- Commit and push only when the author asks.
- Each roadmap step, and any change with behaviour, is an OpenSpec change: propose, then apply group by group, then archive. Tests come first in each group.
- Secrets live in `apps/api/.env`, which is ignored by git. Never ask for keys in chat, and never print them.

## Commands

| What | Command |
|---|---|
| Unit tests in every package, no containers | `pnpm test` |
| API tests that need the database and storage | `pnpm --filter @closet/api test:db` (after `docker start closet-db closet-storage`) |
| Types | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Format | `pnpm format`, or `pnpm format:check` |
| Run locally | the `api` and `web` entries in `.claude/launch.json` (ports 3000 and 5173) |
| OpenSpec | `OPENSPEC_TELEMETRY=0 pnpm exec openspec …` |

## Code rules

The `packages/conventions` test checks the first four. The linter and review cover the rest.

1. **Interfaces files.** Every interface, hand-written type alias and object type, props included, lives in a `*.interfaces.ts` file. A type computed with `typeof` stays beside its value. Shapes only tests read go in `test/test.interfaces.ts`. ([ADR-0015](docs/adr/0015-shapes-are-named-in-interfaces-files.md))
2. **No `any`.** Use `unknown` and narrow it.
3. **One thing per file.** A component, hook or class has its file to itself. Helpers go to `<folder>.utils.ts`, the constants they share to `<folder>.constants.ts`, and any other component or hook to a file of its own. ([ADR-0018](docs/adr/0018-one-thing-per-file.md))
4. **Constants apart from logic.** An exported constant never shares a file with an exported function, class or component. Every `*.queries.ts` exports functions only.
5. **The client is arranged by feature.** `features/<feature>/` is reached only through its `index.ts`. `shared/` imports no feature. `app/` holds the routes, providers and shell. Stylesheets go into the `components` layer from `index.css`. ([ADR-0014](docs/adr/0014-the-client-is-arranged-by-feature.md))
6. **Server data goes through TanStack Query.** Keys live in `<feature>.constants.ts`, and the session and the chat connection stay React contexts. ([ADR-0017](docs/adr/0017-server-data-is-cached-by-tanstack-query.md))
7. **Imports.** The web app writes no extension. The API writes `.js`. Before writing a helper in the API, check `src/pagination.ts`, `src/sorted-pair.ts` and `src/prisma/errors.ts`.
8. **Words.** Every word a person reads in the client comes from `apps/web/src/shared/i18n/uk.ts`.
