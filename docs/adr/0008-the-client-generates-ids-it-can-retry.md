# 8. A client generates the id that makes its retry safe

- **Status:** accepted
- **Decided in:** `add-chat`, roadmap step 6
- **Date:** 2026-10-26

## Context

A socket can drop between the server storing a message and the acknowledgement
reaching the sender. An honest client then resends — it has no way to know the
difference — and without an identifier of its own that resend is a second
message in somebody's conversation.

## Decision

The client generates a UUID and the server stores it as the primary key. A
resend collides on that key, and the collision is the answer rather than an
error: the stored row is read back and acknowledged as though it had just been
written. The client cannot tell the two apart, and should not have to.

The re-read is scoped to the sender and the conversation. An unscoped lookup by
identifier would hand somebody else's message to anyone who sent a guessed id,
turning a retry mechanism into a way of reading other people's conversations.

## Consequences

- Sending twice stores once, and the second answer is identical to the first.
- The identifier is no longer the database's to choose, so it cannot be
  sequential and cannot be trusted to be unique until the write is attempted.
- Every path that writes such a record needs the collision branch, and the
  branch needs the scope. The scope is the part that is easy to leave out and
  the part that matters.
