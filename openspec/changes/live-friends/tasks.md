# Tasks

## 1. The API announces

- [x] 1.1 Claude writes the five scenarios of "A change to a relation is announced to the people it changes" in `apps/api/test/friends-live.db-spec.ts`, with two real socket clients on `createSocketApp`; verify they fail
- [x] 1.2 Add `realtime/` (module, `RealtimeService`, `userRoom` moved from chat), make `ChatGateway` attach to it and `ChatBroadcaster` use it, import `RealtimeModule` in chat and friends, and announce from `FriendsService` per the table in design.md; verify the group's tests, the rest of `test:db`, `pnpm --filter @closet/api test` and the conventions pass

## 2. The client follows

- [x] 2.1 Claude writes "Friends are kept up to date while the app is open" (both scenarios, with the test socket server emitting `friends:changed`) in `friends.spec.tsx`; verify they fail
- [x] 2.2 Hear `friends:changed` in `chat.socket.ts` and `ChatProvider`, refresh `friendKeys.all` and `conversationKeys.all`, and refresh people on reconnect; export `friendKeys` from the friends index for it; verify the web suite passes

## 3. The count on the desktop

- [x] 3.1 Claude writes "The desktop counts the requests waiting" (both scenarios) in `friends.spec.tsx`, and moves the wardrobe button's test under "A friend's wardrobe can be read" as its scenario (already there); verify the new scenarios fail
- [x] 3.2 Move `UnreadBadge` to `shared/ui/count-badge.tsx` as `CountBadge`, add `waitingRequestsQuery`, `useWaitingRequestCount` and the "Запитів" label, and show the count on the friends shortcut; verify the web suite, typecheck, lint and conventions pass

## 4. Docs and a look

- [ ] 4.1 Describe `friends:changed` and who receives it in `docs/social.md`, and update `openspec/config.yaml`; verify `openspec validate --all` passes
- [ ] 4.2 On two devices (or two browsers), one sends a request and the other accepts it, while both keep the friends screen open: both update without reloading, and the desktop's count rises and falls; the author has a look on a phone through the tunnel

## Workflow follow-up

- Archive `live-friends` when the author asks, commit and push `dev`.
