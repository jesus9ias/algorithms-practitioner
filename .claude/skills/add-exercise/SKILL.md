---
name: add-exercise
description: >-
  Guided, spec-first workflow for adding a brand-new algorithm exercise to the
  algorithms-practitioner project (the Astro/TypeScript step-by-step
  visualization site). Use this whenever the user wants to add, create,
  register, or scaffold a NEW exercise, algorithm, or data-structure
  visualization in this project — e.g. "add a bubble sort exercise", "create a
  new visualization for detecting a cycle in a linked list", "let's add merge
  sort", "scaffold an exercise for BFS", "register a new algorithm for
  two-sum", or the same intent in Spanish ("agrega un ejercicio nuevo de…").
  Trigger even when the user doesn't say the word "exercise" but clearly
  describes adding a new algorithm/visualization here. It enforces the full
  8-step procedure: the serial-code taxonomy, the registry entry, the isolated
  exercise/pseudo/viz/test files, i18n parity, the codeLines line-number
  contract, and the Vitest + build gate, so the exercise lands consistent with
  the existing ones on the first try. Do NOT use it for changing an EXISTING
  exercise (fixing a viz or codeLines bug, editing its registry fields or
  links, tweaking its default input), nor for adding a new category/level enum,
  translating UI strings, running the test suite, or deploying infra — those
  are ordinary edits, not a new exercise.
---

# Add a new exercise

This project (`algorithms-practitioner`) renders per-exercise, step-by-step SVG
visualizations of algorithms. Every exercise is **fully isolated** — its own
folder with algorithm, pseudo-code, viz, and tests — and traces to a spec. The
hard part is not the code; it's getting a dozen interlocking pieces consistent
(registry fields, the serial taxonomy, i18n parity, the 1-based line-number
contract, the test gate). This skill walks that path in the right order so
nothing is missed.

This skill is the **canonical procedure** for adding an exercise (`CLAUDE.md`
points here instead of repeating the steps). `spec.md` at the repo root remains
the **source of truth for requirements** — the serial-code tables, the Gherkin
scenarios, and the Decisions Log — and `CLAUDE.md` holds the general working-style
rules. When a procedural detail here ever disagrees with a requirement in
`spec.md`, `spec.md` wins — say so and stop.

All work happens in `frontend/`. **Never touch another exercise's files** —
isolation is a hard project rule.

## Before writing any code: the spec-first gate

This project has **stage discipline** and is **spec-first**. Skipping this gate
is the most common way to do work that gets rejected. Do this first:

1. **Confirm authorization to proceed.** Implementation advances in ordered
   stages; do not start a new exercise without the developer's explicit go-ahead
   for it. If it's unclear whether this exercise is in scope for the current
   stage, ask before scaffolding.
2. **Trace to a Gherkin scenario.** Every implemented feature must map to a
   scenario in `spec.md`. If no scenario covers this exercise yet, the spec is
   updated *before* the code — adding tests/specs requires developer
   authorization, so surface this rather than silently writing them.
3. **Record new decisions in the Decisions Log first.** If anything here is a new
   decision (a new category, a new serial-code segment, a new input kind), it
   goes into `spec.md` *before* the code, not after.
4. **Detect conflicts.** If the request contradicts existing docs/decisions,
   stop, alert the developer, and wait. If confirmed, update the docs first,
   then code.

Only once the exercise is authorized and spec-traced do you scaffold.

## Pick a canonical exercise to imitate

Don't invent shapes — copy the closest existing exercise and adapt. Read its
four files end to end before writing anything; they define the exact interfaces
and idioms (named line constants, `--viz-*` colors, svg helpers, test layout):

- **Array / numbers, simple loop:** `frontend/src/exercises/binary-search/`
- **Linked list (numbers in, list built internally):** `frontend/src/exercises/linked-list/`
- **Tree:** `frontend/src/exercises/binary-tree/`
- **String / text input:** `frontend/src/exercises/decode-string/`
- **Variants sharing a base (dedup on SLL/DLL/CLL):** `frontend/src/exercises/remove-duplicates-*/`

Match the one whose **input kind and data structure** are closest to the new
exercise.

## The serial code — derive it, never invent it

Before registering, decide the `serialCode` (`TYPE–STRUCT–OBJ–VAR`) using **only**
the tables in `spec.md § Serial Code Nomenclature`. If any dimension has no
matching value, **stop and flag it** — a new segment value must be added to the
spec table with developer approval before use.

Then **scan `exercises.json` for an existing exercise with the same
`serialCode`.** A duplicate is not forbidden but **must be flagged to the
developer** before proceeding — it means two exercises solve the same problem the
same way (intentional difficulty tiers, or a misclassification). The `id`,
`slug`, and `name` must each be unique **and allusive to the serial**, so the
taxonomy is readable from the id alone (`binary-search-rotated`, not `exercise7`).

## Scaffold: the files to create

Work in this order. The page and viz are wired automatically —
`src/exercises/registry.ts` lazy-loads `viz.ts` by id and `[slug].astro` is
generated for every registry entry — so there is **no routing or import wiring to
add**.

### 1. Register in `frontend/src/data/exercises.json`

Add one entry. Exercise-facing text (name, description, link labels,
stepMessages) lives **here**, inline as `{ "en": "...", "es": "..." }` — *not* in
`en.json`/`es.json`. Both `en` and `es` must be non-empty (enforced by a test).

Required fields: `id` (kebab-case, unique), `slug`, `serialCode`, `name`,
`description`, `category` (an `ExerciseCategory` value), `level` (an
`ExerciseLevel` value), `isNew: true`, `addedAt` (ISO date — today is fine),
`links` (each `{ url, label: { en, es } }`), `codeFile` (`"<id>/exercise.js"`),
`pseudoFile` (`"<id>/exercise.pseudo"`), `defaultInput`, optionally
`defaultTarget`, plus `stepMessages` (see below). For **string** exercises add
`"inputKind": "STRING"` and make `defaultInput` a string; omitting `inputKind`
defaults to integer-array behavior.

> **A "string exercise" does not automatically mean reuse `inputKind: "STRING"`.**
> The `STRING` validator (`parseEncodedString`) is **decode-string-specific**: it
> accepts only `[]` and *requires them balanced*. Before reusing it, confirm its
> charset and balance rules actually fit your exercise's custom input. If they
> don't — e.g. a bracket-validation exercise needs `(){}[]` and must accept
> *unbalanced* input — reusing `STRING` ships a **latent defect the gate can't
> catch**: Vitest tests the pure function, so a broken custom-input panel still
> goes green. Budget instead for a shared-infra change: a new `InputKind` value
> with its own validator in `src/lib/validation/`, per-kind placeholder/error
> i18n keys in **both** `en.json`/`es.json`, generalizing the
> `=== InputKind.STRING` checks in `controller.ts` / `exerciseInit.ts` /
> `[slug].astro` to `!== InputKind.NUMBERS`, and widening `ExerciseViz.result`
> (and `controller.ts`'s `formatValue`) if the exercise returns a new type such
> as `boolean` (astro-check/tsc catches the missing type; Vitest does not).
> A new `InputKind` is a spec-first decision — record it in the Decisions Log
> before coding.

**`description` must stand on its own** — a user should grasp the exercise
without reading the code. Cover three things plainly: (1) *what the algorithm
does* (its core idea/strategy), (2) *what it receives* (input types), (3) *what
it returns* (output and its meaning). Keep it accurate and concise.

**`stepMessages`** is a flat map of step-key → `{ en, es }` template pairs. Every
key your `describeStep()` can emit must have an entry. Values may contain
`{placeholder}` tokens interpolated at runtime, e.g.
`"check": { "en": "Checking index {i}", "es": "Revisando índice {i}" }`.

### 2. `frontend/src/exercises/<id>/exercise.js`

A **single** exported pure function (no side effects), named after the
algorithm/structure, taking the input and returning its natural result. **No step
trace, no expected-result or config parameters** — it must be trivial to copy and
run anywhere. Non-exported internal helpers are fine.

### 3. `frontend/src/exercises/<id>/exercise.pseudo`

The language-agnostic pseudo-code of that function: structured indentation, `←`
for assignment, `WHILE`/`FOR`/`IF`/`RETURN` uppercase, helpers below the main
one. Derive it directly from the JS — **every branch must be present**. Imitate
the existing `.pseudo` files exactly.

### 4. `frontend/src/exercises/<id>/viz.ts`

Export a pure `buildSteps(input)` returning `{ steps, result }`, and
`const createViz: VizFactory`. `VizFactory` is `(input: VizInput) => ExerciseViz`
where `VizInput` is `{ values: readonly number[]; target?: number; text?: string }`
— `values` carries integer-array exercises, `text` carries string exercises.

Implement the full `ExerciseViz` interface (see the canonical file for exact
types): `totalSteps`, `result`, `renderStep(svg, stepIndex)`,
`describeStep(stepIndex)` (returns `{ key, params? }` or `null`; `key` must match
a `stepMessages` entry), and `codeLines(stepIndex)` (see the contract below).

**Build SVG only with the helpers in `src/lib/viz/svg.ts`** (`createElementNS`/
`text`/`rect`/etc.) — **never `innerHTML`**. Use the `--viz-*` CSS variables for
all color.

### 5 & 6. `__tests__/exercise.test.ts` and `__tests__/viz.test.ts`

`exercise.test.ts`: the exported function with multiple `it` cases for edge
cases. `viz.test.ts`: the `buildSteps` step model, an integration test asserting
`buildSteps(input).result` equals the exercise function's result, and a
`codeLines` block asserting `codeLines(0)` is `null` and that every step maps to
in-range 1-based lines for **both** `js` and `pseudo` (read the sibling source
files to get their line counts, exactly as the existing tests do).

> **Tests are gated.** Creating or modifying tests requires developer
> authorization, and orphaned tests must be flagged before removal. If the user
> hasn't authorized the tests, write the exercise files and **ask** before adding
> or changing test files.

## The `codeLines` contract — the easiest thing to get wrong

`codeLines(stepIndex)` returns the **1-based** source line numbers that "execute"
at a step, per code mode: `{ js: readonly number[]; pseudo: readonly number[] }`,
or `null` when the step highlights nothing (**always `null` at step 0**). The
controller toggles an `is-executing` highlight on those `.line` spans.

- A step answers *"what happens here"*, not a single breakpoint — it may list
  **non-contiguous** lines (loop header + the branch taken + the pointer update).
- The viz step model is an **abstraction** of the algorithm, not a line-by-line
  trace; map each step to the line(s) that best express it. Setup that runs
  outside the stepped loop can attach to the step that conceptually performs it.
- Keep `js` and `pseudo` **in lockstep** with `exercise.js`/`exercise.pseudo`.
  **If you edit either source file, re-derive the numbers** — they're 1-based
  offsets into those files.
- Declare the line sets as **named constants at module scope** (no inline magic
  numbers), like the existing exercises (e.g. `REVERSE_STEP_LINES` in
  `linked-list/viz.ts`).
- `pseudo` is `[]` only if the exercise has no `pseudoFile` — and every exercise
  should have one, so this should effectively never be empty.

## Project rules that always apply

- **No magic numbers/strings.** Categorical values and constants live in
  `frontend/src/lib/constants/` (enums + app constants) — never inline literals.
  A new category/level means a new enum member **and** an i18n key in both files
  **and** a mapping in `src/lib/labels.ts`, recorded in the Decisions Log first.
- **i18n parity.** General UI strings live in both `en.json` and `es.json` with
  identical key sets and non-empty values; exercise text lives inline in
  `exercises.json`. Never hardcode user-visible text in components.
- **Security.** Validate all external input against the schemas in
  `src/lib/validation/`; parse only with `JSON.parse`; build DOM only via
  `textContent`/`createElement(NS)`, never `innerHTML`; unknown slugs render 404
  without reflecting user strings.
- **Sensitive data** (domain, AWS account, ARNs) lives only in `.env` — verify
  nothing leaked into source/JSON.
- **State/UI separation.** Step engine, storage, and prefs stay distinct from
  rendering.

## The gate — verify before declaring done

Run from inside `frontend/`:

1. `npm test` — the **authoritative gate**. All new tests must pass, and a
   registry test confirms `codeFile` resolves. Run the **full** suite (it is the
   suite) and confirm no existing test broke. **One existing test predictably
   breaks on a valid add:** `src/lib/__tests__/filters.test.ts` enumerates
   exercises against the real `exercises.json` — `T-FILT-02` lists every `EASY`
   id, and the `T-SEARCH` cases list ids whose name matches a search substring.
   If your exercise lands in one of those buckets (an `EASY` level, or a name
   containing a searched term like "binary"/"linked"), grep `filters.test.ts`
   for the affected enumeration and add your id (the arrays are `.sort()`ed).
   This is a required **fixture sync** forced by the authorized add, not a logic
   change — do it rather than reverting your registration.
2. `npm run build` — must still succeed and produce a page at
   `/exercise/<slug>`.
3. `npm run typecheck` if you touched shared types.

Report the actual results — if a test fails, show the output and fix it; don't
claim green without having seen it.

## Quick checklist

- [ ] Authorized for this stage; traces to a `spec.md` Gherkin scenario
- [ ] New decisions recorded in the Decisions Log *first*
- [ ] `serialCode` derived from the spec tables (no invented segments)
- [ ] Scanned for duplicate `serialCode`; flagged if found
- [ ] `id`/`slug`/`name` unique and allusive to the serial
- [ ] `exercises.json` entry complete; `en` + `es` non-empty; description self-contained
- [ ] `stepMessages` covers every `describeStep` key
- [ ] Input kind verified: `STRING` validator actually fits the charset/balance
      rules — else new `InputKind` + validator + i18n + widened `result` type
- [ ] `exercise.js` — single pure exported function, no extra params
- [ ] `exercise.pseudo` — every JS branch present
- [ ] `viz.ts` — full `ExerciseViz`; SVG via helpers only; `--viz-*` colors
- [ ] `codeLines` — named constants, 1-based, js/pseudo in lockstep, `null` at step 0
- [ ] Tests added/changed only with authorization
- [ ] `filters.test.ts` enumerations synced if the exercise is `EASY` / name-matched
- [ ] `npm test` green, `npm run build` produces `/exercise/<slug>`
