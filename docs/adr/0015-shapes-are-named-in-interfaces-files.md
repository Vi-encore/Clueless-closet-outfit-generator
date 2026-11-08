# 15. Shapes are named in interfaces files, and nothing is `any`

- **Status:** accepted
- **Decided in:** `arrange-code-by-feature`, between roadmap steps 8 and 9
- **Date:** 2026-11-03

## Context

The author keeps two rules, and the code had drifted from both. The linter had
`no-explicit-any` switched off, so nothing enforced the first. Shapes were declared
at the top of services, props were typed in place (`{ children }: { children:
ReactNode }`), router state was asserted as `{ name?: string }`, and four API test
files each wrote their own `interface Account`. The project context even allowed
"a type used by one service and its controller" to stay in the service.

## Decision

- **Every interface**, every type alias written by hand, and every object type that
  would otherwise be spelled in place (a parameter, an assertion, a type argument, a
  return type) is declared in a `*.interfaces.ts` file and imported from there.
  Component props get a name (`WindowProps`), and so does anything a test alone reads
  (`test/test.interfaces.ts`, or `src/test.interfaces.ts` in core).
- **A type computed from a value with `typeof`** stays beside that value:
  `z.infer<typeof schema>`, `(typeof SLOTS)[number]`, Prisma's
  `GetPayload<{ include: typeof rows }>`. Nothing in it is written by hand, so there
  is nothing to keep in step, and moving it would split a type from the only thing
  that defines it.
- **`any` is never written.** `typescript/no-explicit-any` is an error. A value whose
  type is not known is `unknown`, and it is narrowed before use.

`packages/conventions` holds the checks and a test that runs them over every
package's source and tests. Declaration files and generated code are left alone.

## Consequences

- A module's vocabulary is in one file, and a shape used twice is defined once. The
  four `Account`s became one.
- More files and more imports. A two-field props type now lives in another file
  from its component.
- The checks read source as text, because TypeScript 7 has no stable parser API.
  An unusual spelling can slip past them, such as an object type on a second
  parameter. The linter and review are still there.
- Typing a value as `unknown` costs a check where `any` would have cost nothing,
  which is the point.
