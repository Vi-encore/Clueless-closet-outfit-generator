# 17. Server data is cached by TanStack Query

- **Status:** accepted
- **Decided in:** `cache-server-data`, between roadmap steps 8 and 9
- **Date:** 2026-11-08

## Context

Step 8 built the client with no data-fetching library. Three hand-written
mechanisms covered it:

- `useLoad` loaded one thing;
- `usePages` loaded a list a page at a time;
- `ChatProvider` numbered its answers about conversations so that an older one
  could not win.

Each dropped answers to a question nobody was asking any more. None kept anything
once its screen closed. So going back to the wardrobe or the friends list started
from an empty window, and a change reached another screen only because that screen
happened to load from scratch.

The author asked for a state library after the client was arranged by feature.
Redux was considered and left out, because almost nothing here is client state.
The session and the chat connection are already contexts, and stay so.

## Decision

The client reads what the API holds through TanStack Query 5 and changes it through
its mutations.

- **One `QueryClient` per mounted application.** `App` creates it from
  `createQueryClient()` in `shared/api/query-client.ts`, so every test starts with
  an empty cache.
- **No retries.** A 404 is an answer, and a failure is shown at once.
- **Every other setting is TanStack's default.** What is cached is stale at once:
  a screen opened again shows it and asks the API again behind it. It is dropped
  five minutes after nothing uses it, and coming back to the tab asks again.
- **Keys live in each feature's `<feature>.queries.ts`, broadest part first.** One
  prefix then refreshes everything a change touches:
  - `['items', …]` for the wardrobe;
  - `['friends', …]` for people, a friend's wardrobe included;
  - `['conversations']` for the chat list.
- **A change refreshes what it touches after the API answers.** Where the answer is
  the whole thing (an item shared, added or archived), it is written straight into
  the cache.
- **The cache is emptied when a person's session ends,** whether they signed out
  or the API ended it, so the next person in the tab starts from nothing.
- **The open conversation's messages stay outside it,** in `useConversation`.
  They arrive live and are merged by id, which a query's "ask and replace" would
  fight.

## Consequences

- **A screen opened again is there at once,** and nothing has to remember to
  load it again.
- **"What changes after X" is one table,** in the change's design: a mutation
  names prefixes rather than screens.
- **Forgetting to refresh a prefix shows stale data rather than an error.** The
  `web-server-data` scenarios exist to catch that, one per kind of change.
- **A wardrobe refetch asks again for every page it holds.** That is fine for a
  few pages. `maxPages` is the lever if it stops being fine.
- **A new runtime dependency,** for a client that had none for data.
