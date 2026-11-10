# Tasks

## 1. The vocabulary and the settings

- [x] 1.1 Claude writes the scenarios of "Flags are one vocabulary with defaults" in a core test (`packages/core/src/flags/flags.test.ts`), and of "A deployment switches flags in its settings" in `apps/api/src/config/env.spec.ts`, through `flagsFrom`; verify they fail
- [x] 1.2 Add `packages/core/src/flags/` (`flags.constants.ts` with `FLAG_DEFAULTS` and `FLAG_NAMES`, `flags.interfaces.ts`) and export it from `index.ts`; add `FEATURES_ON` and `FEATURES_OFF` to `config/env.ts` with the both-lists refusal, and to `.env.example`; verify the group's tests pass and `pnpm test` is otherwise unchanged

## 2. The route

- [x] 2.1 Claude writes "The flags can be read by anybody" in `apps/api/test/flags.e2e-spec.ts`, with `FEATURES_OFF` set for the test app; verify it fails
- [x] 2.2 Add `apps/api/src/flags/` (module, service with `all` and `isOn`, public controller) and register it in `AppModule`; verify the e2e test passes, the route appears in the OpenAPI document, and `pnpm --filter @closet/api test` passes

## 3. The client

- [ ] 3.1 Claude writes "The client follows the deployment's flags" (a small probe component rendered inside the app's providers, or the cut-out screen itself) and both scenarios of "Background removal can be switched off" in `wardrobe.spec.tsx`, with MSW answering `/flags`; give `test/server.ts` a standing answer for `/flags` with the defaults; verify the new scenarios fail and the existing ones pass
- [ ] 3.2 Add `features/flags/` (`flags.api.ts`, `flags.constants.ts`, `flags.queries.ts`, `use-flag.ts`, `index.ts`); pass `useFlag('photoCutout')` into `usePhoto`, skip the cut-out when it is off, and draw the original without the failure line in `PhotoStep`; verify the web suite, typecheck, lint and the conventions pass

## 4. Docs and a look

- [ ] 4.1 Write ADR-0020 in MADR (from `docs/adr/template.md`) and add it to the index; update `docs/architecture.md`, `docs/roadmap.md` (a "Between steps 10 and 11" entry), `openspec/config.yaml` and `CLAUDE.md`; verify `prettier --check` and `openspec validate --all` pass
- [ ] 4.2 Run the application with `FEATURES_OFF=photoCutout`, add an item in the browser and confirm that no request goes to the background model and the item has no cut-out; then run it with nothing set and confirm the cut-out is back; the author has a look

## Workflow follow-up

- Archive `add-feature-flags` when the author asks, fill each new spec's Purpose if it was not copied, commit and push `dev`.
