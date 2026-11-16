# Tasks

## 1. Installable: manifest, icons, service worker

- [x] 1.1 Claude writes "The client declares itself installable" and "The shell is cached and server data never is" in `apps/web/test/pwa.spec.ts` against `pwaOptions()` and `index.html`, and "Phone mode can serve a build" (the configuration scenario) in `phone-mode.spec.ts` against `previewFor`; verify they fail
- [x] 1.2 Add `vite-plugin-pwa` 2.0.0 and `workbox-window`; write `vite.pwa.ts` and `previewFor`, wire both into `vite.config.ts`; draw the icons with `scripts/draw-icons.py` into `public/`; add the tags to `index.html`; add `preview:phone` scripts and the `web-phone-preview` launch entry; verify the tests pass and `pnpm --filter @closet/web build` emits `manifest.webmanifest` and `sw.js`

## 2. The offer and the hint

- [x] 2.1 Claude writes "Where the browser offers installing, the app does too" and "An iPhone is told how to install" (all scenarios, with a fake `beforeinstallprompt`, a stubbed user agent and `matchMedia`) in `apps/web/src/features/install/install.spec.tsx`; verify they fail
- [x] 2.2 Add `features/install/` (`use-install-offer.ts`, `install.utils.ts`, `install.constants.ts`, `install.interfaces.ts`, `install-offer.tsx`, `index.ts`), the words in `uk.ts`, show `InstallOffer` on the desktop, and add the top safe-area padding in `retro.css`; verify the web suite, typecheck, lint and conventions pass

## 3. Docs and installing on phones

- [x] 3.1 Add installing through the tunnel to `docs/poc.md` (`preview:phone`, tunnel to 4173), tick what applies in the checklist in `docs/mobile.md`, update `docs/roadmap.md` and `openspec/config.yaml`; verify `openspec validate --all` passes
- [x] 3.2 Through the tunnel to the phone-mode build: install on Android with the offer and on an iPhone with the hint; check the icon, no browser bars, nothing under the notch, and staying signed in after closing and reopening; the author has a look

## Workflow follow-up

- Archive `add-pwa` when the author asks, fill the new spec's Purpose if it was not copied, commit and push `dev`.
