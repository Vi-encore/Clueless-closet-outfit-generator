---
status: accepted
date: 2026-11-10
decision-makers: the author
consulted: Claude
---

# 19. Files are named for their kind, and imports are spelled per app

## Context and Problem Statement

ADR-0014, ADR-0015 and ADR-0018 settled where code goes: by feature, shapes in
interfaces files, one thing per file. A handful of smaller rules grew up beside them
and were followed everywhere, but they lived only in `openspec/config.yaml` and in
habit. Among them:

- which suffix a file of each kind takes;
- that a context lives apart from its provider;
- that the API writes `.js` in its imports and the client writes none.

A new file had to be named by copying a neighbour. How should a file say what kind of
thing it holds, and how should an import be spelled?

## Decision Drivers

- A person, or an agent, should know from a file's name what it holds, before
  opening it.
- Every rule should already be kept by the code, so that writing it down moves
  nothing.
- Each app has its own module resolution, and its imports have to compile under it.

## Considered Options

- Name files by suffix, with one suffix per kind, and spell imports the way each app
  resolves them.
- Name files by folder, as `api/`, `queries/` and `utils/` subfolders inside each
  feature.
- Leave it to habit and the neighbouring files.

## Decision Outcome

Chosen option: **"name files by suffix"**. It is what the code already does, it keeps
a feature in one flat folder (ADR-0014), and it is the only option where the name
alone says what the file holds.

| Kind | File |
|---|---|
| a feature's or module's calls to the API | `<feature>.api.ts` (client) |
| a feature's cache queries, functions only | `<feature>.queries.ts` (client) |
| shapes | `<module>.interfaces.ts` (ADR-0015) |
| exported constants | `<module>.constants.ts` (ADR-0018) |
| helper functions | `<module>.utils.ts` (ADR-0018) |
| a hook | `use-<name>.ts` |
| a React context, apart from its provider | `<name>.context.ts` beside `<name>.provider.tsx` |
| a component | `<name>.tsx`, named for the component in kebab case |
| a Nest class | `<name>.<kind>.ts`: `.service`, `.controller`, `.module`, `.gateway`, `.guard`, `.decorator` |
| a request's schema | `requests/<name>.request.ts` or `requests/<name>.query.ts` (API) |
| tests | `*.spec.ts(x)` in the client, `*.test.ts` in core and conventions, `*.e2e-spec.ts` and `*.db-spec.ts` in the API |

Imports:

- **`apps/api` writes `.js`** on every relative import. Its TypeScript resolves
  modules as Node does for ESM, which needs the extension of the emitted file.
- **`apps/web` writes no extension.** Vite resolves without one.
- **`packages/core` writes `.js`,** like the API, because it is built and imported by
  Node.
- **A feature is imported only through its `index.ts`** (ADR-0014). Inside a feature
  or a module, files import each other directly.

A file is named for its module, and a URL for its resource. `chat.controller.ts`
serving `/conversations` is not a mismatch.

### Consequences

- Good, because a new file's name follows from what it holds, with no neighbour to
  copy.
- Good, because the table is the whole vocabulary: a suffix not in it is a question
  for review.
- Bad, because the suffixes are long: `wardrobe.constants.ts` beside
  `wardrobe.interfaces.ts`, `wardrobe.queries.ts` and `wardrobe.utils.ts`.
- Bad, because two import spellings live in one repository, and a file moved between
  the client and core has to change its imports.

### Confirmation

- **Already checked:** `tsc` refuses a missing `.js` in the API and in core.
  `apps/web/test/conventions.spec.ts` refuses a feature reached past its index.
  `packages/conventions` keeps constants, helpers and shapes in their files.
- **Not checked:** the naming of files is left to review, since a wrong suffix still
  compiles.

## Pros and Cons of the Options

### Name files by suffix

- Good, because it is what the code already does.
- Good, because a feature stays one flat folder.
- Bad, because a big feature folder becomes a long list, and the tag form already
  needed a subfolder.

### Name files by folder

- Good, because a long feature becomes shorter lists.
- Bad, because every feature would move, for no change in what anybody can find.
- Bad, because it splits a feature's pieces by kind, which ADR-0014 rejected for the
  whole client.

### Leave it to habit

- Good, because it costs nothing.
- Bad, because it is how the rules ended up only in `config.yaml` in the first place.

## More Information

- The first record in the MADR format: see `README.md` in this folder.
- The rules were collected from `openspec/config.yaml` ("Where code lives") and from
  the tree as it stood after `one-thing-per-file`.
