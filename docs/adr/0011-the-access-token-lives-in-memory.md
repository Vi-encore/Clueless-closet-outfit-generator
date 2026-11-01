# 11. The access token lives in memory

- **Status:** accepted
- **Decided in:** `add-web-shell`, roadmap step 8
- **Date:** 2026-11-01

## Context

A browser client has to keep its access token somewhere between requests. The
refresh token is already out of reach, in an `httpOnly` cookie, so the question
is only about the short-lived one.

`localStorage` is the convenient answer: a reload keeps the session with no work
at all. It is also readable by every script that runs on the page, including
anything that arrives through a dependency, and this application holds
photographs of its users.

## Decision

The access token is a variable in `platform/token-store.ts` and is written
nowhere else. Not `localStorage`, not `sessionStorage`, which is the same exposure
with less convenience, and not a cookie a script can read. A test signs in and
then inspects the browser's storage.

Everything that follows from a reload forgetting the token is part of this
decision: the application asks the API on every start, the session has a third
state, `unknown`, until the answer arrives, and neither guard decides anything
before it does.

## Consequences

- A script that gets onto the page has to find a closure rather than read a key.
  This narrows what it can steal; it does not stop it acting while it is there.
- Every start costs a request, and each one spends the refresh route's rate limit:
  ten a minute by default. Past that, the sign-in form appears until the window
  passes, although the session is intact.
- Two tabs reloading in the same instant present the same cookie, and rotation
  lets only one of them win. The other shows the sign-in form until it reloads.
- A slow API shows an empty desktop rather than a form, because nothing can be
  decided until it answers.
- `token-store` is the seam a native shell moves, so that change stays in one
  file.
