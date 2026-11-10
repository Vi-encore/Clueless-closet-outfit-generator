# Design

## Context

There is one deployment and one configuration: the API's environment, checked by zod in `config/env.ts` when it starts (`service-config`). The client knows nothing about the deployment apart from `VITE_API_URL`, and it reads server data through TanStack Query (ADR-0017).

Background removal runs in `wardrobe/use-photo.ts`. It calls `cutOut` from `photo/prepare.ts`, which loads `@imgly/background-removal` and its model on first use. `photo-step.tsx` already draws a photograph with no cut-out, with a line saying the cut-out failed. See proposal.md for why flags come now.

## Goals / Non-Goals

**Goals:**
- One list of flags that the API and the client read, and that TypeScript checks wherever a flag is named.
- A wrong flag setting fails at startup, like every other setting.
- A client with no answer behaves as the defaults say, not as a broken screen.

**Non-Goals:**
- Flags per person, per group or by percentage.
- Changing a flag while the API runs.
- A hosted flag service, or the OpenFeature SDK.
- Flags in the API's own behaviour today. `FlagsService` exists for the first API-side flag, and has none to answer yet.

## Decisions

### 1. The vocabulary lives in core

`packages/core/src/flags/flags.constants.ts` holds the defaults:

```ts
export const FLAG_DEFAULTS = { photoCutout: true } as const satisfies Record<string, boolean>;
```

`flags.interfaces.ts` derives the names from it (`FlagName = keyof typeof FLAG_DEFAULTS`) and the shape the API answers with (`Flags = Record<FlagName, boolean>`). Both are computed with `typeof`, so they may stay beside the value. They go in the interfaces file anyway, so that both apps import types from one place. `FLAG_NAMES` is the keys as a list, for the env schema.

*Alternative:* the names live in the API, and the client takes whatever `GET /flags` answers. The client would lose the defaults it falls back on, and `useFlag('photoCutot')` would compile.

### 2. Two lists in the environment, not one setting per flag

`FEATURES_ON` and `FEATURES_OFF` are comma-separated names. The schema:

- splits, trims and drops empty entries, as `WEB_ORIGINS` does;
- checks every entry against `FLAG_NAMES`;
- and a `superRefine` on the whole object refuses a name that appears in both lists.

The result, `flags: Flags`, is built in `FlagsService` from `FLAG_DEFAULTS`, then the "on" list, then the "off" list.

*Alternative:* one setting per flag, such as `FEATURE_PHOTO_CUTOUT=false`. It is explicit, but every new flag would mean a new line in the schema, in `.env.example` and in the docs. With two lists, adding a flag is a line in core.

*Why both lists:* a flag for unfinished work defaults to off, and a deployment that wants it needs a way to turn it on.

### 3. `GET /flags`, public, in a `flags` module

`apps/api/src/flags/` holds four files:

- `flags.module.ts`;
- `flags.service.ts`, with `all(): Flags` and `isOn(name: FlagName): boolean`;
- `flags.controller.ts`, `@Public()`, `@Get()`;
- `flags.interfaces.ts`, if anything is needed beyond core's types.

The service reads the parsed settings from `ConfigService`. The route is public because the sign-up screen, or a future landing page, may need a flag before there is a token. Nothing in a flag is secret: it says what the client may show.

*Pitfall:* the global rate limit applies to this route too. One request per session is far under it.

### 4. The client: a `flags` feature with one hook

`apps/web/src/features/flags/` holds:

- `flags.api.ts`, with `listFlags()`;
- `flags.constants.ts`, with `flagKeys`;
- `flags.queries.ts`, with `flagsQuery()`;
- `use-flag.ts`;
- `index.ts`, which exports `useFlag`.

`flagsQuery` uses `staleTime: Infinity`. Flags change only when the API restarts, so asking again on every screen would be noise, and the cache is emptied when a session ends anyway (ADR-0017). `useFlag(name)` returns `data?.[name] ?? FLAG_DEFAULTS[name]`. While the request is in flight, and after it fails, the default stands.

*Pitfall:* a flag that defaults to on and is answered off can be on for a moment at startup. For `photoCutout` that moment never matters, because the answer arrives long before somebody has picked a photograph. A future flag guarding a whole screen should wait for the answer instead, with `isPending`. That is a choice for that flag's change, not this one.

### 5. `photoCutout` off: no model, no failure line

- **`usePhoto(onColors, cutOutAllowed)`:** the new argument comes from `useFlag('photoCutout')` in `new-item.tsx`. When it is false, the photograph goes straight from `reading` to `ready` with `cutout: null`, and `cutOut` is never called. That means `@imgly/background-removal`'s model is never requested. The colours are read from the original, as they are after a failed cut-out.
- **`PhotoState`:** its `ready` step gains `cutoutSkipped: boolean`.
- **`PhotoStep`:** when the cut-out was skipped, it draws the original with no `cutFailed` line and no "use cut-out" box.

*Alternative:* hide the cut-out in `PhotoStep` and still compute it. The point of the flag is not to download the model.

### 6. ADR-0020, in MADR

The decision binds every later flag, and the try-on's first of all, so it gets a record: "Feature flags are a core vocabulary switched by the deployment's settings". It is the second record in the MADR format.

## Risks / Trade-offs

- **[Risk]** A flag named in `FEATURES_OFF` is later removed from core, and the API then refuses to start on the next deploy. → That failure is the point: a setting that does nothing should be noticed. The error names the setting and the flag.
- **[Trade-off]** Flags are global. Trying something out on one account means a separate deployment. That is acceptable for a PoC with one user group.
- **[Risk]** A flag that defaults to on shows its feature for a moment before an "off" answer arrives (decision 4). → It does not matter for `photoCutout`. Later flags choose for themselves.
- **[Trade-off]** One more public route. It reveals which flags exist, and nothing else.

## Migration Plan

No database change. A deployment that sets neither list behaves exactly as today. Rollback is a revert.

## Further reading

- OpenFeature's [concepts](https://openfeature.dev/docs/reference/intro): this design keeps its vocabulary (flag, default, provider), so a move to its SDK would replace `FlagsService` and `useFlag` and nothing else.
- Martin Fowler / Pete Hodgson, "Feature Toggles (aka Feature Flags)": kinds of toggles (release, ops, experiment, permission). `photoCutout` is an ops toggle.
