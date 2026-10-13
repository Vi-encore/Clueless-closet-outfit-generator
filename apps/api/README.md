# @closet/api

The HTTP API of Clueless Closet: a NestJS 12 application running as ES modules.

## Routes

| Method | Path | Answers |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok" }` |

## Running it

From the repository root:

```bash
pnpm dev:api
```

That builds `@closet/core` first, then starts Nest in watch mode on port 3000.
`core` is consumed as compiled JavaScript from its `dist/`, so it has to be built
before the API starts - which is exactly what the script does.

## Tests

```bash
pnpm --filter @closet/api test
```

Unit specs are `src/**/*.spec.ts`; end-to-end specs live in `test/` and run against
a real Nest application built from `AppModule`. Names follow the specs: `describe` is
the requirement, `it` is the scenario.

## Where the rules live

Validation and scoring rules come from `@closet/core`, never from this package - the
API only translates HTTP. Built behavior is written down in `openspec/specs/`;
background and decisions are in `docs/README.md`.
