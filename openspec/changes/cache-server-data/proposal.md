# Proposal

## Why

Every screen of the client forgets what it loaded the moment a person leaves it, so going back to the wardrobe or the friends list starts from an empty window and waits for the API again. Each screen also keeps its own copy of "loading, failed, ask again" (`useLoad`, `usePages`, the numbered answers in `ChatProvider`), and a change made on one screen reaches another only because that other screen happens to load from scratch. The author decided after step 8 that this is what a cache is for, and that it lands before step 9 adds more wardrobe screens on top of the old hooks ([roadmap: between steps 8 and 9](../../../docs/roadmap.md#between-steps-8-and-9--the-code-rearranged)).

## What Changes

- Add `@tanstack/react-query` to `apps/web`, with one `QueryClient` per mounted application, created in `app/`.
- Server data the screens read goes through queries: the friends screen, the wardrobe and a friend's wardrobe (a page at a time, as infinite queries), an item's card, and the list of conversations behind the chat screen and the desktop's unread count.
- Writes go through mutations, which refresh or update every query they touch: asking, accepting, declining, withdrawing, removing, blocking and unblocking a person; adding, sharing and archiving an item; marking a conversation read.
- A screen opened again shows what it last had at once and asks the API again behind it.
- Signing out, or the session being lost, empties the cache, so the next person in the same tab never sees the last one's data.
- A failed load is not tried again on its own: the screen says so straight away, as it does today.
- `useLoad`, `usePages` and the hand-written refresh of conversations in `ChatProvider` are removed. Forms keep `useFormSubmit`.
- Not changed: the session and the chat connection stay React contexts; the messages of an open conversation stay in `useConversation`, because they arrive live over the socket and are merged by id rather than fetched. No Redux, no devtools package.

Out of scope: anything step 9 brings (the camera, the archive filter, putting an item back); keeping the cache across a reload; offline use.

## Capabilities

### New Capabilities
- `web-server-data`: how the client holds what the API answered: kept between visits and refreshed behind the screen, brought up to date after a change, forgotten when the session ends, and not retried on its own after a failure.

### Modified Capabilities
None. The friends, wardrobe and chat screens keep every requirement and scenario they have. The change sits underneath them, and their specs are the check that it changes nothing they promise.

## Impact

- `apps/web`: a new dependency, `@tanstack/react-query` 5.104.5. `app/app.tsx` provides the client. Each feature gains a `<feature>.queries.ts` with its query keys and options. The screens in `friends/`, `wardrobe/` and `chat/` switch to queries and mutations. `shared/hooks/use-load.ts` and `use-pages.ts` are deleted, along with their interfaces. `test/render-app.tsx` gets a fresh client per render through `App`.
- No change to `apps/api`, `packages/core` or any API contract.
- Docs: `docs/architecture.md` (inside the client), `docs/roadmap.md` (between steps 8 and 9), `openspec/config.yaml` (the "no data-fetching library" line), and a new ADR recording the cache and its rules.
