# 7. Files go straight to object storage

- **Status:** accepted
- **Decided in:** `add-photo-storage`, roadmap step 7
- **Date:** 2026-10-26

## Context

A wardrobe is photographs. Sending them through the API costs its bandwidth
twice — once up, once down — and on a free tier that is the first thing to run
out.

## Decision

The API never carries a file. It signs URLs and the client uses them: a
presigned `PUT` to upload, a short-lived presigned `GET` to read.

Three things follow:

- **The key names its owner** — `items/<ownerId>/<uuid>.<ext>`. The upload URL
  is issued before the item exists, so the key travels through the client and
  comes back on the request that creates it, where it could be anything. The
  uuid makes a key unguessable; the owner segment makes a captured one
  unusable.
- **The view link is a field of the item, not a route.** `<img src>` sends no
  `Authorization` header, and the alternatives put a token in a cookie or a
  query string. Attaching the link where items are already returned also means
  the rule about who may see one is not written twice.
- **The store is reached through settings**, so the same code talks to a local
  object store and to Backblaze B2.

Tests run against a local store rather than a mock, because what is worth
proving — that a signed URL accepts a request carrying no credentials, and that
an unsigned one is refused — can only be shown by something that checks
signatures.

## Consequences

- A wardrobe's images never touch the API's bandwidth.
- A leaked link expires in minutes, which is what makes it safe to put one on
  every item in a list.
- The bucket must allow the browser's origin, and nothing in the test suite can
  catch its absence: `fetch` from Node has no CORS at all.
- The application must never create its own bucket. A key scoped to one bucket
  has no right to, so one that did would work on a laptop and fail on its first
  deployment.
