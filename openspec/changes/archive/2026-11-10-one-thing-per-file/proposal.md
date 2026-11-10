# Proposal

## Why

The author wants each file to hold one kind of thing, and the code does not do that yet:

- `outfits.service.ts` carries three helper functions and three constants above its class.
- `friends.tsx` holds the screen, four smaller components and a hook.
- `tag-form.tsx` mixes ten declarations, from a module-level counter to the form itself.
- `friends.service.ts` exports `PENDING`, `ACCEPTED` and `BLOCKED` beside its class.
- Each feature's `*.queries.ts` mixes its cache keys with its query functions.

A reader looking for a helper or a value has to read the component that happens to hold it. The author asked for this to change before more code copies the habit. It lands between steps, as `arrange-code-by-feature` did, and the rules become checks, as ADR-0015's did.

## What Changes

- **A component, hook or class has its file to itself.** One component per file, the small private ones too. One hook per file, as `use-*.ts`. One class per file. Nothing else is declared at the top of such a file: no helper function, no constant, no second component.
- **Helper functions go to `<module>.utils.ts`** beside the module, one per folder.
  - The constants they share go to `<module>.constants.ts`.
  - A private hook goes to its own `use-*.ts`.
  - A private component goes to its own file, named for it.
- **Exported constants live apart from logic.** A file that exports a constant exports no function, class or component. A value made by a call (a schema, a context, query options, an `Error`) is a constant. A `const` whose value is a function is a function. A private constant may stay inside a utils file, never in a component, hook or class file.
- **Queries are functions.** Every `*.queries.ts` exports only functions. `peopleQuery` and `conversationsQuery` become functions, and every feature's cache keys move to `<feature>.constants.ts`.
- **Both rules are checked in every package** by `packages/conventions`.
- **Scope:** about 11 files in `apps/api`, 16 component and hook files in `apps/web` plus its query and photo modules, and five modules in `packages/core`.
- **Exempt:** tests and their fixtures (`test/`, `*.spec.*`, `*.db-spec.*`, `*.test.*`, `test-fixtures.ts`), declaration files and generated code. Entry files such as `main.ts`, which hold no component or class, are not touched either.
- **No behaviour changes.** Code moves, and names change only where two helpers would otherwise clash in one utils file. Every test passes unchanged apart from its imports.

Out of scope: renaming files that already hold one kind of thing, such as `uk.ts`, `env.ts`, `vocabularies.ts`, `tuning.ts`, the request schemas and the contexts.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `code-conventions`: adds two requirements. A component, hook or class has its file to itself, and exported constants live apart from logic.

## Impact

- **Code:**
  - `packages/conventions` gains two checks, with scenarios running them over every package.
  - Across `apps/api`, `apps/web` and `packages/core`, files are split into components, hooks, classes, `*.utils.ts` and `*.constants.ts`, and their imports follow.
  - Every feature's `index.ts` and core's `index.ts` keep exporting the same names.
- **No change to any API contract, schema or screen.**
- **Docs:** a new ADR-0018, the code conventions in `docs/architecture.md`, and "Where code lives" in `openspec/config.yaml`.
