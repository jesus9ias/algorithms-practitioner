# CLAUDE.md — Working instructions for Claude Code

## Project overview

**algorithms-practitioner** is an interactive learning platform for algorithms
and data structures. It is a static Astro (SSG) site with vanilla TypeScript —
no frontend framework — that renders per-exercise, step-by-step SVG
visualizations, persists user progress in `localStorage` (with export/import for
multi-device use), and supports English/Spanish and light/dark themes. There is
no backend. Hosting infrastructure (S3 + CloudFront + Route 53) is provisioned
with AWS CDK. The source of truth for all requirements is [`spec.md`](spec.md);
read it fully before acting.

## Working style rules (from `spec.md`)

- **Stage discipline.** Implementation is divided into ordered stages. Do not
  advance to the next stage without explicit developer authorization.
- **Spec-first.** Every implemented feature must trace to a Gherkin scenario in
  `spec.md`. No speculative features. New decisions/features must be documented
  in `spec.md` (Decisions Log) *before* the code is written.
- **Conflict detection.** If a change contradicts existing documentation or
  decisions, stop, alert the developer, and wait. If confirmed, update the docs
  first, then apply the change.
- **Language.** All code, comments, identifiers, file names, and docs are in
  English. User-visible text lives only in i18n JSON files.
- **No magic numbers/strings.** All constants and categorical values are
  declared in `frontend/src/lib/constants/` (enums + app constants). Never inline
  literals.
- **Test gate.** No code is added that does not pass its corresponding test.
  Tests are not created or modified without developer authorization. Orphaned
  tests trigger an alert before removal. The authoritative gate is **Vitest**
  (`npm test` in `frontend/`).
- **Isolation.** Each exercise keeps its own algorithm, viz, and tests. Nothing
  is shared across exercises except the interfaces they implement
  (`ExerciseViz` / `VizFactory`, the generic step engine).
- **Sensitive data.** Domain, AWS account, ARNs, etc. live only in `.env` files.
  Verify this on every edit. Non-sensitive config lives in `.json`.
- **Scope discipline.** Do not modify unrelated code without authorization.
- **State/UI separation.** State (step engine, storage, prefs) is kept distinct
  from rendering. Reusable logic is extracted to shared utilities under
  `frontend/src/lib/`.

## Directory map

```
algorithms-practitioner/
├── spec.md                     # Source of truth: requirements, Gherkin, tests, stages
├── CLAUDE.md                   # This file
├── README.md                   # Developer setup & deployment
├── frontend/                   # Astro SSG app
│   ├── astro.config.mjs        # output: static; site from PUBLIC_SITE_URL
│   ├── vitest.config.ts        # test include: src/**/*.test.ts
│   ├── tsconfig.json           # strict; tests excluded from the tsc/astro-check gate
│   ├── .env.example            # PUBLIC_SITE_URL
│   └── src/
│       ├── components/         # Astro UI components (Header, Footer, cards, modal…)
│       ├── data/               # exercises.json (registry) + typed loader
│       ├── exercises/          # One folder per exercise (isolated)
│       │   └── <id>/
│       │       ├── exercise.js        # Single exported pure function (the copyable code)
│       │       ├── viz.ts             # Pure buildSteps + SVG render (createViz: VizFactory)
│       │       └── __tests__/         # exercise.test.ts + viz.test.ts
│       ├── i18n/               # en.json, es.json, resolve(), applyLanguage()
│       ├── layouts/            # BaseLayout.astro (head, theme/lang, header/footer)
│       ├── lib/                # Shared, reusable, framework-free logic
│       │   ├── constants/      # enums.ts, storage.ts, app.ts, index.ts
│       │   ├── storage/        # Validated localStorage read/write/reset wrappers
│       │   ├── validation/     # userInput + localStorage validators
│       │   ├── viz/            # stepEngine, svg helpers, ExerciseViz/VizInput/StepDescriptor types, controller
│       │   ├── types.ts        # Result<T>, Exercise, Prefs, AppState…
│       │   ├── filters.ts      # filterExercises / searchExercises (pure)
│       │   ├── progress.ts     # computeProgress (pure)
│       │   ├── exportImport.ts # exportState / importState
│       │   ├── labels.ts       # category/level -> i18n key maps
│       │   ├── clientPrefs.ts  # theme/language/viewMode state + persistence
│       │   ├── globalInit.ts   # header/settings/export-import wiring
│       │   ├── homeInit.ts     # home filters/search/progress/view wiring
│       │   └── exerciseInit.ts # exercise page bootstrap (loads viz, copy button)
│       ├── pages/              # Routes: index, exercise/[slug], library/, 404
│       └── styles/             # global.css (CSS custom properties, both themes)
└── infra/                      # AWS CDK v2 (TypeScript)
    ├── bin/app.ts              # CDK entrypoint (loads .env via dotenv)
    ├── lib/
    │   ├── algo-dsa-stack.ts   # AlgoDsaStack (S3 + CloudFront + Route 53 + ACM)
    │   ├── config.ts           # Reads/validates env vars (single source)
    │   └── constants/          # Resource IDs, output keys, site config
    └── .env.example            # DOMAIN_NAME, HOSTED_ZONE_ID, AWS_*, CERTIFICATE_ARN
```

## How to add a new exercise

All work happens in `frontend/`. Exercises are fully isolated; do not touch
other exercises.

1. **Register it** in `src/data/exercises.json`. Add an entry with a unique
   kebab-case `id`, `slug`, inline `name` and `description` as
   `{ "en": "...", "es": "..." }`, a valid `category` (an `ExerciseCategory`
   value) and `level` (an `ExerciseLevel` value), `isNew: true`, `addedAt`
   (ISO date), `links` (each `{ "url": "...", "label": { "en": "...", "es": "..." } }`),
   `codeFile` (`"<id>/exercise.js"`), `defaultInput`, and optionally
   `defaultTarget`. Both `en` and `es` must be non-empty (enforced by `T-REG-06`).
   Exercise text lives here, not in `en.json`/`es.json`.

   For **text exercises** (input is a string rather than an integer array) add
   `"inputKind": "STRING"` and set `defaultInput` to a string literal. Omitting
   `inputKind` defaults to `NUMBERS` (integer-array behavior).

   Add a `stepMessages` object: a flat map of step-key → `{ "en": "...", "es": "..." }`
   template pairs. Keys are returned by `describeStep()` in `viz.ts`; values may
   contain `{placeholder}` tokens that the controller interpolates at runtime
   (e.g. `{ "check": { "en": "Checking index {i}", "es": "Revisando índice {i}" } }`).
   Every key that `describeStep` can emit must have an entry here.

   **Description convention:** the `description` must let the user understand the
   exercise without reading the code. Cover, in plain language, three things:
   (1) **what the algorithm does** — its core idea/strategy (e.g. "halves the
   range each step because the array is ordered"); (2) **what it receives** — the
   input type(s) (e.g. "a sorted array of integers and a target"); and (3) **what
   it returns** — the output and its meaning (e.g. "the index where the target is
   found, or -1"). Keep it accurate and concise; the home card shows the first few
   lines and the exercise page shows it in full.
2. **Create the folder** `src/exercises/<id>/`.
3. **Create `exercise.js`** — a **single** exported pure function (no side
   effects), named after the exercise's algorithm/structure, that receives the
   input and returns its natural result. No step trace, no expected-result or
   config parameters — it must be trivial to copy and run anywhere. Internal,
   non-exported helpers are fine.
4. **Create `viz.ts`** — export a pure `buildSteps(input)` returning
   `{ steps, result }`, and `const createViz: VizFactory` that uses it.
   `VizFactory` is `(input: VizInput) => ExerciseViz` where `VizInput` is
   `{ values: readonly number[]; target?: number; text?: string }` — `values`
   carries integer-array exercises; `text` carries string exercises.

   Implement the full `ExerciseViz` interface:
   - `totalSteps: number` — total number of steps (including the initial state).
   - `result: number | readonly number[] | string` — final result of the algorithm
     for the current input; displayed on the last step.
   - `renderStep(svg: SVGSVGElement, stepIndex: number): void` — draws the
     visualization for the given step into the provided `<svg>` element.
   - `describeStep(stepIndex: number): StepDescriptor | null` — returns a
     `{ key: string; params?: Record<string, string | number> }` descriptor for
     the step-detail log row, or `null` if the step produces no log entry (e.g.
     the initial state at step 0). The `key` must match an entry in
     `stepMessages`; `params` are interpolated into the template.

   Build SVG only with the helpers in `src/lib/viz/svg.ts`
   (`createElementNS` / `textContent`) — never `innerHTML`.
   Use the `--viz-*` CSS variables for color.
5. **Create `__tests__/exercise.test.ts`** (the exported function, multiple `it`
   cases for edge cases) and **`__tests__/viz.test.ts`** (the `buildSteps` step
   model, plus an integration test asserting `buildSteps(input).result` equals
   the exercise function's result), satisfying the Gherkin scenarios.
   (Adding/altering tests requires developer authorization.)
6. **Run `npm test`** in `frontend/`. All new tests must pass; `T-REG-04`
   confirms the `codeFile` resolves.
7. **Confirm no other tests broke** (`npm test` is the full suite) and that
   `npm run build` still produces a page at `/exercise/<slug>`.

The exercise page and viz are wired automatically: `src/exercises/registry.ts`
lazy-loads `viz.ts` by id, and `[slug].astro` is generated for every registry
entry.

## How to update an i18n string

For **general UI text**, edit the value in **both** `src/i18n/en.json` and
`src/i18n/es.json`. Never hardcode UI text in components or pages — reference the
key via the `data-i18n*` attributes (and the build-time `resolve()` helper) so
language switching works without a reload. Keep both files' key sets identical
and all values non-empty.

For **exercise-specific text** (name, description, link labels), edit the inline
`{ en, es }` objects in `src/data/exercises.json`. In markup, render the default
language with `localize(text, Language.EN)` and add `data-loc-en` / `data-loc-es`
attributes so `applyLanguage()` can switch it client-side via `textContent`.

## How to add a new category or level

1. Add the enum member to `src/lib/constants/enums.ts` (`ExerciseCategory` or
   `ExerciseLevel`).
2. Add its display key to **both** i18n files under `categories.*` / `levels.*`.
3. Add the enum→key mapping in `src/lib/labels.ts` (`CATEGORY_KEYS` /
   `LEVEL_KEYS`). The maps are exhaustive `Record<Enum, string>`, so TypeScript
   will flag a missing entry.
4. If this is a new decision, record it in the `spec.md` Decisions Log first.

## Security checklist for any code change

- Validate **all** external input — text fields, URL params, and `localStorage`
  — against strict schemas before use (`src/lib/validation/`). Reject anything
  off-schema with a **visible** error; never fail silently.
- Parse only with `JSON.parse`. Never use `eval`, `new Function`, or
  `document.write`.
- Build/update the DOM only with `textContent` or `createElement`/
  `createElementNS`. **Never** `innerHTML`. User-provided strings (e.g. saved
  input labels) go through `textContent` only.
- Unknown exercise slugs must render the 404 page and never reflect
  user-controlled strings into the DOM.
- Corrupt/tampered `localStorage` resets the affected key to its default and
  shows a visible warning (`storage` wrappers handle this).
- Keep all sensitive values in `.env`; confirm none leaked into source or JSON.

## Environment variable reference

| Scope    | Variable           | Purpose                                                       |
| -------- | ------------------ | ------------------------------------------------------------- |
| frontend | `PUBLIC_SITE_URL`  | Canonical URL for canonical links + OG tags                   |
| infra    | `DOMAIN_NAME`      | Full subdomain to serve (e.g. `algo.example.com`)             |
| infra    | `HOSTED_ZONE_ID`   | Route 53 hosted zone ID that owns the domain                  |
| infra    | `HOSTED_ZONE_NAME` | Route 53 zone name (apex domain, e.g. `example.com`)         |
| infra    | `AWS_ACCOUNT_ID`   | Target AWS account ID                                         |
| infra    | `AWS_REGION`       | Deployment region (must be `us-east-1` for CloudFront + ACM) |
| infra    | `AWS_PROFILE`      | AWS credentials profile for CDK CLI (optional; SDK env var)  |

Copy `frontend/.env.example` → `frontend/.env` and `infra/.env.example` →
`infra/.env`. `.env` files are git-ignored and must never be committed.

## Commands (run inside `frontend/`)

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm test`         | Run the full Vitest suite (the authoritative gate)  |
| `npm run test:watch` | Vitest in watch mode                              |
| `npm run typecheck`| `astro check` + `tsc --noEmit` (shipped code only)  |
| `npm run dev`      | Local dev server                                    |
| `npm run build`    | Static build to `dist/`                             |
