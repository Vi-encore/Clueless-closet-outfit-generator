# 6. Tests come in two tiers, and most need no container

- **Status:** accepted
- **Decided in:** `add-database`, roadmap step 3; extended in `add-chat` and
  `add-photo-storage`
- **Date:** 2026-10-13

## Context

A suite that needs Docker is a suite that does not run on a tired evening, on a
machine where the daemon is off, or anywhere a container is awkward. A suite
that needs nothing cannot prove a query is correct.

## Decision

Two commands.

- `pnpm test` runs without any container. HTTP suites replace `PrismaService`
  with a stand-in that opens nothing.
- `pnpm --filter @closet/api test:db` runs the `*.db-spec.ts` suites against
  real PostgreSQL and a real object store, both in `docker-compose.yml`. It
  migrates the test database before it runs, which is part of the command and
  not a thing to remember.

The split is by what a suite needs running, not by whether it speaks HTTP: the
database suites go through the routes like any other end-to-end test.

Socket suites need a third application factory, because a client cannot connect
to the in-memory handler the other two hand to `supertest`; it listens on port
0 and reports the port it was given.

## Consequences

- Most of the suite runs anywhere, in seconds.
- A test replacing Prisma proves the route and not the query, so anything about
  data belongs in the other tier.
- Running `vitest` directly against a database suite skips the migration step
  and fails in ways that look like broken code. It has already happened once.
- Where a mock is right depends on what is being proved. Storage is tested
  against a real object store because a presigned URL is only interesting if
  something checks the signature — see ADR-0007.
