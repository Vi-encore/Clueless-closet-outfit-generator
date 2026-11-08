# Design

## Context

Today a screen loads through one of three hand-written mechanisms:

- `shared/hooks/use-load.ts`, for one thing: the friends screen and an item's card.
- `shared/hooks/use-pages.ts`, for a list read a page at a time: the wardrobe and a friend's wardrobe.
- `ChatProvider.refresh`, which numbers its answers so that an older one cannot win, for the conversations behind the chat screen and the desktop's count.

Each one drops an answer to a question that is no longer asked. None of them keeps anything once its screen unmounts, and after a change each screen asks for everything again: the friends screen says so in a comment. See proposal.md for why this changes now.

The constraints that shape the design:

- The client is arranged by feature, and one feature reaches another only through its `index.ts` (ADR-0014).
- Every hand-written shape lives in a `*.interfaces.ts` file, and nothing is `any` (ADR-0015).
- Tests render the whole `App` inside a `MemoryRouter` (`test/render-app.tsx`), and the API is MSW.

## Goals / Non-Goals

**Goals:**
- One mechanism for reading server data and one for changing it, with the rules of the cache stated once.
- Query keys shaped so that a change refreshes everything it touches with a single prefix.
- No cache state shared between tests, and none between two people in one tab.

**Non-Goals:**
- Optimistic updates. The one place that patches the cache directly does it after the API answers: sharing an item, whose answer is the whole item.
- Moving the open conversation's messages into the cache (see the decisions below).
- Persisting the cache, or any offline behaviour. That is a question for the PWA work in a later step.

## Decisions

### 1. TanStack Query 5, pinned

The library is `@tanstack/react-query@5.104.5`, pinned like every other dependency in `apps/web`. Its peer range is React `^18 || ^19`. No `@tanstack/react-query-devtools`: one more package for a view the tests and the browser already give.

*Alternatives:* SWR has a smaller API, but no mutation primitive and a weaker story for infinite lists with cursors. RTK Query brings Redux, which was ruled out in the roadmap. Keeping the hand-written hooks and adding a cache to them would mean writing invalidation and garbage collection ourselves.

### 2. One client per mounted `App`, from a shared factory

`shared/api/query-client.ts` exports `createQueryClient()`, which sets the defaults below. `App` creates its client once with `useState(createQueryClient)` and wraps everything in `QueryClientProvider`, outside `SessionProvider`, because the chat provider reads conversations through a query.

Every `renderApp` therefore gets a fresh cache, with no `afterEach` to forget, and `main.tsx` stays as it is.

*Alternative:* a module-level client imported everywhere. It is simpler, but it outlives a test the way `token-store` does, and `setup.ts` would need to clear it after each test.

### 3. Defaults: refetch on mount, no retries

These are set in `createQueryClient`:

- **`retry: false`, for queries and mutations.** TanStack's default is three retries with backoff, and that would delay "the wardrobe cannot be loaded" and an item's `NotFound` by seconds. A 404 here is an answer, not a hiccup. This keeps today's behaviour, and the spec "A failed load says so at once" holds it there.
- **`staleTime: 0`, the default.** Every screen opened again shows what is cached and asks again behind it. This is the spec's "A screen opened again shows what it last had". A longer `staleTime` would save requests, but then a friend request accepted on another device would wait to appear.
- **`gcTime`, the default of 5 minutes.** A screen left unopened for that long starts from empty again.
- **`refetchOnWindowFocus`, the default (on).** Coming back to the tab refreshes what is on screen. That is what a person waiting for an answer to a friend request wants, and it costs one request per visible query. No scenario covers it, so the tests do not depend on it.

### 4. Keys and options live in the feature, as `<feature>.queries.ts`

Each feature exports its key factory and its `queryOptions` / `infiniteQueryOptions` from one file. Screens and mutations import from there, never by spelling a key in place. Keys are arrays with the broadest part first, so that one `invalidateQueries({ queryKey: prefix })` covers everything below it.

| Feature | Key | What it is |
|---|---|---|
| wardrobe | `['items', 'list', { slot }]` | the wardrobe, an infinite query; `slot` is `undefined` for everything |
| wardrobe | `['items', id]` | one item's card |
| friends | `['friends']` | the four lists of the friends screen, loaded together as today |
| friends | `['friends', username, 'items']` | a friend's wardrobe, an infinite query |
| chat | `['conversations']` | the list of conversations, with unread counts |

What each change refreshes:

| Change | Refreshes |
|---|---|
| ask, accept, decline, withdraw, remove, block, unblock | `['friends']`, which includes every friend's wardrobe |
| add an item | `['items', 'list']` |
| share or unshare an item | `setQueryData(['items', id], answer)`, then `['items', 'list']` |
| archive an item | `['items']` |
| mark a conversation read; a message or a reconnection on the socket | `['conversations']` |

A friend's wardrobe reads items through `listFriendItems`, which `wardrobe/index.ts` already exports, and its key belongs to friends, because a relation ending is what changes it.

Signatures, for orientation:

```ts
// wardrobe/wardrobe.queries.ts
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (slot: Slot | undefined) => [...itemKeys.lists(), { slot }] as const,
  one: (id: string) => [...itemKeys.all, id] as const,
};
export function wardrobeQuery(slot: Slot | undefined) { return infiniteQueryOptions({ … }); }
export function itemQuery(id: string) { return queryOptions({ … }); }
```

`as const` and `typeof` keep these inferred, so they stay beside their values (ADR-0015). Anything written out by hand, such as a mutation's variables, goes in the feature's `*.interfaces.ts`.

### 5. Infinite queries for anything read a page at a time

Both wardrobes use `useInfiniteQuery`:

- `initialPageParam` is `undefined`.
- `getNextPageParam` returns `page.nextCursor ?? undefined`.
- The screen flattens `data.pages`.

A failed next page sets `isFetchNextPageError` and keeps the pages already shown. That is what `usePages` did by hand, and the wardrobe's specs still require it. A late answer for another slot cannot replace the current one, because it belongs to another key. This is the scenario "A late answer changes nothing", with nothing left to write for it.

*Pitfall:* a refetch of an infinite query refetches every page it holds, one after another. For a wardrobe of a few pages that is acceptable. If it stops being acceptable, `maxPages` is the lever.

### 6. Mutations where a button holds state; forms keep `useFormSubmit`

- **The friends screen.** `useAction` becomes one `useMutation` whose `mutationFn` runs the chosen call and whose `onSuccess` invalidates `['friends']`. `busy` is `isPending`, and the error dialog reads `isError`.
- **`SharingSwitch`.** It becomes a mutation that writes the answer into `['items', id]`. The card then reads the item from the query rather than copying it into local state.
- **The forms.** Adding an item, archiving, asking for a friend, signing in and signing up keep `useFormSubmit`. It owns reading the fields and describing the error, which `useMutation` does not. Their submit functions call `queryClient.invalidateQueries` after the API answers and before navigating, so that the screen they land on asks again.

*Alternative:* `useMutation` for the forms too, with `mutateAsync` inside `useFormSubmit`. That gives two pending flags for one button, and nothing a person could see.

### 7. The session ends, the cache goes

In `app/`, a small component under both providers watches who is signed in: the account id when signed in, `null` otherwise. It calls `queryClient.clear()` whenever that changes. This covers:

- signing out;
- `endSession()` after a refused renewal;
- a different person signing in without a reload between.

It lives in `app/` because it joins two concerns, and `features/session` should not have to know that a cache exists.

*Pitfall:* `clear()` runs in an effect, after the render that sees the new state. The route guards already show the sign-in form on that render, and the next person's screens mount only after they sign in, by which time the cache is empty. The scenario "The next person sees only their own" checks exactly this ordering.

### 8. Conversations become a query; the open conversation does not

`ChatProvider` reads `useQuery({ ...conversationsQuery, enabled: signedIn })`, and its `refresh` becomes `invalidateQueries(['conversations'])`. The counter that numbered answers goes, because a query already ignores an answer it has superseded. The `Chat` context keeps its shape: `conversations`, `failed`, `unreadTotal` and `refresh`. Screens that use it do not change.

`useConversation` stays as it is. Its messages are a live stream: sent, acknowledged, merged by id and caught up after a reconnection. A query's "ask and replace" would fight that. Its `listBlocked` call could read `['friends']` instead, but that is a separate tidy-up, left out.

## Risks / Trade-offs

- **[Risk]** A key spelled in place in one screen misses an invalidation, and a stale list is shown. → Keys only come from `<feature>.queries.ts`. The spec "A change shows wherever it is seen" covers each write.
- **[Risk]** Tests that counted requests can now see an extra one, from a refetch on mount or on focus. → jsdom does not focus windows, and each test has a fresh client, so only a screen opened twice in one test refetches. Those are the tests that are meant to see it.
- **[Trade-off]** The friends screen still reloads all four lists after any action. That is the rule from step 8: the API holds the rules about which list moved. A cache makes it cheaper without making it smarter.
- **[Trade-off]** A new dependency of about 13 kB gzipped, for a client that had none for data.
- **[Risk]** StrictMode mounts twice in development and could create two clients. → `useState`'s initializer keeps one per mounted `App`, and the second mount reuses it.

## Migration Plan

This is client-only, with no API or data change. It ships with the next deployment, and a rollback is reverting the commits. Nothing persists, so there is nothing to migrate.

## Further reading

- TanStack Query docs, "Important Defaults", "Query Keys", "Query Invalidation", "Infinite Queries" and "Testing": https://tanstack.com/query/v5/docs/framework/react/overview
- TkDodo, "Effective React Query Keys" and "Mastering Mutations in React Query", the reasoning behind key factories and invalidation on success.
