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

The full step-by-step procedure lives in the **`add-exercise` skill**
(`.claude/skills/add-exercise/SKILL.md`). Invoke it — or just ask Claude Code to
"add a new exercise" — instead of duplicating the steps here. It is the
canonical procedural guide and covers, in order: the spec-first/stage-discipline
gate, the `exercises.json` registry entry, the serial-code taxonomy, the
isolated `exercise.js` / `exercise.pseudo` / `viz.ts` / `__tests__` files, the
`ExerciseViz` interface, the `codeLines` line-number contract, i18n parity, and
the Vitest + build gate.

`spec.md` remains the source of truth for *what* an exercise must be — the
serial-code tables (`§ Serial Code Nomenclature`), the Gherkin scenarios, and
the Decisions Log — while the skill is the guide for *how* to add one. Two
invariants worth restating outside the skill, because they constrain all work
here: exercises are **fully isolated** (never modify another exercise's files),
and the exercise page + viz are **wired automatically** (`src/exercises/registry.ts`
lazy-loads `viz.ts` by id and `[slug].astro` is generated for every registry
entry), so there is no routing to add.

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
