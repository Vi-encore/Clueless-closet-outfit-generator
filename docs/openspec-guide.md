# OpenSpec guide (for this project)

How we use [OpenSpec](https://github.com/Fission-AI/OpenSpec) 1.14 to plan the roadmap steps. Official docs: [getting started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md), [concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md), [CLI](https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md).

## In one minute

- **Specs** describe what the app **already does** — one folder per capability in `openspec/specs/`.
- **A change** is a proposal for what comes next — one folder per change in `openspec/changes/`. In this project **one roadmap step = one change**.
- A change holds **delta specs**: only what gets added, modified or removed.
- When a change is finished, **archiving** merges its deltas into `openspec/specs/` and moves the change folder into the archive.

```
"крок N" ──► proposal ──► specs ──► design ──► tasks ──► you implement ──► "перевір" ──► archive
               why          what       how       steps        code           review       specs updated
```

Nothing is locked: any artifact can be edited at any time.

## Concepts

| Term | Meaning | Here |
|---|---|---|
| Capability | One durable area of behavior, named as a noun | `wardrobe-taxonomy`, `outfit-scoring` |
| Spec | The current requirements and scenarios of one capability | `openspec/specs/<capability>/spec.md` |
| Change | A unit of planned work, named verb-first | `add-core-domain` |
| Proposal | Why the change exists, what changes, what's out of scope | `proposal.md` |
| Delta spec | Requirements this change adds / modifies / removes | `specs/<capability>/spec.md` inside the change |
| Design | How to build it; in this project — the step's learning pointers | `design.md` |
| Tasks | A checklist; each task says how to verify it | `tasks.md` |
| Archive | Merges deltas into the main specs, moves the change to `changes/archive/` | `/opsx:archive` |
| Config | Project context and rules injected into every artifact | `openspec/config.yaml` |

## Where things live

```
openspec/
  config.yaml                    context + rules (learning mode, languages, stack, budget)
  specs/                         built behavior — empty until the first archive
    <capability>/spec.md
  changes/
    add-core-domain/             step 1
      .openspec.yaml             metadata (schema, created date, skip_specs)
      proposal.md
      design.md
      tasks.md
      specs/
        wardrobe-taxonomy/spec.md
        outfit-scoring/spec.md
    archive/                     finished changes, date-prefixed
.claude/
  commands/opsx/                 the /opsx:* slash commands
  skills/openspec-*/             the skills behind them
docs/                            background reference (not specs)
```

## How it works under the hood

OpenSpec is not an AI and not a service. It has three parts, and the writing is always done by the AI agent (Claude):

| Part | What it is | Where |
|---|---|---|
| **Format** | Folders and Markdown with fixed headings (`## ADDED Requirements`, `### Requirement:`, `#### Scenario:`) and keywords (SHALL, WHEN / THEN) | `openspec/` |
| **CLI** | A plain Node program, no AI: scaffolds, serves templates, validates, counts progress, merges specs | `openspec` (global install) |
| **Agent instructions** | Plain text telling the agent which commands to run and which files to write | `.claude/commands/opsx/`, `.claude/skills/openspec-*/` |

What happens on `/opsx:propose` ("крок N"):

```
Claude Code loads the openspec-propose skill
  ├─► openspec new change <id>              CLI creates the change folder
  ├─► openspec status --json                CLI lists the artifacts and their order:
  │                                         proposal → specs + design → tasks
  └─► for each artifact:
        openspec instructions <artifact> --json
                                            CLI returns the template, guidance,
                                            and `context` + `rules` from config.yaml
        Claude reads docs/ and writes the file from the template
```

This is how `config.yaml` steers the plans: its rules are injected into every instruction. They're prompt-level rules, not checks in code.

What the CLI does by itself:
- **`validate`** parses the Markdown: every requirement has SHALL / MUST and at least one scenario, Purpose is long enough, descriptions aren't too long. It checks form, not meaning.
- **`list`** counts `- [x]` in `tasks.md`.
- **`archive`** merges deltas into the main specs: `ADDED` appends requirements, `MODIFIED` replaces the block with the same header, `REMOVED` deletes, `RENAMED` renames; a new spec gets the delta's Purpose. Then it moves the change to `changes/archive/<date>-<id>/`. It also warns when a change has more than 10 deltas.

What OpenSpec doesn't do: write code, run tests, or check that the code matches the specs. That link is ours — tests named after scenarios, and the "перевір" review.

## Setup and housekeeping

| What | How |
|---|---|
| Check the CLI | `openspec --version` (installed globally, 1.14.1) |
| Turn telemetry off for good | `openspec config set telemetry.enabled false` |
| Upgrade | `npm install -g @fission-ai/openspec@latest`, then `openspec update` in the project root to regenerate `.claude/` files |
| Slash commands don't show up | Start a new Claude Code session; check that `.claude/commands/opsx/` exists |

Don't mix up the two "updates": the CLI command `openspec update` refreshes generated files after an upgrade, while the slash command `/opsx:update` revises a change's artifacts.

## The workflow for one roadmap step

Example: step 1, change `add-core-domain` (already proposed).

### 1. Think it through (optional)
`/opsx:explore` — a conversation about options and open questions. It doesn't create a change by itself. Useful when a step has real choices (e.g. step 4: own auth or Better Auth).

### 2. Create the change
Say **"крок N"** (or `/opsx:propose <change-id>`). Claude takes the step from [roadmap.md](roadmap.md) and the relevant `docs/`, and writes all four artifacts.

### 3. Read and adjust the plan
Read the artifacts **in this order** and check:

| Artifact | What to check |
|---|---|
| `proposal.md` | Is "Out of scope" right? Nothing from later steps sneaked in? |
| `specs/…/spec.md` | Do you agree with every rule? Is each scenario something you could write a test for? |
| `design.md` | Are the decisions clear? Anything to read up on first? |
| `tasks.md` | Is each task small (one evening) and does it say how to check it? |

Edit any file by hand, or ask `/opsx:update` to revise the change so the artifacts stay consistent with each other. Then validate:

```bash
openspec validate add-core-domain --strict
```

### 4. Implement
- Go through `tasks.md` top to bottom, one task at a time.
- **Scenarios become tests.** Name tests after them, so you can see which scenario each test covers:
  - `describe` → the requirement name, e.g. "Type belongs to its slot";
  - `it` → the scenario name, e.g. "Type from another slot".
- Stuck → **"підказка"** (three levels: direction → more specific → a code fragment).

### 5. Review
Say **"перевір"**. Claude reviews your files against the task and its scenarios. Tasks that pass get ticked: `- [ ]` → `- [x]` (you can tick them yourself too). Progress:

```bash
openspec list
```

### 6. When the plan changes mid-way
- Found a better approach → update `design.md`.
- **Behavior changes → update the delta spec first**, then the code. The specs are the contract; the code follows them.
- New work that doesn't fit the step → a separate change, not a bigger task list.

### 7. Finish
When all tasks are ticked and tests are green:
1. `openspec validate <change-id> --strict`
2. `/opsx:archive` (or `openspec archive <change-id>`). It warns if tasks are unfinished.
3. Result: the deltas are merged into `openspec/specs/<capability>/spec.md`, and the change moves to `openspec/changes/archive/` with a date prefix.
4. Commit the archive together with the step's last code.

### Don't use `/opsx:apply` for normal work
It implements tasks by **writing code**. In this project that's the same as "покажи рішення"; it asks which tasks to solve first (see `operations.apply` in `openspec/config.yaml`).

## Command cheat sheet

### Slash commands (in Claude Code)

| Command | What it does | When |
|---|---|---|
| `/opsx:explore` | A thinking partner; writes no change | Before a step with open choices |
| `/opsx:propose` | Creates a change with all artifacts | Starting a step ("крок N" does the same) |
| `/opsx:update` | Revises an existing change's artifacts and keeps them consistent | The plan changed |
| `/opsx:sync` | Merges delta specs into main specs **without** archiving | Rarely: another change needs the new specs before this one is finished |
| `/opsx:archive` | Merges deltas and archives the change | A step is done |
| `/opsx:apply` | Implements tasks by writing code | Only when you want a ready solution |

### CLI (in a terminal)

| Command | What it shows / does |
|---|---|
| `openspec list` | Changes in progress with task progress |
| `openspec list --specs` | Capabilities that already have specs |
| `openspec view` | An interactive dashboard of specs and changes |
| `openspec show add-core-domain` | One change in full |
| `openspec show add-core-domain --deltas-only` | Only its delta specs |
| `openspec show wardrobe-taxonomy --type spec` | One main spec (after archiving) |
| `openspec status --change add-core-domain` | Which artifacts exist |
| `openspec validate add-core-domain --strict` | Checks one change |
| `openspec validate --all --strict` | Checks everything |
| `openspec archive add-core-domain` | Archives from the terminal |
| `openspec new change <change-id>` | An empty change folder (the propose command does this for you) |

Tip: set `OPENSPEC_TELEMETRY=0` in your shell profile if you don't want to change the global config.

## Writing specs: cheat sheet

```markdown
# Spec Delta

## Purpose
One or two sentences (50+ characters) — only for a NEW capability.

## ADDED Requirements

### Requirement: Type belongs to its slot
The system SHALL accept an item type only when it belongs to the item's slot.

#### Scenario: Type from another slot
- **GIVEN** (optional) an initial state
- **WHEN** an item with slot `bottom` and type `blouse` is validated
- **THEN** validation fails
- **AND** the error names the `type` field
```

Rules the validator enforces:
- Section headings are exactly `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`.
- `### Requirement:` with **one** behavior and a `SHALL` or `MUST`; the description stays under 500 characters (`--strict` fails otherwise).
- `#### Scenario:` — **exactly four** `#`. With three, the scenario silently disappears.
- Every requirement has at least one scenario.
- Keywords and headings stay in English (the validator relies on them).

Delta operations:
- **ADDED** — new behavior.
- **MODIFIED** — copy the **whole** existing requirement block (header + every scenario) from `openspec/specs/`, then edit it. A partial copy loses scenarios when archiving. The header must match exactly.
- **REMOVED** — add `**Reason**:` and `**Migration**:` lines.
- **RENAMED** — `FROM:` / `TO:` lines.

Example for a later step: step 10 adds a silhouette component to scoring, so its change carries a MODIFIED copy of the whole `Weighted total with breakdown` requirement, with the scenario "Breakdown lists every component" edited to also name silhouette.

What belongs where:
- **spec** — observable behavior: inputs, outputs, errors, privacy rules. No library or function names.
- **design** — libraries, structure, signatures, trade-offs.
- **tasks** — the order of work and how to check each piece.

A change with no behavior at all (tooling, refactoring, docs only) sets `skip_specs: true` in its `.openspec.yaml` instead of inventing requirements.

## tasks.md conventions

- Groups `## 1. …`, tasks `- [ ] 1.1 …`. Only `x` / `X` in the box counts as done; `- [~]` and `- [-]` count as unfinished.
- Each task ends with how to verify it (a test, a command, observable behavior).
- Each group carries its own tests; the last group is only for integration checks.
- Plain bullets under `## Workflow follow-up` aren't tracked.

## config.yaml

`openspec/config.yaml` is read every time an artifact is written:
- `context` — constraints Claude can't see in the code: learning mode, languages, budget, decided stack, privacy rules. Limit: 50 KB.
- `rules` — extra rules per artifact (e.g. "design.md = learning pointers, no complete implementations").
- `operations` — advice for apply / archive.

Update it when something project-wide is decided — for example, after choosing 98 vs XP or a pixel font. Edits apply to the next artifact Claude writes.

## Pitfalls

- **Relative links inside a change break after archiving** (the folder moves one level deeper). Inside `openspec/` write plain paths like `docs/data-model.md#item`.
- **Don't edit `openspec/specs/` by hand** to change behavior — go through a change. The one exception is fixing a capability's `## Purpose`.
- **One intent per change.** If a change reads like a list of unrelated features, split it.
- **Archive only what's done.** Archiving with unticked tasks moves unfinished promises into the specs.
- **`openspec: command not found`** → reinstall globally (`npm install -g @fission-ai/openspec@1.14.1`) and check that `npm prefix -g` is on `PATH`.
