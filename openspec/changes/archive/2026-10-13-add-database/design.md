# Design

## Context

Step 3 of the roadmap. Motivation and scope: see proposal.md; requirements: see the delta specs. Entities: `docs/data-model.md`.

Current state and facts that shape the approach, checked October 2026:

- `apps/api` is a NestJS 12 ESM app with settings validated by a zod schema. Nothing is stored yet.
- **Prisma's `latest` tag is misleading.** `prisma` resolves `latest` to `8.0.0-rc.22`, a release candidate, while `@prisma/client` resolves `latest` to `7.10.0`. A plain `pnpm add prisma @prisma/client` installs a CLI and a client from different major versions.
- Prisma 7 is a large break from 6: the Rust-free client is the default, the `prisma-client-js` generator is replaced by `prisma-client`, the generated client no longer lands in `node_modules` and needs an explicit `output`, a **driver adapter is mandatory**, configuration moved to a TypeScript file, and `migrate dev` no longer runs `generate` for you.
- From 7.10 that config file is `prisma7.config.ts`; earlier 7.x called it `prisma.config.ts` and the CLI still accepts both.
- Docker 29.7.2 and Compose v5.5.0 are installed on this machine.

## Goals / Non-Goals

**Goals:**

- A database that survives a restart, started with one command.
- A schema where the rules that must always hold are enforced by the database, not by hope.
- The Nest building block for a shared, connection-owning resource: a provider with lifecycle hooks.

**Non-Goals:**

- HTTP routes, authentication, owner checks: steps 4 and 5.
- A repository layer or any other abstraction over Prisma. Services will use the client directly; an abstraction with one implementation hides the very thing being learnt.
- Seeding and deployment.

## Decisions

### 1. PostgreSQL in Docker Compose, not a managed database

A container keeps the PoC free and offline, and Docker Compose is one of the things this step is meant to teach. Pin the image to a major version rather than `latest`, and keep the data in a **named volume** so a restart does not empty the wardrobe.

- _Alternative - Neon:_ no card needed, and it is where the project is heading after the PoC. But it makes local work depend on the network, and a shared branch is easy to wipe by accident.

### 2. Pin Prisma to 7.10.0 everywhere

`prisma`, `@prisma/client` and `@prisma/adapter-pg` pinned to the exact same version, the way `core` pins zod. Prisma's own tooling checks that CLI and client match, and with `latest` pointing at an 8.0 release candidate an unpinned install would be a coin toss.

### 3. The `prisma-client` generator, ESM, output inside `src`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

The module format follows `tsconfig.json`, so nothing extra is needed for ESM. The import is an ordinary relative import and therefore carries the `.js` extension, like every other relative import here.

The generated client is **not committed**: it is build output, it is large, and it would turn every schema change into a reviewable diff of machine-written code. The cost is that a fresh clone cannot type-check until `prisma generate` has run, so generation has to be wired into the scripts. Choose between a `postinstall` script in `apps/api` and making `build` and `typecheck` depend on a `db:generate` script - and verify the choice actually runs under pnpm, which is strict about install scripts.

### 4. A driver adapter is not optional

Prisma 7 needs `@prisma/adapter-pg`. `PrismaPg` takes the connection string and is handed to the client:

```ts
const adapter = new PrismaPg({ connectionString });
super({ adapter });
```

### 5. Tag codes are text, not PostgreSQL enums

`slot`, `type`, `pattern` and the rest are stored as `String`, and `seasons`, `styles`, `occasions`, `avoidOccasions` as `String[]`. The vocabularies live in `@closet/core` and are already the single source of truth for validation, for the JSON Schema sent to the tagger and for the form options.

- _Alternative - PostgreSQL enums:_ the database would reject an unknown code, which sounds strictly better. But every added vocabulary value would need a migration, and the same list would exist in two places that can disagree. Validation belongs at the edge, with the zod schemas, where the error can name the field.
- `colors`, `materials`, `dollFit` and `aiSuggestion` are `Json`: structured values the database never has to query by.

### 6. Timestamps need saying twice

Prisma maps `DateTime` to `timestamp(3)` - **without** a time zone - unless told otherwise. Every timestamp column therefore carries `@db.Timestamptz(3)`. This is the kind of default that stays invisible until a user in another time zone sees yesterday's outfit under today's date.

### 7. `PrismaService` owns the connection

A provider extending `PrismaClient`, implementing `OnModuleInit` and `OnModuleDestroy`, exported from a global `PrismaModule` so later feature modules do not each have to import it. `main.ts` calls `app.enableShutdownHooks()`, without which a termination signal kills the process before `onModuleDestroy` runs.

### 8. `DATABASE_URL` is required and has no default

Added to `envSchema` as a required connection string. There is no sensible default: a wrong-but-present one would have the API quietly talk to the wrong database, which is worse than refusing to start.

### 9. Database tests are a separate script

Tests that need a running container do not belong in `pnpm test`, which has to stay runnable on a laptop with no Docker. They get their own script, their own vitest config and their own database, and they are part of this change's done-criteria.

- _Alternative - one suite that needs Docker:_ simpler to run, but it makes every unrelated test depend on a container.
- _Alternative - mocking Prisma:_ a test that proves the schema's rules has to talk to a real database. Mocking `unique` would only test the mock.

### Target structure (orientation)

```
docker-compose.yml          postgres, a named volume, a pinned image
apps/api/
  prisma7.config.ts         schema path and the connection string
  prisma/
    schema.prisma           generator, datasource, User, Item
    migrations/             generated; committed
  src/
    prisma/
      prisma.module.ts      global, exports PrismaService
      prisma.service.ts     extends PrismaClient, lifecycle hooks
    generated/prisma/       generated client; not committed
  test/
    *.db-spec.ts            the tests that need the database
```

Signatures to orient by:

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    /* build the adapter, call super */
  }
  async onModuleInit(): Promise<void> {
    /* … */
  }
  async onModuleDestroy(): Promise<void> {
    /* … */
  }
}
```

### Read first

- Prisma: [What is Prisma 7?](https://www.prisma.io/docs/orm/v7), [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Prisma schema reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference).
- NestJS: [Prisma recipe](https://docs.nestjs.com/recipes/prisma), [Lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events).
- Docker: [Compose file reference](https://docs.docker.com/reference/compose-file/), [Volumes](https://docs.docker.com/engine/storage/volumes/).

### Common pitfalls

- **`migrate dev` no longer generates the client** in Prisma 7. After a schema change, run `generate` yourself or the types keep describing the previous schema.
- **The config file is `prisma7.config.ts`** from 7.10 onwards; most tutorials still say `prisma.config.ts`.
- **The generated client is imported with a `.js` extension**, like every relative import in this repository.
- **`DateTime` is not `timestamptz`** without `@db.Timestamptz`.
- **`docker compose down -v` deletes the volume** and the data with it. Plain `down` keeps both.
- **The Prisma CLI reads the connection string itself**, from the config file and the environment - it never goes through Nest's `ConfigService`.
- **A migration that has been applied cannot be edited.** Change the schema and create another one.
- **`url` is rejected inside `datasource`** in Prisma 7. The connection string belongs to the config file, and the client gets an adapter.
- **The generated client is TypeScript source inside `src/`**, not compiled output in `node_modules`. It is therefore seen by the type checker, the linter and the formatter, and has to be excluded from the last two as well as from git.
- **`z.url()` accepts `localhost:5432`.** The URL parser reads `localhost:` as the protocol, so the setting needs an explicit protocol check to be worth anything.

## Risks / Trade-offs

- [Prisma 7 is recent, and its 8.0 release candidate already sits on `latest`] → everything pinned to 7.10.0; the upgrade is its own change, after the PoC.
- [Tests now need a container] → a separate script, and the first task makes starting the container a one-liner.
- [The generated client is missing on a fresh clone] → generation wired into the scripts and verified as part of task 1.
- [Codes stored as text let a wrong code reach the database] → validation at the edge with the core schemas, which is where a useful error message can be produced.
