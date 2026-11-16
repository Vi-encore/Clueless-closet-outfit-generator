# Tasks

## 1. Sharing a link to oneself

- [x] 1.1 Claude writes "A person can share a link to themselves" (all four scenarios, stubbing `navigator.share` and `navigator.clipboard`) in `friends.spec.tsx`; verify they fail
- [x] 1.2 Add `shared/platform/platform.utils.ts` (`shareLink`) and its interfaces, `inviteLinkFor` in `friends.utils.ts`, `invite-link.tsx` on the friends screen, and the words in `uk.ts`; verify the web suite, typecheck, lint and conventions pass

## 2. The offer a link opens

- [x] 2.1 Claude writes "An invitation link offers to ask, and asks only when told" (all six scenarios, counting requests in MSW) in `friends.spec.tsx`; verify they fail
- [x] 2.2 Add `invite-offer.tsx` reading `add`, sending through a mutation that refreshes `friendKeys.all` and removes `add`, with the own-link line; show it on the friends screen; verify the web suite and checks pass

## 3. Docs and a look on phones

- [x] 3.1 Describe the invitation link in `docs/social.md`, close step 11 in `docs/roadmap.md` (what is done, and what waits for hosting), and update `openspec/config.yaml`; verify `openspec validate --all` passes
- [x] 3.2 Through the tunnel: share a link from one phone with the share sheet, open it on another device signed out, sign in, see the offer, send the request, and see it arrive live on the first phone; the author has a look

## Workflow follow-up

- Archive `add-invite-link` when the author asks, commit and push `dev`.
