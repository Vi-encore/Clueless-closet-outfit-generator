# Proposal

## Why

Step 3 of the roadmap (`docs/roadmap.md`). Everything the API does today is computed and thrown away: `POST /outfits/score` answers from the request body alone. A wardrobe is the opposite of stateless — an item photographed once has to still be there next week — so the project needs a database before any feature can be more than a demo.

The entities come from `docs/data-model.md`. Only `User` and `Item` are modelled now; the rest of that document describes later steps and would be schema written years before its first reader.

## What Changes

- PostgreSQL in Docker Compose for local work, with the data kept in a named volume so a restart does not empty the wardrobe.
- Prisma as the ORM: schema, the first migration, and a generated client that the API imports.
- `User` and `Item` tables following `docs/data-model.md`: UUID ids, `timestamptz` timestamps, a unique `username`, and items that default to `private`.
- Tag codes are stored as text and text arrays rather than as PostgreSQL enums, so `@closet/core` stays the only place a vocabulary is defined.
- `PrismaService`: a Nest provider that owns the connection and closes it when the application shuts down.
- Settings gain a required `DATABASE_URL`, so a missing or malformed connection string stops startup like any other bad setting.
- Items are archived rather than deleted, so outfit history and statistics survive.

Out of scope (later steps):
- Authentication and password hashing → step 4 (`add-auth`); `User.passwordHash` exists as a column but nothing writes it yet.
- Item CRUD endpoints and owner checks → step 5 (`add-wardrobe-items`). This change adds no HTTP routes.
- The remaining entities from `docs/data-model.md` — outfits, wear logs, loans, friendships, body profiles, try-on jobs → the steps that use them.
- Seeding, deployment and a managed database → after the PoC.

## Capabilities

### New Capabilities
- `data-persistence`: storing wardrobe data durably, with the rules the schema itself enforces.

### Modified Capabilities
- `service-config`: adds the database connection string to the validated settings.

## Impact

- New: `docker-compose.yml` at the repository root; `apps/api` gains `prisma`, `@prisma/client` and `@prisma/adapter-pg`, a `prisma/` directory and a generated client.
- `apps/api`: `main.ts` enables shutdown hooks so the connection closes on a termination signal.
- Database tests need a running container, so they are a separate script rather than part of `pnpm test`.
- Requires step 2 (`add-api-skeleton`), done and archived.
