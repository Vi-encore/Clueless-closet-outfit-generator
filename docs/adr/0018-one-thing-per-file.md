# 18. One thing per file

- **Status:** accepted
- **Decided in:** `one-thing-per-file`, after roadmap step 10
- **Date:** 2026-11-10

## Context

ADR-0015 moved every hand-written shape into interfaces files. The author keeps two
more rules of the same kind, and the code had drifted from them too:

- `outfits.service.ts` carried three helpers and three constants above its class.
- `friends.tsx` held the screen, four smaller components and a hook.
- `tag-form.tsx` mixed ten declarations, from a module-level counter to the form.
- `friends.service.ts` exported `PENDING`, `ACCEPTED` and `BLOCKED` beside its class.
- `vocabularies.ts` had a function among nineteen lists.

A reader looking for a helper or a value had to know which component or service
happened to hold it.

## Decision

- **A component, a hook or a class has its file to itself.** Nothing else is declared
  at the top of that file.
  - Helper functions go to `<folder>.utils.ts` beside it.
  - The constants they share go to `<folder>.constants.ts`.
  - Another component goes to a file named for it, and another hook to its own
    `use-*.ts`.
  - A component with parts of its own gets a folder, as the tag form did.
- **An exported constant lives in a file that exports no function, class or
  component.**
  - A value made by a call is a constant: a schema, a context, query options, an
    `Error`.
  - A `const` holding an arrow or a `function` is a function.
  - A private constant may stay inside a utils file, never beside a component, hook
    or class.
- **Queries are functions.** Every `<feature>.queries.ts` exports functions only, and
  takes its keys from `<feature>.constants.ts`.
- **Some files are exempt:** tests and their fixtures, declaration files and generated
  code.

`packages/conventions` checks both rules in every package with `crowdedFiles` and
`exportsMixedWithConstants`. They read source as text, for the reason ADR-0015 gives.

## Consequences

- **A component, service or hook reads top to bottom as that one thing,** and a
  helper or a value is found by the name of its folder.
- **There are many more files.** `wardrobe/` grew by about fifteen, and some hold one
  four-line component.
- **A file already holding one kind of thing keeps its name.** `uk.ts`, `env.ts`,
  `vocabularies.ts`, `tuning.ts`, the request schemas and the contexts were not
  renamed to `*.constants.ts`.
- **An unusual spelling can slip past the checks,** such as a component returned from
  a factory or an arrow in parentheses. The checks cover what the codebase writes,
  and review covers the rest.
