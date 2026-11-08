# Tasks

## 1. A cache that ends with the session

- [x] 1.1 Claude writes `apps/web/test/server-data.spec.tsx` with the requirement "Signing out forgets what was loaded" (both scenarios) and "A failed load says so at once" (both scenarios, counting requests in the MSW handlers); verify the forgetting scenarios fail or are marked as expected to fail until 1.3, and the failure scenarios pass already
- [x] 1.2 Add `@tanstack/react-query@5.104.5` to `apps/web`; add `shared/api/query-client.ts` with `createQueryClient()` (`retry: false` for queries and mutations, other defaults kept); verify `pnpm install` and `pnpm --filter @closet/web typecheck` pass
- [x] 1.3 Provide the client in `app/app.tsx` with `useState(createQueryClient)`, outside `SessionProvider`, and add the component in `app/` that calls `queryClient.clear()` when the signed-in account id changes; verify the group's tests pass and the rest of `pnpm --filter @closet/web test` is unchanged

## 2. The wardrobe through queries

- [x] 2.1 Claude adds to `server-data.spec.tsx` the scenarios "The wardrobe comes back at once", "Another slot is its own list", "A new item is in the wardrobe", "An archived item is gone from the wardrobe" and "Sharing is remembered on the card"; verify they fail where today's behaviour differs
- [x] 2.2 Write `features/wardrobe/wardrobe.queries.ts` (`itemKeys`, `wardrobeQuery(slot)`, `itemQuery(id)`); switch `Wardrobe` to `useInfiniteQuery` and `ItemCard` to `useQuery`, with the card reading the item from the query instead of local state; verify `wardrobe.spec.tsx` passes unchanged, and that "The next person sees only their own" fails with the cleanup in `ForgetBetweenPeople` taken out (nothing read the cache when group 1 wrote it, so this is its first real check)
- [x] 2.3 Make sharing a mutation that writes its answer into `itemKeys.one(id)` and refreshes `itemKeys.lists()`; refresh `itemKeys.lists()` after adding an item, and after archiving filter the item out of the cached lists and refresh them; verify the group's scenarios and `wardrobe.spec.tsx` pass

## 3. Friends and conversations through queries

- [x] 3.1 Claude adds to `server-data.spec.tsx` the scenarios "A newer answer replaces it" and "Reading a conversation clears its count"; verify the first fails today
- [x] 3.2 Write `features/friends/friends.queries.ts` (`friendKeys`, `peopleQuery`, `friendWardrobeQuery(username)`); switch `Friends` to `useQuery`, turn `useAction` into a mutation that refreshes `friendKeys.all`, and refresh it after asking for somebody; switch `FriendWardrobe` to `useInfiniteQuery`; verify `friends.spec.tsx` passes unchanged
- [x] 3.3 Write `features/chat/chat.queries.ts` (`conversationKeys`, `conversationsQuery`); in `ChatProvider` read conversations with `useQuery` enabled while signed in, make `refresh` an invalidation and drop the numbered answers, keeping the `Chat` context's shape; verify `chat.spec.tsx` and the group's scenarios pass

## 4. The old hooks go, and the docs say so

- [x] 4.1 Delete `shared/hooks/use-load.ts` and `use-pages.ts` and their types in `hooks.interfaces.ts`; verify nothing imports them, and that `pnpm --filter @closet/web typecheck`, `pnpm lint` and `pnpm test` pass, conventions included
- [x] 4.2 Write ADR-0017 (server data is cached by TanStack Query: one client per application, keys per feature, refresh on mount, no retries, emptied when the session ends) and add it to `docs/adr/README.md`; update `docs/architecture.md` (inside the client), `docs/roadmap.md` (between steps 8 and 9: done, step 9 next) and `openspec/config.yaml` (replace "No data-fetching library…"); verify `openspec validate --all` passes
- [x] 4.3 Run the application and check it in the browser with two accounts: the wardrobe and the friends screen come back at once when reopened, a change shows after going back, and signing out then in as the other account shows nothing of the first; the author has a look before the change is closed

## Workflow follow-up

- Archive `cache-server-data` once the author has looked at it, fill the new spec's Purpose if it was not copied, commit and push `dev`.
