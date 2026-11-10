---
status: accepted
date: 2026-11-10
decision-makers: the author
consulted: Claude
---

# 20. Feature flags are a core vocabulary, switched by the deployment's settings

## Context and Problem Statement

Step 11 puts the application on a phone for the first time, and background removal
downloads a model of tens of megabytes into the tab. Whether an iPhone holds it is
an open question. Later steps bring a try-on through Modal or Gemini, with more
heavy and unfinished pieces.

Until now, the only way to turn a piece off was to change the code and deploy again.
How should a deployment switch a feature on or off, and how should both the API and
the client know which features exist?

## Decision Drivers

- No paid service and no payment card. The PoC spends nothing.
- A flag named wrongly should fail loudly, in the editor or at startup, not be
  quietly ignored.
- The client must keep working when it cannot read the flags.
- One deployment and one group of people: flags per person or per percentage would
  be machinery nobody uses.

## Considered Options

- A vocabulary in `@closet/core`, with two settings in the API (`FEATURES_ON`,
  `FEATURES_OFF`) and a public `GET /flags`.
- One environment setting per flag, such as `FEATURE_PHOTO_CUTOUT=false`.
- Vite build-time variables in the client (`VITE_FEATURE_*`).
- A hosted service such as LaunchDarkly, or the OpenFeature SDK with a provider.

## Decision Outcome

Chosen option: **"a vocabulary in core, two settings, a public route"**.

- **`FLAG_DEFAULTS` in `packages/core/src/flags/`** names every flag and its default,
  and `FlagName` is derived from it. Both apps then refuse an unknown name at compile
  time.
- **The API takes the defaults and applies its two settings,** the "on" list first and
  the "off" list after it.
  - It refuses to start on an unknown name, or on a name in both lists.
  - It answers the result at `GET /flags`, with no token needed.
- **The client reads the flags once per session** through TanStack Query (ADR-0017).
  - `useFlag(name)` answers the deployment's value, and the default until then or
    without an answer.
- **Adding a flag is one line in core.** A deployment switches it with a setting and
  a restart.

### Consequences

- Good, because a flag that does not exist cannot be named in either app, nor set in
  a deployment.
- Good, because switching `photoCutout` off needs no build: the client follows the API
  it talks to.
- Good, because the vocabulary matches OpenFeature's (a flag, a default, a provider).
  A move to its SDK would replace `FlagsService` and `useFlag`, and nothing else.
- Bad, because flags are global. Trying something on one account needs its own
  deployment.
- Bad, because a flag that defaults to on can be on for a moment before an "off"
  answer arrives. A flag that guards a whole screen has to wait for the answer
  instead.
- Bad, because changing a flag takes a restart of the API.

### Confirmation

- **Core:** `packages/core/src/flags/flags.test.ts` checks the vocabulary.
- **Settings:** `apps/api/src/config/env.spec.ts` checks the defaults, both lists, an
  unknown name and a name in both.
- **Route:** `apps/api/test/flags.e2e-spec.ts` checks the public route.
- **Client:** `apps/web/test/feature-flags.spec.tsx` and `wardrobe.spec.tsx` check the
  client's fallback and the switched-off cut-out.

## Pros and Cons of the Options

### A vocabulary in core, two settings, a public route

- Good, because one list serves the compiler, the startup check and the client's
  fallback.
- Neutral, because it is one more public route, which reveals which flags exist and
  nothing else.
- Bad, because the lists in the environment are less obvious than a setting per flag.

### One setting per flag

- Good, because each setting is self-explanatory.
- Bad, because every new flag is a new line in the schema, in `.env.example` and in
  the docs, and a flag left out of the schema is silently unset.

### Vite build-time variables

- Good, because there is no request at all.
- Bad, because switching a flag needs a new build of the client, which is what flags
  are meant to avoid.
- Bad, because the API would have no say, and it will need one for the try-on.

### A hosted service, or OpenFeature with a provider

- Good, because it supports per-person targeting, gradual rollouts and changes without
  a restart.
- Bad, because a hosted service costs money or needs an account, and the SDK is
  machinery for features this PoC does not use yet.

## More Information

- **Decided in `add-feature-flags`,** after roadmap step 10. Its `design.md` has the
  details: where each piece lives, and why `staleTime` is infinite.
- **The first flag is `photoCutout`,** an operational switch in the sense of Pete
  Hodgson's "Feature Toggles": a way to switch a heavy piece off without a release.
