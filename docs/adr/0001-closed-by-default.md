# 1. Everything is closed by default

- **Status:** accepted
- **Decided in:** `add-auth`, roadmap step 4
- **Date:** 2026-10-13

## Context

A guard can be opt-in — written on each route that needs protecting — or
opt-out, applied everywhere and lifted where it is not wanted. The two differ
only in what happens when somebody forgets.

This application holds wardrobes, friendships and private conversations. A
forgotten decorator in the opt-in arrangement publishes one of those, and
nothing fails: the tests pass, the route works, and the mistake is visible only
to whoever goes looking.

## Decision

A global `APP_GUARD` protects every route. `@Public()` opens the few that must
be open — signing up, signing in, refreshing a token, the health check.

The same decorator also lifts the padlock in the API documentation, so the two
cannot disagree about which routes are open.

## Consequences

- A route added without a thought is protected. The mistake that remains —
  forgetting to open a genuinely public route — fails loudly on the first
  request, which is the kind of failure worth having.
- Anything that is not an HTTP route needs its own answer. A gateway's messages
  are not covered by this guard; see ADR-0005.
- `@Public()` is the one thing a reader must look for to know whether a route
  is protected, and it is absent on most of them, which reads as silence rather
  than as a statement.
