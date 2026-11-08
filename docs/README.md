# Clueless Closet — documentation

> Working title. Status: **shaping the idea** (October 2026), no code yet.

A digital wardrobe and outfit generator in the spirit of Cher's computerized closet from "Clueless" (1995): you photograph your clothes, pick an occasion, and the app picks an outfit and shows it on you.

Inspired by the TikTok series "Cyberdeck outfit generator" by Tina Chi (@tinahelloworld):
https://www.tiktok.com/@tinahelloworld/video/7678571042176077087

## Where things live

| Place | What it holds |
|---|---|
| `docs/` (this folder) | Reference: idea, architecture, research, design decisions. Background for planning |
| `openspec/specs/` | The source of truth for **built** behavior: requirements and scenarios per capability. Empty until the first change is archived |
| `openspec/changes/` | Changes in progress: one per roadmap step (proposal, delta specs, design, tasks) |
| `openspec/config.yaml` | Project context and rules that guide OpenSpec artifacts |
| `docs/uk/` | The original Ukrainian docs, frozen as of 2026-10-06. Not maintained: English is the source of truth |

How a roadmap step turns into an OpenSpec change: [roadmap.md](roadmap.md#how-we-work-with-openspec).

**Language:** documentation and OpenSpec artifacts are in English. The app's UI is in Ukrainian.

## Documents

| Document | What it covers |
|---|---|
| [overview.md](overview.md) | **Start here:** the app in short — screens, features, what's in the PoC and what comes after |
| [idea.md](idea.md) | Concept, scenarios, MVP scope, ideas bank |
| [ui.md](ui.md) | Style (Windows 98 + "Clueless"), 98.css + Tailwind, fonts with Cyrillic, phone |
| [poc.md](poc.md) | Proof of concept with no spending and no card |
| [roadmap.md](roadmap.md) | Step-by-step PoC roadmap with done criteria and OpenSpec change ids |
| [openspec-guide.md](openspec-guide.md) | How we use OpenSpec: the workflow per step, commands, writing specs, pitfalls |
| [mobile.md](mobile.md) | Android + iPhone: testing, iPhone specifics, checklist |
| [social.md](social.md) | Chat, "help me pick an outfit", favorites, ratings; WebSocket / SSE / gRPC |
| [features.md](features.md) | After the PoC: pre-purchase check, travel suitcase |
| [auto-tagging.md](auto-tagging.md) | Auto-tagging via Gemini: JSON response format, flow, free tier limits |
| [architecture.md](architecture.md) | The chosen architecture: diagram, stack, key decisions |
| [adr/](adr/README.md) | Architecture decision records: one per decision that outlives the change that made it |
| [backend-options.md](backend-options.md) | Reference: AWS Free Tier, Supabase vs NestJS, why not DynamoDB, where to host |
| [data-model.md](data-model.md) | Entities, item fields, lifecycle, lending |
| [outfit-algorithm.md](outfit-algorithm.md) | How an outfit is picked |
| [try-on.md](try-on.md) | Generating "the outfit on me" images; the 2D doll and the mannequin |

## Decisions made

- **Client:** PWA (React + Vite + TS) — works on both a phone and a computer.
- **Interface:** Windows 98 with "Clueless" accents; 98.css + Tailwind CSS, own components. See [ui.md](ui.md).
- **Backend:** NestJS — for practice.
- **Database:** PostgreSQL on Neon, Prisma ORM.
- **Files:** S3-compatible storage (Cloudflare R2; the code is compatible with AWS S3).
- **Users:** many; each has their own account and wardrobe.
- **Proof of concept — no spending, no card:** locally on the PC + Neon + Backblaze B2 + a tunnel for the phone. See [poc.md](poc.md).
- **Try-on:** MVP — a 2D "paper doll" from cut-out photos; next — an open model (CatVTON) on Modal ($30 credits / month, needs a card + spending limit). Fallbacks — a local GPU or paid Gemini.
- **Auto-tagging:** Gemini free tier during development, or a local vision model.
- **Formatting and linting:** Prettier and oxlint, both configured once at the repository root - single quotes, 100-column lines, `pnpm format` and `pnpm lint`. Markdown is left out of formatting on purpose: OpenSpec parses the files under `openspec/` and depends on their exact structure.
- **Specs and planning:** OpenSpec (`openspec/`), one change per roadmap step; docs and specs in English.

## Open questions

- [x] **Outfit composition in the MVP.** All six slots from the start. Top + bottom or a dress, plus shoes, are what an outfit is built from; outerwear and accessories are optional additions the generator may offer. The vocabularies in `@closet/core` already cover every slot, so the work lands in the generator and in the doll's anchors ([outfit-algorithm.md](outfit-algorithm.md), [try-on.md](try-on.md)).
- [x] **Card.** The PoC runs without a card ([poc.md](poc.md)). R2 / Modal come back after the PoC ([backend-options.md](backend-options.md#do-i-need-a-card)).
- [ ] **A list of people.** Whether seeing other users and adding them from a list fits this application at all. Today nobody can be found except by their exact username ([data-model.md](data-model.md)), and a list would change that, along with what a repeated friend request can do. The invitation link at step 11 is meant to make it unnecessary.
- [ ] **Try-on quality.** Check CatVTON on your own photos (the public Hugging Face demo); for comparison — Nano Banana in AI Studio.
- [x] **Daily try-on limit** per user. Derived from whatever the provider's free tier gives, not picked by taste - so it is a configuration value read from the environment, never a number written into the code. The figure gets filled in once the try-on provider is chosen.
- [x] **Lending.** Friends only to begin with, and the decision stays reversible: the scope is stored as an enum field - `friends` now, `anyone` possible later - rather than a boolean, so widening it needs no change of meaning in existing rows ([social.md](social.md#what-to-lay-down-in-advance)).
- [x] **Interface style.** Windows 98 + "Clueless" accents; comfort on a phone matters more than faithful reproduction ([ui.md](ui.md)).
- [x] **98 or XP.** 98 ([ui.md](ui.md#alternatives)).
- [x] **Which pixel font.** A pair: Pixelify Sans for body text and fields, Press Start 2P for accents such as "MATCH!" and headings. The font shipped with 98.css is unusable - it has no Cyrillic letters at all. Worth a look on the [comparison page](https://claude.ai/artifact/T4sE66Mi9oaWWaxnNZtr9Q) on a phone before step 8 ([ui.md](ui.md#font-and-cyrillic)).
- [x] **MATCH! / MIS-MATCH.** Both conditions, not one: MATCH! when the total clears a threshold **and** no single component sits below its own floor; otherwise the weakest component becomes the caption under the verdict. A total alone would hide an outfit that is lovely in colour and wrong for the occasion, and the per-component `breakdown` that `scoreOutfit` already returns is what makes the verdict explainable. Thresholds get their numbers at step 10 ([outfit-algorithm.md](outfit-algorithm.md)).
- [x] **Weather.** In the MVP. The generator takes a temperature and matches it against the `warmth` tag, which `@closet/core` already has. Still to settle: the source - [Open-Meteo](https://open-meteo.com/) is the candidate, free and without an API key, which suits the no-card rule.
- [x] **One formatter and linter for the repo.** `apps/api` arrived with its own `.prettierrc` and `.oxlintrc.json` from the Nest template; `packages/core` has neither, and its quote style already drifted. Recommendation: lift both to the root - Prettier for formatting, oxlint for linting, since Nest 12 ships it and it is fast - with root `format` and `lint` scripts and single quotes everywhere. Worth its own small change rather than riding along inside a roadmap step.
