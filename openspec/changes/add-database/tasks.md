# Tasks

## 1. The database container

- [ ] 1.1 Add `docker-compose.yml` with a pinned PostgreSQL image, a named volume and the `closet` and `closet_test` databases; verify `docker compose up -d` starts it, `SELECT 1` answers, and the data survives `docker compose down` followed by `up`

## 2. Prisma installed and generating

- [ ] 2.1 Add `prisma`, `@prisma/client` and `@prisma/adapter-pg` pinned to 7.10.0, plus `prisma7.config.ts` and a `schema.prisma` holding only the generator and the datasource; ignore the generated client in git and wire `prisma generate` into the scripts; verify that after deleting the generated folder, `pnpm typecheck` passes without running generate by hand

## 3. Settings gain the database URL (`service-config`)

- [ ] 3.1 Claude writes the tests "Database connection string missing" and "Database connection string malformed"
- [ ] 3.2 Add `DATABASE_URL` to `envSchema` as a required connection string and to `.env.example`; verify the 3.1 tests pass, the existing configuration tests stay green, and `pnpm dev:api` still starts

## 4. The schema and the first migration (`data-persistence`)

- [ ] 4.1 Claude writes the database tests for the schema scenarios - "Identifier assigned on insert", "Username taken", "Email taken", "Minimal item stored", "Owner does not exist", "Visibility not given", "Item archived", "Creation time recorded" - with their own vitest config, a `test:db` script and a setup that works against `closet_test`
- [ ] 4.2 Model `User` and `Item` in `schema.prisma` following `docs/data-model.md`: UUID ids, `@db.Timestamptz` timestamps, unique `username` and `email`, `visibility` defaulting to `private`, tag codes as text and text arrays, structured tags as `Json`, and the archive fields
- [ ] 4.3 Create and apply the first migration and generate the client; verify the 4.1 tests pass, the tables are visible in Prisma Studio, and the migration SQL really says `timestamptz` and creates the unique indexes

## 5. PrismaService (`data-persistence`)

- [ ] 5.1 Claude writes the tests "Connected after startup" and "Closed on shutdown"
- [ ] 5.2 Add `PrismaService` with the driver adapter and the lifecycle hooks, a global `PrismaModule`, and `app.enableShutdownHooks()` in `main.ts`; verify the 5.1 tests pass and the connection is really closed after a termination signal

## 6. Integration check

- [ ] 6.1 With the container running, run `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and the database suite; verify all are green and every scenario of this change has a test with its name

## Workflow follow-up

- Say "перевір" after each group; tasks get ticked once they pass review.
- When every condition in `docs/roadmap.md` holds, Claude archives the change, commits and pushes to `dev`.
