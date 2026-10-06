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
- **Specs and planning:** OpenSpec (`openspec/`), one change per roadmap step; docs and specs in English.

## Open questions

- [ ] **Outfit composition in the MVP.** Top + bottom and dresses — definitely. Shoes, outerwear, accessories — right away or later?
- [x] **Card.** The PoC runs without a card ([poc.md](poc.md)). R2 / Modal come back after the PoC ([backend-options.md](backend-options.md#do-i-need-a-card)).
- [ ] **Try-on quality.** Check CatVTON on your own photos (the public Hugging Face demo); for comparison — Nano Banana in AI Studio.
- [ ] **Daily try-on limit** per user.
- [ ] **Lending.** Can you lend to anyone by username, or only to friends?
- [x] **Interface style.** Windows 98 + "Clueless" accents; comfort on a phone matters more than faithful reproduction ([ui.md](ui.md)).
- [ ] **98 or XP; which pixel font.** Decide before step 8 on the [comparison page](https://claude.ai/artifact/T4sE66Mi9oaWWaxnNZtr9Q), including on a phone. Recommendation: 98 ([ui.md](ui.md#alternatives)).
- [ ] **MATCH! / MIS-MATCH.** When to show the verdict: a threshold on the total score, or separate pairing checks?
- [ ] **Weather.** In the MVP or later?
