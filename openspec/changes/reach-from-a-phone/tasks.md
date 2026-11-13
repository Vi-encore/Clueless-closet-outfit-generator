# Tasks

## 1. Photo links through a public base

- [ ] 1.1 Claude writes "The store's public base is a setting" in `apps/api/src/config/env.spec.ts`, and "Photo links can go through a public base" against `throughPublicBase` in `apps/api/src/storage/storage.utils.spec.ts`; verify they fail
- [ ] 1.2 Add `S3_PUBLIC_URL` to `config/env.ts` and `.env.example`, add `throughPublicBase` in `storage/storage.utils.ts`, and pass both kinds of link through it in `StorageService`; verify the group's tests, `pnpm --filter @closet/api test` and `test:db` pass

## 2. The client at a relative address

- [ ] 2.1 Claude writes "The client can reach the API at a relative address" (requests and both chat scenarios, through `socketAddress`) in web tests; verify they fail
- [ ] 2.2 Accept a relative `VITE_API_URL` in `shared/config.ts`, add `socketAddress` and `SocketAddress`, and use them in `connectChat`; verify the web suite, typecheck and lint pass

## 3. The phone mode

- [ ] 3.1 Claude writes the three configuration scenarios of "One address serves the client, the API and the photos" in `apps/web/test/phone-mode.spec.ts` against `serverFor`; verify they fail
- [ ] 3.2 Add `apps/web/vite.server.ts` with `serverFor(mode)`, make `vite.config.ts` use it, add `apps/web/.env.phone` (and its exception in `.gitignore`), the `dev:phone` scripts and the `api-phone` / `web-phone` launch entries; verify the tests pass and `pnpm dev:web` still starts as before

## 4. On a phone, and the docs

- [ ] 4.1 Write the tunnel steps in `docs/poc.md` (replacing "Not yet tried"), split step 11 into its three changes in `docs/roadmap.md`, and update `openspec/config.yaml`; verify `prettier --check` and `openspec validate --all` pass
- [ ] 4.2 With `cloudflared` installed, run `api-phone`, `web-phone` and the tunnel, and with the author on a phone go through "On a phone, the application works end to end": sign in, reload, the wardrobe's photos, an item from the camera, a chat message to another device; record what happened, including anything from the step 9 checklist, in `docs/roadmap.md`

## Workflow follow-up

- Archive `reach-from-a-phone` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`.
