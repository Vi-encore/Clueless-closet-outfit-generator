# Proposal

## Why

Step 11 puts the application on a real phone for the first time, and one of its parts is the heaviest thing the client does: background removal downloads a model of tens of megabytes and runs it in the tab. The roadmap already doubts whether an iPhone's tab holds it ([roadmap: step 11](../../../docs/roadmap.md#step-11--pwa-and-phone-test)). Today the only way to stop it is to change the code and deploy again.

A feature flag lets a deployment switch such a piece off, or hold back an unfinished one, with a setting and a restart. The author asked for flags after step 10. They come before step 11, which is the first step that needs one, and before the try-on of a later step, which will need several.

## What Changes

- **A vocabulary of flags in `@closet/core`.** Each flag has a name and a default, and both apps read the same list. The first flag is `photoCutout`, on by default.
- **The API decides each flag's value from its environment.**
  - `FEATURES_ON` and `FEATURES_OFF` hold comma-separated flag names that override the defaults.
  - An unknown name, or a name in both lists, stops the API from starting, like any other wrong setting.
  - A `FlagsService` answers for code inside the API.
- **`GET /flags`** is public and answers every flag with its value. The client needs some of them before anybody signs in.
- **The client reads the flags once per session and caches them** like other server data (ADR-0017).
  - `useFlag(name)` answers with the flag's value.
  - Until the answer arrives, or if it never does, the default from core is used.
- **`photoCutout` off** means a new item is saved with its original photograph only:
  - no model is downloaded;
  - nothing says the cut-out failed;
  - nothing offers to use it.
- **The decision is recorded** in a new MADR record, ADR-0020.

Out of scope:

- **Per-person flags,** percentage rollouts and a hosted flag service. The PoC has one deployment and spends nothing.
- **Changing a flag without a restart.**
- **The OpenFeature SDK.** It is considered in the design, and it is where this would go if flags ever needed a provider.
- **Flags for the try-on.** That arrives with the try-on itself.

## Capabilities

### New Capabilities
- `feature-flags`: the flag vocabulary, how the API decides each flag's value from its settings, and `GET /flags`.
- `web-feature-flags`: how the client reads the flags, and what it does before or without an answer.

### Modified Capabilities
- `web-wardrobe`: adds the requirement that background removal can be switched off.

## Impact

- **`packages/core`:** a new `flags/` folder with the vocabulary, exported from `index.ts`.
- **`apps/api`:**
  - `FEATURES_ON` and `FEATURES_OFF` in `config/env.ts` and `.env.example`;
  - a `flags` module with a service and a public controller;
  - the route appears in Swagger.
- **`apps/web`:**
  - a new `features/flags/` feature (api, queries, constants and `use-flag.ts`), reached through its index;
  - `wardrobe/use-photo.ts` skips the cut-out when the flag is off;
  - `photo-step.tsx` draws the original without the failure line.
- **No database change.**
- **Docs:**
  - ADR-0020;
  - `docs/architecture.md`;
  - `docs/roadmap.md`, a new entry between steps 10 and 11;
  - `openspec/config.yaml`;
  - `CLAUDE.md`.
