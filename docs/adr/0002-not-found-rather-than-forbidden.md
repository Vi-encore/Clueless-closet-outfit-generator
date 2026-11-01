# 2. Somebody else's data answers "not found"

- **Status:** accepted
- **Decided in:** `add-wardrobe-items`, roadmap step 5; applied since in
  `add-friends`, `add-chat` and `add-photo-storage`
- **Date:** 2026-10-19

## Context

A request for a record belonging to somebody else can be refused two ways. 403
says "this exists and you may not have it". 404 says "there is no such thing".

403 is more informative, and that is the problem: it confirms the identifier is
real. Somebody working through identifiers learns which ones exist, which is
the first half of knowing what somebody owns.

## Decision

Anything belonging to somebody else is answered exactly as something that does
not exist. This covers an item read by a stranger, a friend's wardrobe, a
conversation's history, and a person who has blocked the caller.

The answers are identical down to the body, not only the status code, and a
test compares the two bodies rather than their statuses.

## Consequences

- Guessing at identifiers teaches nothing.
- Blocking does not announce itself: somebody who has been blocked sees what
  they would see if the account had never existed.
- Debugging is harder. A 404 now means "no such record", "not yours" or
  "blocked", and from outside they are indistinguishable — deliberately, which
  means they are indistinguishable to us as well.
