# 5. Identity is established per transport, and the guards do not merge

- **Status:** accepted
- **Decided in:** `add-chat`, roadmap step 6; corrected in `tidy-after-review`
- **Date:** 2026-10-26, amended 2026-11-01

## Context

An HTTP request carries its own credentials and is authenticated one request at
a time. A socket is authenticated once, when it connects, and then speaks for
as long as it stays open.

Nest runs a global `APP_GUARD` for both. `JwtAuthGuard` extends Passport's and
reads the request's `authorization` header — which a socket message does not
have. Left to try, it did not refuse the message; it threw a `TypeError` on
`undefined.authorization`, a bug wearing a refusal's clothes. The tests found
this, after the design had claimed the guard simply did not run.

## Decision

Each transport is guarded where its identity can be established.

- **HTTP:** `JwtAuthGuard` on every request, per ADR-0001.
- **Socket:** namespace middleware at the handshake. It runs before the
  connection is accepted, so `next(error)` leaves nothing to emit at — unlike
  `handleConnection`, which runs after the connection exists and so races a
  client that emits immediately. `AuthenticatedSocketGuard` sits behind it on
  the gateway class, so a handler added later is closed without being marked.

`JwtAuthGuard` states which contexts it covers: `http` as normal, `ws`
returning early with the reason written down, and anything else throwing.

**The two guards are not merged behind one interface**, which was proposed in
review. They protect at different moments, and `JwtAuthGuard` letting a socket
through is correct rather than lax — by then the connection has been
authenticated. A guard that threw there would refuse every message in the
application, and merging the two would hide the difference that matters.

## Consequences

- A socket cannot be heard before it has been identified.
- The explicit error goes where nothing was designed for it, rather than where
  the design says to pass.
- There are two places to look to know how a caller was identified. That is the
  honest number: there are two ways in.
- Rate limiting has the same shape of problem and the same answer — it skips
  non-HTTP contexts. Flooding a socket is not addressed by anything yet.
