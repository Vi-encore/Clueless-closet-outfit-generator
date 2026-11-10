# Design

## Context

`packages/conventions` checks two rules today by reading source as text (ADR-0015). TypeScript 7 has no stable parser API, so comments and strings are blanked first and patterns run over what remains. Two more rules join them here. See proposal.md for why.

What a manual search found, before the checks exist:

- **`apps/api`, class files with other top-level declarations:**
  - `auth/auth.controller.ts`, `auth/auth.service.ts`, `auth/refresh-token.service.ts`;
  - `chat/chat-broadcaster.ts`, `chat/chat.service.ts`;
  - `friends/friends.service.ts`;
  - `items/items.controller.ts`;
  - `outfits/outfits.controller.ts`, `outfits/outfits.service.ts`;
  - `throttling/throttling.module.ts`;
  - `users/users.service.ts`.
- **`apps/api`, exported constants beside logic:**
  - `auth/public.decorator.ts`;
  - `throttling/password-route.decorator.ts`;
  - `docs/openapi.ts`;
  - `pagination.ts`.
- **`apps/web`, component files with more than one top-level declaration:**
  - chat: `chat/conversation.tsx`;
  - desktop: `desktop/desktop.tsx`;
  - friends: `friends/friends.tsx`;
  - outfits: `outfits/doll/doll.tsx`, `outfits/outfit-panel.tsx`, `outfits/outfits.tsx`, `outfits/saved-outfits.tsx`;
  - session: `session/require-session.tsx`, `session/sign-in.tsx`, `session/sign-up.tsx`;
  - wardrobe: `wardrobe/item-card.tsx`, `wardrobe/new-item.tsx`, `wardrobe/photo-step.tsx`, `wardrobe/tag-form.tsx`, `wardrobe/tag-lines.tsx`, `wardrobe/wardrobe.tsx`.
- **`apps/web`, hooks with helpers beside them:** `chat/use-conversation.ts` and possibly others.
- **`apps/web`, exported constants beside logic:**
  - the four `*.queries.ts` files;
  - `outfits/doll/auto-fit.ts`;
  - `wardrobe/photo/prepare.ts`.
- **`packages/core`, exported constants beside logic:**
  - `generator/generate-outfits.ts`;
  - `scoring/color.ts`, `scoring/filters.ts`;
  - `taxonomy/tag-suggestion.ts`, `taxonomy/vocabularies.ts`.

The checks written in group 1 produce the definitive list, and the groups follow it.

## Goals / Non-Goals

**Goals:**
- Two rules a text check can decide, with no list of exceptions to maintain.
- A component, hook or class file read top to bottom is that one thing.

**Non-Goals:**
- Renaming files that already hold one kind of thing.
- Tests and fixtures.
- Changing what any function does.

## Decisions

### 1. Two rules, checked separately

**`crowdedFiles(source, path)`** applies to a unit file: one that declares, at its top level, a class, a hook (`function useX` or `const useX =`) or, in a `.tsx` file, a component (a `PascalCase` function or `const`).

- It counts the top-level declarations: `function`, `async function`, `class`, `const`, `let`, `var` and `enum`, exported or not.
- More than one in a unit file is a finding, and every declaration after the first is reported.
- A decorated class counts once: decorators are not declarations.
- Imports, `export … from` and type-only lines do not count, since types already live in interfaces files.

**`exportsMixedWithConstants(source)`** applies to every file.

- **An exported constant** is `export const NAME` whose initializer is not a function.
- **Logic** is any of:
  - `export function`, `export async function` or `export default function`;
  - `export class`;
  - `export const NAME = (…) =>`, `= async (…) =>` or `= function`, with or without a type annotation on the name, and with a parameter list that may span lines.
- A file with both is a finding, and the constants are reported.

A value made by a call is a constant: `createContext`, `z.object`, `queryOptions`, `createParamDecorator`, `new Error`. The scanner cannot know what a call returns, and the rule is about where values are found.

"Top level" means column 0 of the blanked source. Prettier enforces the indentation, so a declaration inside a function is never at column 0.

### 2. Where things go

Names are per folder, like the folder's `*.interfaces.ts`:

| What | Where |
|---|---|
| a helper function | `<folder>.utils.ts`, such as `outfits/outfits.utils.ts` or `wardrobe/wardrobe.utils.ts` |
| a constant that helpers or several files share | `<folder>.constants.ts` |
| a private component | its own file, named for it: `friends/find-person.tsx`, `wardrobe/sharing-switch.tsx`, `wardrobe/tag-form/scale.tsx` |
| a private hook | its own `use-*.ts`: `friends/use-friend-action.ts` |
| a module-level variable, such as `nextRowId` in `tag-form.tsx` | the utils file of the helper that uses it, where it is private |
| the error sentinels a form throws and reads back (`NO_PHOTO`, `NO_REASON`) | `<folder>.constants.ts`, imported by the form and by the `describe…` helper in utils |

When two helpers would clash in one utils file, each is renamed for what it describes: the three `describe` functions become `describeAskFailure`, `describeArchiveFailure` and `describeNewItemFailure`.

A folder with many components, such as `wardrobe/`, may gain a subfolder for one piece. `tag-form.tsx` and its four inputs become `wardrobe/tag-form/`, with `tag-form.utils.ts` beside them. This follows ADR-0014: a folder per piece that has parts.

### 3. Queries are functions

`peopleQuery` and `conversationsQuery` become `peopleQuery()` and `conversationsQuery()`, so every `*.queries.ts` exports only functions and takes its keys from `<feature>.constants.ts`. A call to `queryOptions` per render costs nothing that matters.

### 4. Public surfaces do not change

Each feature's `index.ts` and core's `index.ts` re-export moved names from their new files. Nothing outside a module changes its imports, apart from one exception: a module that imported a constant from a service or controller now imports it from that module's constants file.

### 5. Order of the work

The checks come first. Their repository scenarios fail with a list, and each later group empties its package's part of that list. The scenario passes only at the end, so groups 2 to 6 verify by the list getting shorter, plus their own package's suite.

## Risks / Trade-offs

- **[Trade-off]** Many more files. `wardrobe/` grows by roughly ten, and some files hold a single four-line component. That is the author's call.
- **[Risk]** A text check misses an unusual spelling, such as a component returned from a factory, or an arrow in parentheses. → It covers what the codebase writes. ADR-0015 already accepts this limit.
- **[Risk]** Moving a helper changes behaviour by accident: a closure over component state, or module state read by two places. → Helpers move as they are, and `nextRowId` moves with `aRow`, its only writer. The client's 165 tests and the API's 206 database tests cover the screens and routes.
- **[Risk]** Circular imports between a component and its utils. → Utils import constants, interfaces and other utils, never components.

## Migration Plan

This changes source only. It ships with the next merge, and a rollback is a revert.
