# algorithms-practitioner - Interactive Learning Platform — `spec.md`

> This document is the source of truth for Claude Code. All implementation decisions, Gherkin features, test definitions, and stage instructions are derived from it. Read it fully before acting on any prompt.

---

## Working Style for Claude Code

- **Stage discipline:** Implementation is divided into ordered stages. Begin with Stage 1. Do not proceed to the next stage without explicit developer authorization.
- **Spec-first:** Every feature implemented must trace back to a Gherkin scenario in this document. No feature is implemented speculatively.
- **Gherkin coverage:** All code created or modified must satisfy the scenarios defined here. Any new decision or feature discovered during implementation must be documented in this file immediately before code is written.
- **Conflict detection:** If a proposed code change contradicts existing documentation or decisions, stop, alert the developer, and wait for confirmation. If confirmed, update the documentation first, then apply the change.
- **Language:** All code, comments, variable names, documentation (`spec.md`, `claude.md`, `readme.md`), and file names are written in English. User-visible text lives only in JSON: general UI text in `src/i18n/en.json` / `es.json`, and exercise-specific text (name, description, link labels) inline as `{ en, es }` in `src/data/exercises.json`. No hardcoded UI strings in components or pages.
- **No magic numbers:** All constants and enumerations are declared in dedicated constants/enum files. No inline literal values.
- **Test gate:** No code is added that does not pass its corresponding test. Tests are not created or modified without developer authorization. Orphaned tests trigger an alert before removal.
- **Isolation:** Each exercise maintains its own isolated code, visualization logic, and tests. Nothing is shared across exercises except the interfaces they implement.
- **Sensitive data:** All sensitive configuration (domain, AWS account ID, etc.) lives in `.env` files only. Verify this on every edit. Non-sensitive configuration lives in `.json` files.
- **Scope discipline:** Code unrelated to the current task is never modified without developer authorization.
- **State/UI separation:** State management and UI rendering are kept in distinct layers. Reusable logic is extracted to shared utilities.
- **i18n:** Every user-visible string is sourced from JSON: general UI strings from `/src/i18n/en.json` and `/src/i18n/es.json`; exercise-specific strings from inline `{ en, es }` objects in `/src/data/exercises.json`. No hardcoded UI strings in component or page files.

---

## Repository Structure

Two separate repositories under a single monorepo root or as sibling repos:

```
algo-dsa/
├── frontend/          # Astro + TypeScript + Vanilla JS/TS
└── infra/             # AWS CDK v2, TypeScript
```

### Frontend stack

| Concern | Technology |
|---|---|
| Framework | Astro (SSG) |
| Language | TypeScript + Vanilla JS/TS (no frontend framework) |
| Visualization | SVG + TypeScript (vanilla, per-exercise) |
| Styling | CSS custom properties, no CSS framework |
| Testing | Vitest |
| i18n | Custom JSON-based solution (no external lib) |
| Storage | localStorage only (no backend) |

### Infra stack

| Concern | Technology |
|---|---|
| IaC | AWS CDK v2, TypeScript |
| Hosting | S3 + CloudFront |
| DNS | Route 53 (subdomain configured via `.env`) |
| CI/CD | GitHub Actions (build → S3 sync → CloudFront invalidation) |

---

## Environment Variables

### `infra/.env`

```
DOMAIN_NAME=          # Full subdomain, e.g. algo.example.com
HOSTED_ZONE_ID=       # Route 53 hosted zone ID
HOSTED_ZONE_NAME=     # Route 53 zone name (apex domain, e.g. example.com)
AWS_ACCOUNT_ID=
AWS_REGION=           # Must be us-east-1 for CloudFront + ACM
AWS_PROFILE=          # Optional: AWS credentials profile for CDK CLI
```

### `frontend/.env`

```
PUBLIC_SITE_URL=      # Used for canonical URLs and OG tags
```

No domain or environment value is hardcoded anywhere in source code.

---

## Data Model

### Exercise registry — `frontend/src/data/exercises.json`

Each entry:

Exercise-specific user-visible text (name, description, link labels) is stored
inline as `{ en, es }` objects, co-located with the exercise it belongs to.
General UI text still lives in `src/i18n/en.json` / `es.json`.

```jsonc
{
  "id": "binary-search",           // kebab-case, unique
  "slug": "binary-search",         // URL segment
  "serialCode": "SRCH-ARR-FIND-BIN", // four-part classification, internal only (see § Serial Code Nomenclature)
  "name": { "en": "Binary Search", "es": "Búsqueda Binaria" },
  "description": { "en": "Find a target…", "es": "Encuentra un valor…" },
  "category": "SEARCHING",         // ExerciseCategory enum value
  "level": "EASY",                 // ExerciseLevel enum value
  "isNew": true,                   // flag; set manually when adding
  "addedAt": "2025-01-01",         // ISO date, internal use only
  "links": [
    {
      "url": "https://...",
      "label": { "en": "Binary Search on Wikipedia", "es": "Búsqueda Binaria en Wikipedia" }
    }
  ],
  "codeFile": "binary-search/exercise.js",  // path relative to /src/exercises/
  "pseudoFile": "binary-search/exercise.pseudo", // optional; when present enables the JS/Pseudo-code switcher
  "defaultInput": [1, 3, 5, 7, 9, 11],
  "defaultTarget": 7
}
```

Each localized field is a `LocalizedText` = `{ en: string; es: string }`. Both
languages must be present and non-empty.

### Exercise code file — `frontend/src/exercises/<id>/exercise.js`

A **single** pure function is exported per file: the entry point that receives
the input and returns the natural result for the exercise's
algorithm/structure. No side effects, no "expected result" or step parameters —
it must be trivial for a user to copy and run in any environment. Internal,
non-exported helpers are allowed for readability and single-responsibility. The
step-by-step trace is **not** produced here; it lives in the exercise's `viz.ts`
(`buildSteps`). Example shape:

```js
// Single named export, named after the exercise's algorithm/structure
export function binarySearch(arr, target) { ... }
```

Canonical exported function per seed exercise:

| Exercise | Exported function | Returns |
|---|---|---|
| `binary-search` | `binarySearch(arr, target)` | index, or -1 |
| `linked-list` | `reverseLinkedList(values)` | reversed `number[]` |
| `binary-tree` | `binarySearchTreeInorder(values)` | ascending `number[]` |
| `decode-string` | `decodeString(s)` | expanded `string` |

Most exercises operate on integer arrays (`defaultInput: number[]`,
`VizInput.values`). Exercises whose natural input/output is text instead declare
a text `inputKind` in their registry entry and provide a `string` `defaultInput`;
the shared infra carries the raw text in `VizInput.text` and allows `string` (and
`boolean`) results (see Decisions Log, 2026-06-19 and 2026-06-23). The `InputKind`
enum has four values: `NUMBERS` (default — integer arrays), `STRING` (text in the
`n[substring]` run-length format, validated by `parseEncodedString`), `BRACKETS`
(free text whose meaningful tokens are `()[]{}`, possibly unbalanced, validated by
`parseBracketString`), and `MATRIX` (a rectangular 2D array of integers carried in
`VizInput.matrix`, validated by `parseIntegerMatrix`; see Decisions Log,
2026-06-23). `inputKind` is optional and defaults to `NUMBERS`, so numeric
exercises are unchanged; the two text kinds share the same text path and differ
only in their validator and placeholder/error strings, while `MATRIX` is a third
input shape with its own validator, display formatting and placeholder/error
strings.

### User state — localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `algo_learned` | `string[]` (exercise IDs) | Learned exercise IDs |
| `algo_inputs` | `Record<id, SavedInput[]>` | User-saved custom inputs per exercise |
| `algo_prefs` | `{ theme, language, viewMode }` | User preferences |
| `algo_code_open` | `Record<id, boolean>` | Per-exercise code-block expanded state (absent/`false` = collapsed) |

All data read from localStorage is validated against a schema before use. Invalid or tampered data triggers a visible error and is discarded without touching application state.

---

## Categories

Defined as an enum `ExerciseCategory`:

| Value | Display key |
|---|---|
| `GENERAL` | `categories.general` |
| `TEXT` | `categories.text` |
| `DATES` | `categories.dates` |
| `LISTS` | `categories.lists` |
| `MATRICES` | `categories.matrices` |
| `TREES` | `categories.trees` |
| `GRAPHS` | `categories.graphs` |
| `SORTING` | `categories.sorting` |
| `SEARCHING` | `categories.searching` |
| `HASHING` | `categories.hashing` |
| `DYNAMIC_PROGRAMMING` | `categories.dynamicProgramming` |
| `RECURSION` | `categories.recursion` |
| `BIT_MANIPULATION` | `categories.bitManipulation` |
| `HEAPS` | `categories.heaps` |

---

## Serial Code Nomenclature

Each exercise in `exercises.json` carries a `serialCode` string — a four-part
classification code that identifies the *class* of the exercise (not its unique
instance). The `id` remains the unique key; two exercises can share a `serialCode`
only when they are truly equivalent in every dimension (see duplicate policy below).

### Format

```
TYPE–STRUCT–OBJ–VAR
```

All four parts are required, separated by hyphens. Values come exclusively from
the tables below. **Never invent a new code.** If no existing value fits, stop and
discuss with the developer before adding; the new value must be added to the tables
here first.

### Part 1 — TYPE (algorithm technique)

| Code | Meaning |
|---|---|
| `SRCH` | Search / lookup |
| `SORT` | Sorting / ordering |
| `TRAV` | Traversal (walk a structure) |
| `BUILD` | Construction (build the structure from input) |
| `XFRM` | Transformation (convert/reshape data) |
| `COMP` | Computation (aggregate value: sum, max, count…) |
| `RECR` | Recursion (primary technique is recursive decomposition) |
| `DYNA` | Dynamic programming |

### Part 2 — STRUCT (data structure)

| Code | Meaning |
|---|---|
| `ARR` | Array |
| `LIST` | Linked list |
| `TREE` | Tree |
| `GRPH` | Graph |
| `MAT` | Matrix |
| `STR` | String / text |
| `HEAP` | Heap / priority queue |
| `HASH` | Hash table / dictionary |
| `STCK` | Stack |
| `QUE` | Queue |
| `NUM` | Scalar / single number (no aggregate data structure) |

### Part 3 — OBJ (objective / what the algorithm achieves)

| Code | Meaning |
|---|---|
| `FIND` | Find / locate an element |
| `DEDUP` | Remove duplicates |
| `REM` | Remove / filter elements (general) |
| `REV` | Reverse |
| `ORD` | Order / sort / in-order traversal |
| `DEC` | Decode / expand |
| `MAX` | Find maximum or minimum |
| `CNT` | Count occurrences |
| `MRG` | Merge |
| `XPOS` | Transpose |
| `VAL` | Validate / check a property (returns a boolean verdict) |
| `AVG` | Average / mean (compute the arithmetic mean of values) |
| `FREQ` | Most frequent / top-k by frequency (mode) |
| `NTH` | Compute the n-th value of a sequence (e.g. Fibonacci, factorial) |
| `WAYS` | Count the number of distinct ways to reach an outcome (combinatorial path counting) |
| `TOPK` | Select the k largest/smallest elements by value (not by frequency) |
| `DIFF` | Compute the difference or distance between two values (e.g. days between two dates) |

### Part 4 — VAR (variant — specific form of the structure or technique)

| Code | Applies to | Meaning |
|---|---|---|
| `SMP` | LIST | Singly linked |
| `DBL` | LIST | Doubly linked |
| `CIR` | LIST | Circular |
| `BST` | TREE | Binary search tree |
| `BIN` | TREE / SRCH | Binary (generic binary tree or binary search) |
| `AVL` | TREE | AVL / self-balancing |
| `NARY` | TREE | N-ary tree |
| `SQR` | MAT | Square matrix |
| `RCT` | MAT | Rectangular matrix |
| `LIN` | SRCH | Linear search |
| `STD` | any | Standard — no meaningful variant |

### Current exercises

| id | serialCode |
|---|---|
| `binary-search` | `SRCH-ARR-FIND-BIN` |
| `linked-list` | `TRAV-LIST-REV-SMP` |
| `binary-tree` | `TRAV-TREE-ORD-BST` |
| `decode-string` | `XFRM-STR-DEC-STD` |
| `quicksort` | `SORT-ARR-ORD-STD` |
| `valid-parentheses` | `COMP-STR-VAL-STD` |
| `running-average` | `COMP-ARR-AVG-STD` |
| `top-k-frequent` | `SORT-ARR-FREQ-STD` |
| `matrix-spiral` | `TRAV-MAT-ORD-RCT` |
| `bubble-sort` | `SORT-ARR-ORD-STD` (duplicate of `quicksort` — intentional: two difficulty tiers of comparison-based array sort) |
| `merge-sort` | `SORT-ARR-ORD-STD` (triplicate of `quicksort`/`bubble-sort` — intentional: third comparison-based array sort, distinct divide-and-conquer visualization archetype) |
| `two-sum` | `SRCH-HASH-FIND-STD` |
| `reverse-string` | `XFRM-STR-REV-STD` |
| `palindrome-check` | `COMP-STR-VAL-STD` (duplicate of `valid-parentheses` — intentional: both are boolean-verdict `VAL` checks over `STR`, but via different techniques over different properties) |
| `fibonacci` | `RECR-NUM-NTH-STD` |
| `binary-search-rotated` | `SRCH-ARR-FIND-BIN` (duplicate of `binary-search` — intentional: two difficulty tiers of the same search-array-find-binary technique, standard vs. rotated-array variant) |
| `climbing-stairs` | `DYNA-NUM-WAYS-STD` |
| `max-subarray` | `DYNA-ARR-MAX-STD` |
| `coin-change` | `DYNA-ARR-MAX-STD` (duplicate of `max-subarray` — intentional: `MAX` covers minimum too, both are `DYNA`-over-`ARR`, but distinct tabulation vs. single-pass techniques) |
| `inorder-traversal` | `TRAV-TREE-ORD-BIN` |
| `level-order-traversal` | `TRAV-TREE-ORD-BIN` (duplicate of `inorder-traversal` — intentional: both are `TRAV`-over-`TREE` traversals producing an `ORD` order over a generic (`BIN`) binary tree; the serial nomenclature has no segment distinguishing depth-first from breadth-first technique, the same gap already accepted for `quicksort`/`bubble-sort`/`merge-sort`) |
| `bfs-graph` | `TRAV-GRPH-ORD-STD` |
| `dfs-graph` | `TRAV-GRPH-ORD-STD` (duplicate of `bfs-graph` — intentional: both are `TRAV`-over-`GRPH` traversals producing an `ORD` order over a generic (`STD`) graph; the serial nomenclature has no segment distinguishing depth-first from breadth-first technique, the same gap already accepted for `inorder-traversal`/`level-order-traversal`) |
| `min-heap` | `BUILD-HEAP-ORD-STD` |
| `top-k-elements` | `COMP-HEAP-TOPK-STD` |
| `single-number` | `COMP-ARR-FIND-STD` |
| `count-bits` | `COMP-NUM-CNT-STD` |
| `date-difference` | `COMP-NUM-DIFF-STD` |

### Rules when adding an exercise

1. **Derive the serial from the tables above — do not invent codes.** If a
   dimension does not match any existing value, flag it before writing any code.
2. **The `id`, `slug`, and `name` must be unique AND allusive to the serial.**
   Someone reading the id should be able to infer the general class of exercise.
   Examples: `linked-list-circular-dedup` is a clear derivative of `linked-list`;
   `binary-search-rotated` signals a `SRCH-ARR-FIND` variant on a rotated array.
3. **Alert on duplicate serials.** Before finalizing the exercise entry, check
   whether any existing exercise already has the same `serialCode`. A duplicate
   is not forbidden but must be reviewed: it means both exercises solve the
   exact same problem in the same way — confirm this is intentional (e.g. two
   difficulty tiers of the same algorithm) or revise the code.

---

## Levels

Defined as an enum `ExerciseLevel` (LeetCode-style, 3 tiers):

| Value | Display key |
|---|---|
| `EASY` | `levels.easy` |
| `MEDIUM` | `levels.medium` |
| `HARD` | `levels.hard` |

---

## Initial Exercises (Stage 4 seed set)

Three exercises chosen to cover distinct visualization archetypes:

| ID | Name | Category | Level | Visual archetype |
|---|---|---|---|---|
| `binary-search` | Binary Search | SEARCHING | EASY | Linear array with pointer animation |
| `linked-list` | Linked List | LISTS | EASY | Node chain with pointer traversal |
| `binary-tree` | Binary Search Tree | TREES | MEDIUM | Tree graph with node highlight |

---

## Views and Routing

| Route | Page | Description |
|---|---|---|
| `/` | Home | Exercise list, progress bar, search, filters |
| `/exercise/[slug]` | Exercise | Detail view with interactive visualization |
| `/library` | Library | Reference links grouped by exercise |

All routes are statically generated by Astro. The `[slug]` dynamic route generates one page per exercise at build time.

---

## UI Features

### Theme

- Detects `prefers-color-scheme` on first load.
- User selection stored in `algo_prefs.theme` (`"light"` | `"dark"`).
- Applied via a `data-theme` attribute on `<html>`.
- Implemented with CSS custom properties only.

### Language

- Detects `navigator.language` on first load; defaults to English if not `es`.
- User selection stored in `algo_prefs.language` (`"en"` | `"es"`).
- Switcher available in the global header.
- All text sourced from `/src/i18n/en.json` and `/src/i18n/es.json`.

### View mode (Home)

- Grid or list toggle, stored in `algo_prefs.viewMode` (`"grid"` | `"list"`).

### Filters (Home)

- By category (multi-select).
- By level (multi-select).
- By status: all / learned / unlearned.
- By new flag.
- Combined filters are additive (AND logic).

### Search (Home)

- Searches exercise name and description (via i18n resolved strings).
- Case-insensitive, diacritic-insensitive.

### Progress bar (Home)

- Displays `learned / total` as percentage.
- Updates reactively when learned state changes.

### Exercise page

- Name, description, reference link(s).
- Interactive SVG visualization with step-by-step playback.
- Playback controls: Preload / Reset / Auto / Step Forward / Step Back.
- Auto mode plays steps at a fixed interval (constant, not configurable per-session).
- Custom input panel: user types or pastes input; validated before use; saveable with a label; reloadable from a saved list.
- Algorithm code block (pure JS), syntax-highlighted, with Copy and Expand/Collapse buttons. The block is collapsed by default; the expanded/collapsed state is persisted per exercise (`algo_code_open`) and survives reloads. The Copy button is hidden while the block is collapsed (it only applies to visible code).
- When the exercise has a `pseudoFile`, a JS / Pseudo-code button group appears in the code header. Switching modes swaps the visible code block; the Copy button always copies the currently visible block. The JS view is the default. Exercises without a `pseudoFile` show no switcher.
- Mark as Learned / Unlearn toggle.

### Library page

- List of all reference links across all exercises.
- Each entry shows its linked exercise name (cross-reference to exercise page).

### Export / Import

- Available in settings.
- Exports `algo_learned`, `algo_inputs`, `algo_prefs`, and `algo_code_open` as a single JSON file download.
- Import parses and validates the JSON before applying. Invalid import shows a visible error, no partial state applied. `algo_code_open` is optional on import (older files without it remain valid) but, when present, must pass validation like every other key.

---

## Security

- All user input (text fields, URL parameters, localStorage) is validated against strict schemas before use.
- Input fields accept only the expected types (e.g., numeric arrays, integer targets). Anything outside schema is rejected with a visible user-facing error.
- URL parameters (`slug`) are matched against the known exercise ID list. Unknown slugs render a 404 page; they are never reflected into the DOM unescaped.
- localStorage values are parsed through a validation layer. Schema mismatch results in a visible warning and the affected key is reset to its default value.
- No `innerHTML`, `eval`, `new Function`, or `document.write` is used anywhere. DOM updates use `textContent` or controlled `createElement` calls.
- Content Security Policy headers are set at the CloudFront distribution level.

---

## Gherkin Feature Specifications

### Feature: Exercise list (Home)

```gherkin
Feature: Exercise list on home page

  Background:
    Given the user is on the home page

  Scenario: Default list view shows all exercises
    When no filters are active
    Then all exercises are displayed
    And each exercise shows its name, category badge, level badge, and description

  Scenario: Grid and list view toggle
    When the user clicks the grid view toggle
    Then exercises are displayed in a grid layout
    When the user clicks the list view toggle
    Then exercises are displayed in a list layout
    And the preference is persisted in localStorage

  Scenario: Filter by category
    When the user selects the "Searching" category filter
    Then only exercises with category "SEARCHING" are displayed

  Scenario: Filter by level
    When the user selects the "Easy" level filter
    Then only exercises with level "EASY" are displayed

  Scenario: Filter by learned status
    When the user selects the "Learned" status filter
    Then only exercises marked as learned are displayed

  Scenario: Filter by new flag
    When the user selects the "New" filter
    Then only exercises with isNew=true are displayed

  Scenario: Combined filters
    When the user selects category "Sorting" and level "Medium"
    Then only exercises matching both conditions are displayed

  Scenario: Search by name
    When the user types "binary" in the search field
    Then only exercises whose name contains "binary" (case-insensitive) are displayed

  Scenario: No results state
    When the active filters match no exercises
    Then an empty state message is displayed
    And no exercise cards are rendered

  Scenario: Progress bar reflects learned count
    Given 2 out of 3 exercises are marked as learned
    When the user views the home page
    Then the progress bar shows approximately 67%
    And the label reads "2 / 3"
```

### Feature: Exercise detail page

```gherkin
Feature: Exercise detail page

  Background:
    Given the user navigates to "/exercise/binary-search"

  Scenario: Page renders correctly
    Then the exercise name is displayed
    And the description is displayed
    And at least one reference link is displayed
    And the interactive visualization is rendered
    And the algorithm code block is displayed

  Scenario: Step-forward playback
    Given the visualization is at step 0
    When the user clicks "Step forward"
    Then the visualization advances to step 1
    And the current step indicator updates

  Scenario: Step-back playback
    Given the visualization is at step 2
    When the user clicks "Step back"
    Then the visualization returns to step 1

  Scenario: Auto playback
    Given the visualization is at step 0
    When the user clicks "Auto"
    Then the visualization advances through all steps automatically
    And the Auto button changes to a Stop/Pause state

  Scenario: Reset
    Given the visualization is at step 3
    When the user clicks "Reset"
    Then the visualization returns to step 0
    And the step-detail log is cleared

  Scenario: Step-detail log grows and shrinks with playback
    Given the visualization is at step 0
    Then the step-detail log shows no step rows
    When the user clicks "Step forward"
    Then the step-detail log shows one row describing step 1
    When the user clicks "Step forward"
    Then the step-detail log shows two rows, the second describing step 2
    When the user clicks "Step back"
    Then the last row is removed and only step 1 remains

  Scenario: Copy algorithm code
    When the user clicks the "Copy" button on the code block
    Then the full algorithm code is copied to the clipboard
    And a confirmation indicator is briefly shown

  Scenario: Code block is collapsed by default
    Given the user has never toggled this exercise's code block
    Then the algorithm code is hidden
    And the toggle button offers to show the code
    And the Copy button is hidden

  Scenario: Expand and collapse the code block
    Given the code block is collapsed
    When the user clicks the code toggle button
    Then the algorithm code becomes visible
    And the Copy button becomes visible
    And the expanded state is saved in localStorage for this exercise
    When the user clicks the code toggle button again
    Then the algorithm code is hidden again
    And the collapsed state is saved in localStorage for this exercise

  Scenario: Code-block state persists across reloads
    Given the user expanded this exercise's code block
    When the user reloads the page
    Then the algorithm code is shown without further interaction

  Scenario: Mark as learned
    Given the exercise is not marked as learned
    When the user clicks "Mark as learned"
    Then the exercise is added to the learned list in localStorage
    And the button label changes to "Unlearn"

  Scenario: Unlearn
    Given the exercise is marked as learned
    When the user clicks "Unlearn"
    Then the exercise is removed from the learned list in localStorage
    And the button label changes to "Mark as learned"

  Scenario: Custom input — valid
    Given the user enters a valid array input "[2, 4, 6, 8]"
    When the user clicks "Apply input"
    Then the visualization resets and uses the new input

  Scenario: Custom input — invalid
    Given the user enters an invalid input "alert('xss')"
    When the user clicks "Apply input"
    Then a validation error is shown
    And the visualization is not updated

  Scenario: Save custom input
    Given a valid custom input is applied
    When the user types a label "My test case" and clicks "Save"
    Then the input is stored in localStorage under this exercise's saved inputs

  Scenario: Reload saved input
    Given a saved input "My test case" exists for this exercise
    When the user selects it from the saved inputs list
    Then the visualization resets and uses that saved input

  Scenario: Unknown slug redirects to 404
    Given the user navigates to "/exercise/not-a-real-slug"
    Then a 404 page is displayed
    And no user input is reflected into the DOM

  Scenario: Code block defaults to JavaScript view when pseudo-code is available
    Given the exercise has a pseudoFile
    And the code block is visible
    Then the JavaScript code is shown
    And the "JavaScript" mode button is active
    And the "Pseudo-code" mode button is inactive

  Scenario: Switch to pseudo-code view
    Given the exercise has a pseudoFile
    And the code block is visible and showing JavaScript
    When the user clicks the "Pseudo-code" mode button
    Then the pseudo-code is shown
    And the JavaScript code is hidden
    And the "Pseudo-code" mode button becomes active

  Scenario: Copy button copies the active code view
    Given the exercise has a pseudoFile
    And the code block is expanded and showing pseudo-code
    When the user clicks the "Copy" button
    Then the pseudo-code text is copied to the clipboard

  Scenario: Exercise without a pseudoFile shows no mode switcher
    Given the exercise has no pseudoFile
    Then the code mode switcher is not rendered
    And the JavaScript code is shown directly

  Scenario: Executing code lines are highlighted at each step
    Given the exercise viz exposes per-step code lines
    And the user is on a step greater than the initial state
    Then every source line that executes at that step is highlighted in the code block
    And the highlighted lines may be non-contiguous
    And both the JavaScript and pseudo-code blocks reflect the lines for the current step

  Scenario: Initial step highlights no code lines
    Given the user is on the initial state (step 0)
    Then no code line is highlighted

  Scenario: Code-line highlight is independent of code-block visibility
    Given the exercise viz exposes per-step code lines
    And the code block is collapsed
    When the user advances steps
    Then the lines are still marked for the current step
    And become visible unchanged when the user expands the code block
```

### Feature: Library page

```gherkin
Feature: Library page

  Background:
    Given the user is on "/library"

  Scenario: All reference links are listed
    Then each exercise's reference links are displayed
    And each entry shows the exercise name as a cross-reference link

  Scenario: Cross-reference navigates to exercise
    When the user clicks an exercise name cross-reference
    Then the user is navigated to that exercise's detail page
```

### Feature: Theme

```gherkin
Feature: Theme (light / dark)

  Scenario: Default theme from system preference
    Given the user's system prefers dark mode
    And no theme preference is stored
    When the page loads
    Then the dark theme is applied

  Scenario: User overrides theme
    When the user clicks the theme toggle
    Then the theme switches
    And the preference is stored in localStorage

  Scenario: Stored preference is respected on reload
    Given the user previously selected light theme
    When the page reloads
    Then the light theme is applied regardless of system preference
```

### Feature: Language

```gherkin
Feature: Language switcher (English / Spanish)

  Scenario: Default language from browser
    Given the browser language is "es"
    And no language preference is stored
    When the page loads
    Then Spanish is used for all UI text

  Scenario: User switches language
    When the user selects "English" from the language switcher
    Then all UI text updates to English
    And the preference is stored in localStorage

  Scenario: Stored language persists on reload
    Given the user previously selected Spanish
    When the page reloads
    Then Spanish is used
```

### Feature: Export / Import

```gherkin
Feature: Export and import user data

  Scenario: Export produces valid JSON
    Given the user has learned exercises and saved inputs
    When the user clicks "Export"
    Then a JSON file is downloaded
    And it contains algo_learned, algo_inputs, and algo_prefs keys

  Scenario: Import valid file restores state
    Given a valid export JSON file
    When the user imports it
    Then learned exercises, saved inputs, preferences, and code-block states are restored

  Scenario: Import file without code-block states stays valid
    Given a valid export JSON file produced before the code-block toggle existed
    When the user imports it
    Then the import succeeds and the other state keys are restored

  Scenario: Import invalid file shows error
    Given a malformed JSON file
    When the user imports it
    Then a visible error message is shown
    And no state is modified

  Scenario: Import tampered data shows error
    Given a JSON file with unexpected field types
    When the user imports it
    Then a visible error message is shown
    And no state is modified
```

### Feature: Security — input validation

```gherkin
Feature: Input validation and security

  Scenario: Script injection in custom input field is blocked
    When the user submits "<script>alert(1)</script>" as a custom input
    Then the input is rejected with a visible error
    And no script is executed

  Scenario: Invalid localStorage data is reset
    Given corrupted data exists in algo_learned in localStorage
    When the page loads
    Then the corrupted key is reset to its default value
    And a visible warning is shown to the user

  Scenario: Unknown URL slug does not reflect in DOM
    When the user navigates to "/exercise/<img src=x onerror=alert(1)>"
    Then a 404 page is shown
    And no user-controlled string is rendered unescaped
```

---

## Unit Test Definitions

> No test code is in this document. Tests are defined by objective and expected input/output only.

### Exercise registry

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-REG-01` | All exercises have required fields | `exercises.json` | No entry missing id, slug, category, level, codeFile |
| `T-REG-02` | All category values are valid enum members | `exercises.json` | All `category` fields match `ExerciseCategory` values |
| `T-REG-03` | All level values are valid enum members | `exercises.json` | All `level` fields match `ExerciseLevel` values |
| `T-REG-04` | All codeFile paths resolve to existing files | `exercises.json` | No 404 on any `codeFile` reference |
| `T-REG-05` | All exercise IDs are unique | `exercises.json` | No duplicate `id` values |
| `T-REG-06` | All localized fields have non-empty en/es | `exercises.json` | Every `name`, `description`, and link `label` has non-empty `en` and `es` |
| `T-REG-07` | All exercises declare non-empty localized `stepMessages` | `exercises.json` | Every entry has a `stepMessages` map whose every value has non-empty `en` and `es` |

### i18n

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-I18N-01` | English and Spanish files have identical key sets | `en.json`, `es.json` | Key sets are equal |
| `T-I18N-02` | No key has an empty string value | `en.json`, `es.json` | All values are non-empty strings |
| `T-I18N-03` | Resolve function returns correct string for known key | `("nav.home", "en")` | `"Home"` |
| `T-I18N-04` | Resolve function returns fallback for unknown key | `("exercises.unknown.name", "en")` | Returns key itself or defined fallback constant |

### localStorage validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LS-01` | Valid `algo_learned` passes validation | `["binary-search"]` | Returns parsed array |
| `T-LS-02` | Non-array `algo_learned` fails validation | `"binary-search"` | Returns error result |
| `T-LS-03` | Array with non-string values fails | `[1, 2, 3]` | Returns error result |
| `T-LS-04` | Unknown exercise IDs in learned list fail | `["not-a-real-id"]` | Returns error result |
| `T-LS-05` | Valid `algo_prefs` passes validation | `{ theme: "dark", language: "en", viewMode: "grid" }` | Returns parsed object |
| `T-LS-06` | `algo_prefs` with invalid theme value fails | `{ theme: "blue", language: "en", viewMode: "grid" }` | Returns error result |
| `T-LS-07` | Tampered JSON string triggers reset | `"{{not json}}"` | Returns error result, default applied |
| `T-LS-08` | Valid `algo_code_open` passes validation | `{ "binary-search": true }` | Returns parsed object |
| `T-LS-09` | `algo_code_open` with non-boolean value fails | `{ "binary-search": 1 }` | Returns error result |
| `T-LS-10` | `algo_code_open` with unknown exercise ID fails | `{ "not-a-real-id": true }` | Returns error result |

### User input validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-INP-01` | Valid integer array passes | `"[1, 3, 5, 7]"` | Returns parsed `number[]` |
| `T-INP-02` | Script tag is rejected | `"<script>alert(1)</script>"` | Returns error result |
| `T-INP-03` | Object instead of array is rejected | `"{a:1}"` | Returns error result |
| `T-INP-04` | Floats are rejected when integers expected | `"[1.5, 2.5]"` | Returns error result |
| `T-INP-05` | Empty array is rejected | `"[]"` | Returns error result |
| `T-INP-06` | Array exceeding max length is rejected | Array of 10001 elements | Returns error result |

### Filter and search logic

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-FILT-01` | Filter by single category returns correct subset | All exercises, filter `SEARCHING` | Only `binary-search` |
| `T-FILT-02` | Filter by level returns correct subset | All exercises, filter `EASY` | All EASY exercises |
| `T-FILT-03` | Filter by learned returns only learned IDs | Learned: `["binary-search"]`, all exercises | Only `binary-search` |
| `T-FILT-04` | Combined category + level filter | Category `TREES`, level `MEDIUM` | Only `binary-tree` |
| `T-FILT-05` | No-match filter returns empty array | Category `DATES` (no exercises yet) | `[]` |
| `T-SEARCH-01` | Search matches name substring | Query `"binary"` | `binary-search`, `binary-tree` |
| `T-SEARCH-02` | Search is case-insensitive | Query `"LINKED"` | `linked-list` |
| `T-SEARCH-03` | Search returns empty on no match | Query `"xyznonexistent"` | `[]` |

### Progress bar

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-PROG-01` | 0 learned, 3 total → 0% | `learned=[], total=3` | `{ percent: 0, label: "0 / 3" }` |
| `T-PROG-02` | 2 learned, 3 total → 67% | `learned=["a","b"], total=3` | `{ percent: 67, label: "2 / 3" }` |
| `T-PROG-03` | All learned → 100% | `learned=["a","b","c"], total=3` | `{ percent: 100, label: "3 / 3" }` |

### Exercise algorithms (single exported pure function)

Each `exercise.js` exports exactly one function. Tests validate that function
directly (multiple `it` cases per `describe` for edge cases); they do not probe
internal helpers.

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ALG-BS-01` | Binary search finds existing target | `binarySearch([1,3,5,7,9], 7)` | `3` |
| `T-ALG-BS-02` | Binary search returns -1 for missing target | `binarySearch([1,3,5,7,9], 4)` | `-1` |
| `T-ALG-BS-03` | Binary search on single-element array | `binarySearch([5], 5)` | `0` |
| `T-ALG-LL-01` | Reverse a multi-element list | `reverseLinkedList([4,2,7])` | `[7,2,4]` |
| `T-ALG-LL-02` | Reverse a single-element list | `reverseLinkedList([1])` | `[1]` |
| `T-ALG-LL-03` | Reverse an empty list | `reverseLinkedList([])` | `[]` |
| `T-ALG-BST-01` | BST in-order returns sorted values | `binarySearchTreeInorder([5,3,7,1,4])` | `[1,3,4,5,7]` |
| `T-ALG-BST-02` | BST in-order ignores duplicates | `binarySearchTreeInorder([5,3,3,5])` | `[3,5]` |
| `T-ALG-BST-03` | BST in-order on single value | `binarySearchTreeInorder([42])` | `[42]` |
| `T-ALG-BST-04` | BST in-order on empty input | `binarySearchTreeInorder([])` | `[]` |
| `T-ALG-DS-01` | Decodes sequential groups | `decodeString("3[ab]2[cd]")` | `"abababcdcd"` |
| `T-ALG-DS-02` | Decodes nested groups inside-out | `decodeString("2[a3[b]]")` | `"abbbabbb"` |
| `T-ALG-DS-03` | Preserves text without brackets | `decodeString("abc")` | `"abc"` |
| `T-ALG-DS-04` | Handles multi-digit repeat counts | `decodeString("12[a]")` | `"aaaaaaaaaaaa"` |
| `T-ALG-DS-05` | Keeps letters outside brackets | `decodeString("ab2[c]d")` | `"abccd"` |
| `T-ALG-DS-06` | Returns empty string for empty input | `decodeString("")` | `""` |
| `T-ALG-BSORT-01` | Bubble sort sorts an unsorted array ascending | `bubbleSort([5,3,1,4,2])` | `[1,2,3,4,5]` |
| `T-ALG-BSORT-02` | Already-sorted array is unchanged | `bubbleSort([1,2,3,4])` | `[1,2,3,4]` |
| `T-ALG-BSORT-03` | Reverse-sorted array is sorted | `bubbleSort([4,3,2,1])` | `[1,2,3,4]` |
| `T-ALG-BSORT-04` | Handles duplicates | `bubbleSort([3,1,3,2,1])` | `[1,1,2,3,3]` |
| `T-ALG-BSORT-05` | Single-element array | `bubbleSort([42])` | `[42]` |
| `T-ALG-BSORT-06` | Empty input | `bubbleSort([])` | `[]` |

### Visualization step model and integration (per exercise)

`viz.ts` separates a pure `buildSteps(input)` (returns `{ steps, result }`) from
SVG rendering, so the step model is testable in Node without a DOM.

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-VIZEX-BS` | Binary search steps end on the found index; non-empty trace | `{ values:[1,3,5,7,9], target:7 }` | `steps.length > 0`, last step marks index 3 |
| `T-VIZEX-LL` | Linked list steps visit every node | `{ values:[4,2,7] }` | `steps.length === values.length` |
| `T-VIZEX-BST` | BST steps visit every node once | `{ values:[5,3,7,1,4] }` | `steps.length === values.length` |
| `T-INT-BS` | Viz result equals `binarySearch` result | `{ values:[1,3,5,7,9], target:7 }` | `buildSteps(input).result === binarySearch([1,3,5,7,9], 7)` |
| `T-INT-LL` | Viz result equals `reverseLinkedList` result | `{ values:[4,2,7] }` | `buildSteps(input).result` deep-equals `reverseLinkedList([4,2,7])` |
| `T-INT-BST` | Viz result equals `binarySearchTreeInorder` result | `{ values:[5,3,7,1,4] }` | `buildSteps(input).result` deep-equals `binarySearchTreeInorder([5,3,7,1,4])` |
| `T-VIZEX-DS` | Decode string emits one step per scanned character | `{ text:"2[a3[b]]" }` | `steps.length === text.length` |
| `T-INT-DS` | Viz result equals `decodeString` result | `{ text:"2[a3[b]]" }` | `buildSteps(input).result === decodeString("2[a3[b]]")` |
| `T-VIZEX-BSORT` | Bubble sort trace ends on the fully sorted array | `{ values:[5,3,1,4,2] }` | `steps.length > 0`, last step kind is `"done"`, last array is `[1,2,3,4,5]` |
| `T-INT-BSORT` | Viz result equals `bubbleSort` result | `{ values:[5,3,1,4,2] }` | `buildSteps(input).result` deep-equals `bubbleSort([5,3,1,4,2])` |

### Visualization step-detail descriptors (per exercise)

Each exercise's `createViz` exposes `describeStep(stepIndex)` returning a
`StepDescriptor` (`{ key, params }`) for steps that have a log row, or `null` for
the initial state (step 0). The shared controller resolves `key` against the
exercise's `stepMessages` (in `exercises.json`) for the current language and
interpolates `params`, building one log row per advanced step.

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-DESC-BS` | Binary search describes the initial, comparison and found steps | `{ values:[1,3,5,7,9], target:7 }` | `describeStep(0) === null`; step 1 key `compareGreater` with `mid:5`; last step key `found` with `index:3` |
| `T-DESC-LL` | Linked list describes prepending each node | `{ values:[4,2,7] }` | `describeStep(0) === null`; step 1 key `prepend` with `value:4`; one descriptor per node |
| `T-DESC-BST` | BST describes visiting each node in order | `{ values:[5,3,7,1,4] }` | `describeStep(0) === null`; step 1 key `visit` with `value:1`; one descriptor per node |
| `T-DESC-DS` | Decode string describes each character action | `{ text:"2[a]" }` | `describeStep(0) === null`; step 1 key `readDigit`; the `[` step key `openGroup`; the `]` step key `closeGroup`; one descriptor per character |
| `T-DESC-BSORT` | Bubble sort describes each comparison and pass | `{ values:[5,3,1,4,2] }` | `describeStep(0) === null`; step 1 key `swap` with `left:5, right:3`; last step key `done` |

### Visualization step engine (per exercise)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-VIZ-01` | Step engine initializes at step 0 | Any exercise config | `currentStep === 0` |
| `T-VIZ-02` | Step forward increments step | At step 0, total 5 steps | `currentStep === 1` |
| `T-VIZ-03` | Step forward at last step does not overflow | At step 4, total 5 steps | `currentStep === 4` (clamped) |
| `T-VIZ-04` | Step back decrements step | At step 2 | `currentStep === 1` |
| `T-VIZ-05` | Step back at step 0 does not underflow | At step 0 | `currentStep === 0` (clamped) |
| `T-VIZ-06` | Reset returns to step 0 | At step 3 | `currentStep === 0` |

### Export / Import

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-EXP-01` | Export serializes all state keys | Full state object | JSON string with all 3 keys |
| `T-EXP-02` | Export includes code-block state when present | State with `algo_code_open` | JSON string contains `algo_code_open` |
| `T-IMP-01` | Valid import restores all state | Valid export JSON | All state keys restored |
| `T-IMP-02` | Import with missing key fails validation | JSON missing `algo_prefs` | Error result, no state change |
| `T-IMP-03` | Import with wrong types fails | `algo_learned` as number | Error result, no state change |
| `T-IMP-04` | Import without `algo_code_open` still succeeds | JSON missing only `algo_code_open` | Ok result, other keys restored |
| `T-IMP-05` | Import with invalid `algo_code_open` fails | `algo_code_open` with non-boolean value | Error result, no state change |

---

## Implementation Stages

Stages are executed in strict order. Claude Code stops after each stage and waits for developer authorization to proceed.

---

### Stage 1 — Infrastructure (CDK)

**Scope:** Create the `infra/` CDK project only. No frontend code.

**Deliverables:**

- CDK app with a single stack: `AlgoDsaStack`
- S3 bucket (private, versioning enabled, no public access)
- CloudFront distribution (OAC, HTTPS-only, default root object `index.html`, custom error for 404 → `404.html` with 200 status for SPA routing)
- Route 53 A + AAAA alias records pointing subdomain to CloudFront (subdomain read from `.env`)
- ACM certificate created and DNS-validated by CDK against the hosted zone (no external ARN required)
- All resource names derived from constants, no hardcoded strings
- `infra/.env.example` documenting all required variables
- `infra/README.md` with deploy instructions

**GitHub Action:** `.github/workflows/deploy-infra.yml` — triggered manually; runs `cdk deploy`

**Constraints:**

- Domain and AWS account values must come exclusively from environment variables
- No frontend assets are deployed in this stage

---

### Stage 2 — Frontend dependency installation

**Scope:** Initialize the `frontend/` Astro project and install all dependencies. No application code.

**Deliverables:**

- `frontend/` Astro project scaffolded (TypeScript strict mode)
- Dependencies installed: Astro, Vitest, TypeScript
- `frontend/.env.example` documenting all required variables
- Folder structure created (empty, with `.gitkeep` where needed):
  ```
  frontend/src/
  ├── components/
  ├── data/
  ├── exercises/
  │   ├── binary-search/
  │   ├── linked-list/
  │   └── binary-tree/
  ├── i18n/
  ├── layouts/
  ├── lib/
  │   ├── constants/
  │   ├── storage/
  │   ├── validation/
  │   └── viz/
  ├── pages/
  │   ├── exercise/
  │   └── library/
  └── styles/
  ```
- Vitest config pointing to `src/**/*.test.ts`
- `tsconfig.json` with strict settings
- `frontend/.github/workflows/deploy-frontend.yml` — on push to `main`: build → S3 sync → CloudFront invalidation (reads deployment values from GitHub Actions secrets)

**No application code is written in this stage.**

---

### Stage 3 — Failing unit tests

**Scope:** Write all unit tests defined in this spec. All tests must fail at this stage (no implementation exists yet).

**Files created:**

- `src/lib/validation/__tests__/localStorage.test.ts` — T-LS-*
- `src/lib/validation/__tests__/userInput.test.ts` — T-INP-*
- `src/i18n/__tests__/i18n.test.ts` — T-I18N-*
- `src/data/__tests__/exercises.test.ts` — T-REG-* (incl. T-REG-07)
- `src/lib/__tests__/filters.test.ts` — T-FILT-*, T-SEARCH-*
- `src/lib/__tests__/progress.test.ts` — T-PROG-*
- `src/lib/__tests__/exportImport.test.ts` — T-EXP-*, T-IMP-*
- `src/lib/viz/__tests__/stepEngine.test.ts` — T-VIZ-*
- `src/exercises/binary-search/__tests__/exercise.test.ts` — T-ALG-BS-*
- `src/exercises/binary-search/__tests__/viz.test.ts` — T-VIZEX-BS, T-INT-BS, T-DESC-BS
- `src/exercises/linked-list/__tests__/exercise.test.ts` — T-ALG-LL-*
- `src/exercises/linked-list/__tests__/viz.test.ts` — T-VIZEX-LL, T-INT-LL, T-DESC-LL
- `src/exercises/binary-tree/__tests__/exercise.test.ts` — T-ALG-BST-*
- `src/exercises/binary-tree/__tests__/viz.test.ts` — T-VIZEX-BST, T-INT-BST, T-DESC-BST

**Constraints:**

- No implementation files are created in this stage
- Running `vitest` must report all tests as failing
- No test is modified after this stage without developer authorization

---

### Stage 4 — Implementation

**Scope:** Write all application code that makes the Stage 3 tests pass, plus the full UI.

**Order within this stage (do not skip ahead):**

1. **Constants and enums** — `ExerciseCategory`, `ExerciseLevel`, `Theme`, `Language`, `ViewMode`, `StorageKey`, `AUTO_PLAY_INTERVAL_MS`
2. **i18n module** — `en.json`, `es.json` (all keys for the 3 exercises + UI), resolve function
3. **Exercise data** — `exercises.json` with 3 entries; validate against T-REG-* tests
4. **Validation layer** — localStorage validator, user input validator
5. **Storage module** — read/write/reset wrappers for each localStorage key
6. **Filter and search logic** — pure functions
7. **Progress bar logic** — pure function
8. **Export/Import logic** — serialize/deserialize with validation
9. **Step engine** — generic step engine consumed by each exercise's viz module
10. **Exercise code files** — `exercise.js` for each of the 3 exercises (single exported pure function)
11. **Exercise viz modules** — SVG-based step visualizers for each exercise (pure `buildSteps` + SVG render, isolated per exercise)
12. **Astro layouts** — base layout with theme, language, header, footer
13. **Home page** — exercise list, filters, search, progress bar, view toggle
14. **Exercise page** — `[slug].astro`, visualization, controls, code block, learned toggle, custom input
15. **Library page** — reference list with cross-references
16. **Settings panel** — theme toggle, language switcher, export/import
17. **404 page**
18. **CSS** — custom properties for both themes, typography, component styles; no CSS framework

**After each sub-step, run `vitest`. Proceed only when all tests that cover that sub-step pass.**

---

### Stage 5 — Documentation

**Scope:** Generate `claude.md` and `readme.md`. No code changes.

#### `claude.md` — focus: Claude Code working instructions

Must include:

- Project overview (one paragraph)
- Working style rules (from the top of this spec)
- Directory map with purpose of each folder
- How to add a new exercise (step-by-step):
  1. Add entry to `exercises.json` (all required fields, new ID, `isNew: true`)
  2. Add i18n keys to `en.json` and `es.json`
  3. Create `src/exercises/<id>/` folder
  4. Create `exercise.js` (a single exported pure function, named after the exercise)
  5. Create `viz.ts` (pure `buildSteps` + SVG render implementing the shared `ExerciseViz` interface)
  6. Create `__tests__/exercise.test.ts` (the exported function) and `__tests__/viz.test.ts` (step model + integration: viz result equals the exercise function) satisfying Gherkin scenarios
  7. Run `vitest` — all new tests must pass
  8. Confirm no other tests broke
- How to update an i18n string
- How to add a new category or level (including enum update + i18n key)
- Security checklist for any code change
- Environment variable reference

#### `readme.md` — focus: developer setup and deployment

Must include:

- Project description
- Prerequisites
- Local development setup (frontend + infra)
- Environment variables setup
- Running tests
- Deploying infra (CDK)
- Deploying frontend (GitHub Actions)
- Adding new exercises (brief, refers to `claude.md` for detail)

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2025-01-01 | SVG + TypeScript (no D3) for visualizations | Keeps bundle lean; each exercise encapsulates its own SVG rendering; D3 can be added per-exercise if complexity requires it |
| 2025-01-01 | LeetCode-style levels (Easy / Medium / Hard) | Familiar to target audience (developers practicing for interviews/growth) |
| 2025-01-01 | No backend, localStorage only | Eliminates auth complexity; export/import covers multi-device use case |
| 2025-01-01 | Domain and all sensitive config in `.env` only | Hardcoding domains in source is a deployment anti-pattern; prevents accidental commits of environment-specific values |
| 2025-01-01 | Astro SSG (static generation) | No server required; deploys to S3/CloudFront natively; all dynamism is client-side JS |
| 2025-01-01 | All user-visible text in i18n JSON | Enables language switching without page reload; single source of truth for EN/ES |
| 2025-01-01 | Each exercise is fully isolated (own folder, own viz, own tests) | Prevents regression when adding exercises; each can evolve independently |
| 2026-06-18 | CDK creates and DNS-validates the ACM certificate (removed `CERTIFICATE_ARN`) | Eliminates manual cert provisioning; CDK handles validation automatically via the hosted zone; cert lifecycle is managed as part of the stack |
| 2026-06-18 | Added `HOSTED_ZONE_NAME` as a separate env var from `DOMAIN_NAME` | The hosted zone is for the apex domain (e.g. `example.com`) while `DOMAIN_NAME` is the subdomain (e.g. `algo.example.com`); using `DOMAIN_NAME` as `zoneName` was a bug |
| 2026-06-18 | GitHub Actions workflows moved to repo-root `.github/workflows/` | GitHub only recognizes workflows at the repository root; `frontend/.github/` and `infra/.github/` are not picked up |
| 2025-01-01 | 14 categories including additions (Sorting, Searching, Hashing, DP, Recursion, Bit Manipulation, Heaps) | Covers all major CS interview and learning topic areas |
| 2025-01-01 | Seed set: Binary Search, Linked List, Binary Search Tree | Covers 3 distinct visualization archetypes (linear array, node chain, tree graph) to validate the full component system |
| 2026-06-17 | Added `LearnedStatus` enum (`ALL` / `LEARNED` / `UNLEARNED`) | The "Filter by status" feature needs three discrete states; declaring them as an enum honors the "no magic strings" rule and is shared by the filter logic, tests, and home UI |
| 2026-06-17 | i18n module and its test live in `src/i18n/` (not `src/lib/i18n/`) | The Data Model, Folder Structure, and UI Features sections all reference `/src/i18n/`; the single Stage 3 path mention of `src/lib/i18n/` was an inconsistency. Resolved in favor of the majority references. Confirmed with the developer |
| 2026-06-17 | Pinned Astro `^6.4.8` and Vitest `^4.1.9` (latest stable) instead of older majors | `npm audit` flagged high-severity XSS in Astro 5 and a critical in the Vitest 2 UI server; adopting the latest patched majors removed all high/critical advisories while no app code existed yet |
| 2026-06-17 | Test files excluded from `astro check` / `tsc` type gate via `tsconfig` `exclude` | The authoritative test gate is Vitest (esbuild transform, no type-check), which passes. A few type-only annotations in spec-faithful tests (string literals vs enums, nullable BST root) are valid at runtime; excluding tests avoids modifying them (forbidden without authorization) while keeping `astro check` clean for shipped code |
| 2026-06-17 | GitHub Actions runners use Node 24 | Matches the local development Node version; requested by the developer |
| 2026-06-17 | Each exercise file (`exercise.js`, renamed from `algorithm.js`) exports exactly one pure function | The exported function is the copy-paste artifact shown to the user; it must be a clean, idiomatic reference implementation that takes input and returns the natural result — no step trace, no expected-result or config parameters. Internal helpers stay private. Named after the exercise's algorithm/structure (`binarySearch`, `reverseLinkedList`, `binarySearchTreeInorder`) |
| 2026-06-17 | Step trace moved out of `exercise.js` into `viz.ts` as a pure `buildSteps(input)` separated from SVG rendering | Keeps the copyable function pristine and lets the step model be unit-tested in Node without a DOM. Testing splits into three: the exported function, the viz step model, and an integration test asserting `buildSteps(input).result` equals the exercise function's result |
| 2026-06-18 | Exercise-specific text (name, description, link labels) stored inline as `{ en, es }` (`LocalizedText`) in `exercises.json`, not as keys in `en.json`/`es.json` | Co-locates each exercise's text with its data so adding an exercise touches one file; `en.json`/`es.json` keep only general UI text. Client language switching for these uses `data-loc-en`/`data-loc-es` attributes resolved via `textContent`. Refines the i18n rule: user-visible text lives in JSON (UI in i18n files, exercise text in `exercises.json`) |
| 2026-06-19 | Shared exercise I/O generalized from integer-array-only to also support text exercises via an `InputKind` enum (`NUMBERS` default, `STRING`) | The seed model assumed every exercise's input/output was `number[]` (`VizInput.values`, `Exercise.defaultInput`, `SavedInput.value`, integer-only parsing/validation). The `decode-string` exercise is intrinsically text (`string` in, `string` out) and did not fit. Rather than encode characters as numbers (which would break the "trivially copyable" `exercise.js` and the human-readable description), the contract was widened minimally and backward-compatibly: `VizInput` gains an optional `text?: string`, `ExerciseViz.result`/`Exercise.defaultInput`/`SavedInput.value` accept `string`, a `parseEncodedString` validator + `validateInputs` string branch keep the security schema, and the shared controller branches on `inputKind`. Numeric exercises are untouched (`inputKind` defaults to `NUMBERS`). Authorized by the developer before implementation |
| 2026-06-19 | Added `decode-string` exercise (category `TEXT`, level `MEDIUM`) | First text exercise; validates the string-I/O generalization. Decodes the `n[substring]` run-length format with nesting via an explicit count/string stack — a distinct visualization archetype (scanning cursor + stack) versus the existing array/list/tree ones |
| 2026-06-20 | Added a global "About" informational modal (header info button) explaining the platform's goal and study recommendations | The site reveals each exercise's source code, but the learning objective is for the user to practice and genuinely understand the algorithm, not just copy it. A short bilingual, multi-paragraph modal makes that intent explicit. It mirrors the existing `SettingsPanel` modal pattern (`AboutPanel.astro`, opened from a header button, wired in `globalInit.ts`, included in `BaseLayout`). Its text is general UI copy, so it lives as keys under `about.*` in `en.json`/`es.json` (multi-paragraph = one key per paragraph/list item, switched via `data-i18n`) |
| 2026-06-20 | Code block on the exercise page is collapsible (Expand/Collapse button next to Copy), collapsed by default, with the expanded/collapsed state persisted per exercise in a new `algo_code_open` localStorage key (`Record<id, boolean>`) and included in export/import | Reinforces the platform's learning goal (2026-06-20 About modal): revealing the source should be a deliberate act, so the answer stays hidden until the user chooses to see it. State is per-exercise (not a global pref), so it gets its own key rather than living in `algo_prefs`; it follows the same validated-storage pipeline (`validateCodeOpen`, `read/writeCodeOpen`) as the other keys. To stay backward-compatible, `algo_code_open` is the only export key that is optional on import — older files lacking it still import cleanly, but when present it must validate (boolean values keyed by known exercise IDs). Default collapsed is rendered server-side (`is-collapsed` class in `[slug].astro`) to avoid a flash, then reconciled with stored state on load. Authorized by the developer before implementation |
| 2026-06-19 | Per-step detail log rendered next to each viz; messages composed from a `describeStep(stepIndex)` descriptor (`{ key, params }`) on the viz plus a `stepMessages` template map in `exercises.json` | Adds a step-by-step legend table that grows/shrinks with playback (derived purely from the current step index — no mutating DOM state — mirroring how `renderStep` paints by index). The *which message + values* logic is custom per exercise (in `viz.ts`), while the *bilingual text* stays co-located with the exercise data (`stepMessages` in `exercises.json`), consistent with the 2026-06-18 decision. The shared controller resolves the template for the active language and interpolates `params`, building rows `0..currentStep`. The vestigial optional `caption?` on `ExerciseViz` is replaced by the required `describeStep`. Log row chrome (the "Step N →" prefix, panel title) lives in `en.json`/`es.json` as general UI text |
| 2026-06-21 | Added `serialCode` field to the exercise registry: a four-part internal classification string `TYPE–STRUCT–OBJ–VAR` (e.g. `SRCH-ARR-FIND-BIN`) | As the exercise set grows, variants of the same algorithm on different data structures (e.g. remove-duplicates on singly vs. circular linked list) need a machine-readable way to be grouped and distinguished. The `id` remains the unique key; `serialCode` identifies the *class*. It is internal only (not shown in the UI), stored as a plain string (no enum — the table of valid values lives in `spec.md § Serial Code Nomenclature`), and coexists with the existing `category` filter without replacing it. Duplicate serials are allowed but must be flagged and reviewed. The `id`, `slug`, and `name` of each exercise must be unique and allusive to the serial so the taxonomy is self-evident from the registry |
| 2026-06-21 | Per-step code-line highlighting: the active step marks the source line(s) that "execute" in that step, in both the JS and pseudo-code blocks | Reinforces the learning goal by connecting the visualization to the code. The "which lines" logic is custom per exercise and lives in `viz.ts` as a **required** `codeLines(stepIndex): CodeLines \| null` method on `ExerciseViz` (`CodeLines = { js, pseudo }`, 1-based line numbers; `pseudo` is empty when the exercise has no `pseudoFile`). The shared controller reads it inside the single `render()` choke point and toggles an `is-executing` class on the `.line` spans Shiki already emits (and already numbers via a CSS counter). Decisions from the developer: step 0 highlights nothing; a step may highlight **non-contiguous** lines (it answers "what happens in this step", not a debugger breakpoint); the highlight is applied to both code blocks regardless of which is visible and regardless of the collapsed/expanded state (no auto-expand, no scroll — revealing the code stays the user's deliberate act per the 2026-06-20 decision). Prototyped on binary-search, then rolled out to all exercises and made a required part of the contract; a `viz.test.ts` check asserts every step's lines are in range and step 0 is `null`. Since the viz step model is an abstraction of the algorithm (not a line-by-line trace), each step maps to the line(s) that best express what it does; mappings are maintained by hand alongside the source files |
| 2026-06-22 | Added `quicksort` exercise (category `SORTING`, level `MEDIUM`, serial `SORT-ARR-ORD-STD`) | First sorting exercise; validates the sorting visualization archetype. Implements divide-and-conquer quicksort with Lomuto partitioning (last element as pivot) over an integer array — `quickSort(arr) => number[]` sorted ascending, reusing the existing `number[]` I/O contract (no new `InputKind`). A distinct visualization archetype: a value-scaled **bar chart** whose bars are re-ordered as swaps happen, colored by per-step role (pivot / smaller-than-pivot / larger-than-pivot / placed-sorted / unprocessed / comparing), with the partition narration carried by the localized step-detail log. Introduces five additive `--viz-*` color tokens (`--viz-pivot`, `--viz-less`, `--viz-greater`, `--viz-compare`, `--viz-sorted`) in both themes for the new roles; existing exercises are untouched. All serial segments already existed in the nomenclature tables (no new codes); `SORTING` category and its i18n/label plumbing already existed |
| 2026-06-23 | Added `VAL` to the OBJ segment of the serial nomenclature: "Validate / check a property (returns a boolean verdict)" | The existing OBJ codes (`FIND`, `DEDUP`, `REM`, `REV`, `ORD`, `DEC`, `MAX`, `CNT`, `MRG`, `XPOS`) all describe producing or reshaping data; none captures an exercise whose objective is to *decide a yes/no property* of the input. The `valid-parentheses` exercise returns a boolean, so a dedicated objective code was needed rather than misclassifying it. Approved by the developer before any code was written |
| 2026-06-23 | Added `valid-parentheses` exercise (category `TEXT`, level `EASY`, serial `COMP-STR-VAL-STD`) | Validates that the brackets `()`, `[]` and `{}` in a string are balanced and correctly nested, ignoring any non-bracket characters; returns `true`/`false`. First boolean-result exercise and first to use the new `VAL` objective. **Input:** a new `InputKind.BRACKETS` was added rather than reusing `STRING`, because the `STRING` validator (`parseEncodedString`, built for `decode-string`'s `n[substring]` format) only accepts square brackets and *requires them to be balanced* — directly contradicting an exercise whose whole purpose is to accept arbitrary, possibly-unbalanced `()[]{}`. `BRACKETS` shares the entire text path with `STRING` (raw text in `VizInput.text`, quoted display, string-result handling) and differs only in its validator (`parseBracketString`: whitelist of letters/digits/spaces/`()[]{}`, no balance requirement) and its placeholder/error i18n keys; `isStringInput` checks were generalized from `=== STRING` to `!== NUMBERS`. **Output:** `ExerciseViz.result` (and the controller's `formatValue`) were widened from `number | number[] | string` to also accept `boolean` (rendered as `true`/`false`), the minimal extension to the 2026-06-19 string-I/O generalization. The visualization is a scanning cursor over the input plus a live stack of pending opening brackets (a distinct "stack-matching" framing of the existing scan-with-stack archetype seeded by `decode-string`); the per-step log narrates push / match / mismatch / ignore. Introduces one additive `--viz-invalid` (red) color token in both themes for the mismatch/unbalanced role, reusing `--viz-found` (green) for matches; existing exercises are untouched |
| 2026-06-23 | Added `AVG` to the OBJ segment of the serial nomenclature: "Average / mean (compute the arithmetic mean of values)" | The existing OBJ codes describe finding, reshaping, counting, ordering or validating data; none captures an exercise whose objective is to *compute an average*. The `running-average` exercise produces per-window arithmetic means, so a dedicated objective code was needed rather than misclassifying it as `CNT` (count). Approved by the developer before any code was written |
| 2026-06-23 | Added `running-average` exercise (category `GENERAL`, level `EASY`, serial `COMP-ARR-AVG-STD`) | First sliding-window exercise and first to use the new `AVG` objective. Computes the average of every consecutive window of size `w` over an integer array, rounded to 2 decimals — `runningAverage(arr, w) => number[]`. The key teaching point is the **O(n)** running sum: rather than re-summing each window, it keeps a running total and on each slide adds the entering value and subtracts the leaving one. **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind); the window size `w` rides on the existing optional numeric second parameter (`defaultTarget` + the generic target field, validated as an integer by `parseIntegerTarget`). Per developer decision the input stays integers-only (no float validator); the *output* may be fractional because of the averaging formula. **Output:** a `number[]` of per-window averages (reusing the existing array-result formatting); `[]` when `w` exceeds the array length or is not positive, and a single average when `w` equals the length. The visualization reuses the linear-array archetype (seeded by `binary-search`) with a highlighted sliding window plus a live sum/average readout, narrated by the per-step log (first window vs. each slide). No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`); existing exercises are untouched |
| 2026-06-23 | Added `FREQ` to the OBJ segment of the serial nomenclature: "Most frequent / top-k by frequency (mode)" | The existing OBJ codes describe finding a single element/extreme (`FIND`, `MAX`), counting occurrences (`CNT`), ordering, reshaping, validating or averaging data; none captures an exercise whose objective is to *select the k most frequent values* (the top-k modes). `CNT` (count occurrences) names the intermediate frequency tally, not the selection that is the actual result, and `MAX` is a single extreme — so a dedicated objective code was needed rather than misclassifying it. Approved by the developer before any code was written |
| 2026-06-23 | Added `top-k-frequent` exercise (category `HASHING`, level `MEDIUM`, serial `SORT-ARR-FREQ-STD`) | First exercise using the new `FREQ` objective and the first to demonstrate **bucket sort**. Returns the `k` most frequent values of an integer array ordered by descending frequency — `topKFrequent(arr, k) => number[]` — in **O(n)**: count each value's frequency in a hash map, scatter values into buckets indexed by their frequency, then read the buckets from the highest frequency down until `k` values are collected. **Classification rationale:** the topical *category* is `HASHING` (the frequency map is the conceptual core, per the developer's choice), while the serial *TYPE* segment is `SORT` because the technique that achieves O(n) is bucket sort (the explicit teaching point); the two dimensions are independent by design, so this is intentional, not a misclassification. **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind); `k` rides on the existing optional numeric target field (`defaultTarget` + `VizInput.target`), exactly as `running-average`'s window size does. **Output:** a `number[]` of the top-k values (reusing the existing array-result formatting); `[]` for empty input, and every distinct value when `k` ≥ the number of unique values. Edge cases (`k` equal to / greater than the unique count, all-equal frequencies → any tie order valid) follow the source problem. The visualization is a new three-zone archetype — input array with a counting cursor, the live frequency map (the hash table), and buckets indexed by frequency feeding a result strip — narrated phase-by-phase (count / bucket / collect) by the per-step log. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-06-23 | Added `InputKind.MATRIX` — a fourth input kind for exercises whose natural input is a 2D integer matrix | The seed I/O model was integer-array (`NUMBERS`) or text (`STRING`/`BRACKETS`, both carried in `VizInput.text`); neither fits a 2D matrix. Rather than flatten the matrix into a 1D array (which would break the "trivially copyable" `exercise.js` and the human-readable description) or encode it as text (which would leave the input panel without real 2D validation), the contract was widened with a genuine third input shape: `VizInput` gains an optional `matrix?: readonly (readonly number[])[]`, `Exercise.defaultInput` and `SavedInput.value` accept `number[][]`, a `parseIntegerMatrix` validator (JSON array of equal-length integer rows, non-empty, total cells within the existing `MAX_INPUT_LENGTH`) keeps the security schema, the localStorage saved-input validator accepts a bounded integer matrix, and the shared controller branches three ways (numbers / text / matrix) for display, apply, save and load. The `[slug].astro` input panel adds a matrix placeholder and hides the numeric target field for matrix exercises (as it already does for text). The result type is unchanged (the first matrix exercise returns `number[]`). `inputKind` still defaults to `NUMBERS`, so every existing exercise is untouched. Authorized by the developer before implementation |
| 2026-06-23 | Added `matrix-spiral` exercise (category `MATRICES`, level `MEDIUM`, serial `TRAV-MAT-ORD-RCT`) | First `MATRICES` exercise and first to use `InputKind.MATRIX`. Returns all elements of an N×M integer matrix in clockwise spiral order starting from the top-left corner — `spiralOrder(matrix) => number[]` — by shrinking four boundary pointers (top/bottom/left/right) inward, walking the top row, right column, bottom row and left column in turn. Edge cases follow the source problem: empty matrix → `[]`, single row left-to-right, single column top-to-bottom, 1×1 → that element. **Classification:** the serial reuses the existing `ORD` objective (the spiral is the matrix's traversal order, analogous to the BST in-order `TRAV-TREE-ORD-BST`) over the new `MAT` struct with the `RCT` (rectangular, general N×M) variant — no new serial segment was invented (developer chose `ORD` over adding a dedicated code). The visualization is a new grid archetype: each step lights up the next cell in spiral order over a row×column grid, shading already-visited cells and numbering them with their 1-based spiral position, narrated cell-by-cell by the per-step log. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-06-29 | Added `bubble-sort` exercise (category `SORTING`, level `EASY`, serial `SORT-ARR-ORD-STD` — intentional duplicate of `quicksort`: two difficulty tiers of comparison-based array sort) | First EASY sorting exercise; visual companion to quicksort that demonstrates the simpler O(n²) adjacent-swap approach versus quicksort's O(n log n) divide-and-conquer. Reuses the existing SORTING category and bar-chart archetype. Step model: one step per adjacent comparison (`compare`/`swap`), one per completed pass (`pass`), and a terminal `done` step. Bar role `Bubble` uses `--viz-pivot` (reuses existing token; no new CSS variable needed) to color the larger element that just bubbled right. Early-exit optimization (break when no swaps in a pass) is visible in the step log via the `pass` step showing swapped=false |
| 2026-06-30 | Added `merge-sort` exercise (category `SORTING`, level `MEDIUM`, serial `SORT-ARR-ORD-STD` — intentional triplicate of `quicksort`/`bubble-sort`: third comparison-based array sort, each with a distinct visualization archetype) | Divide-and-conquer merge-sort: splits the array in half, recursively sorts each half, then merges the two sorted halves by comparing front elements one at a time. Step model: one step per element placed during a merge (`takeLeft`/`takeRight`/`flushLeft`/`flushRight`) plus a terminal `done` step. Six bar roles (Unprocessed, Left, Right, InMerge, Placed, Sorted) reuse all existing `--viz-*` color tokens — no new CSS variables, no new serial segments, no new `InputKind`. Builds on the existing bar-chart archetype |
| 2026-06-21 | Added optional `pseudoFile` field to the exercise registry and a JS/Pseudo-code mode switcher on the exercise page | The pure-JS `exercise.js` is the source of truth (tested, copyable) and stays unchanged. When an exercise declares `pseudoFile` (path to `exercise.pseudo`, a plain-text file), the code section renders a button group (JS / Pseudo-code) that swaps the visible block. The Copy button always copies whichever block is currently visible. Exercises without a `pseudoFile` are unaffected (no switcher rendered). The pseudo-code file is editorial content only — never executed, never tested. A new `CodeMode` enum (`JS` / `PSEUDO`) in `enums.ts` labels the two modes. Two i18n keys (`exercise.codeJs`, `exercise.codePseudo`) carry the button labels in EN/ES |
| 2026-07-01 | Added `two-sum` exercise (category `HASHING`, level `EASY`, serial `SRCH-HASH-FIND-STD`) | First exercise using the `HASH` struct code in the serial nomenclature. Given an integer array and a target, returns the indices of the two values that add up to the target — `twoSum(arr, target) => number[]` — in O(n): scans once, keeping a hash map from each value seen so far to its index, and at each element checks whether the map already holds its complement (`target - value`); if so the pair is returned immediately, otherwise the current value is recorded and the scan continues. Edge cases follow the source problem: no such pair → `[]`, and duplicate values may form the pair (e.g. `[3, 3]`, target `6` → `[0, 1]`). **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind); the target rides on the existing optional numeric target field (`defaultTarget` + `VizInput.target`), exactly as `running-average`'s window size and `top-k-frequent`'s `k` do. **Output:** a `number[]` pair (or `[]`), reusing the existing array-result formatting. The visualization is a two-zone archetype — the input array with a scanning cursor, and the live hash map (value → index) it builds — narrated step-by-step (check complement / found / insert / done with no pair) by the per-step log, extending the map-visualization pattern first seeded by `top-k-frequent`. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-02 | Added `InputKind.TEXT` — a third text input kind, for exercises over unrestricted free-form text (no bracket/run-length structure) | Neither existing text kind fits generic text exercises: `STRING` (`parseEncodedString`) is decode-string's `n[substring]` run-length format (only letters/digits/balanced `[]`), and `BRACKETS` (`parseBracketString`) is scoped to bracket-validation exercises (its name and i18n copy describe bracket checking). `reverse-string` and the queued `palindrome-check` both need arbitrary short text with no structural constraint. `TEXT` shares the entire text path seeded by the 2026-06-19 decision (raw text in `VizInput.text`, quoted display, string-result handling, generic saved-input string validation) and differs only in its validator (`parseFreeText`: whitelist of letters, digits, spaces and the common punctuation `.,!?'-`, no balance/bracket requirement) and its `inputPlaceholderText`/`invalidInputText` i18n keys. The shared `isTextInput` check in `controller.ts` widens from `STRING \|\| BRACKETS` to include `TEXT`, and `[slug].astro`'s placeholder-key chain gains a `TEXT` branch. `isValidSavedInput` needs no change (it already accepts any bounded string regardless of kind). `inputKind` still defaults to `NUMBERS`, so every existing exercise is untouched. Authorized by the developer before implementation |
| 2026-07-02 | Added `reverse-string` exercise (category `TEXT`, level `EASY`, serial `XFRM-STR-REV-STD`) | First exercise using the new `InputKind.TEXT` and the first `XFRM` (transformation) entry over `STR`. Reverses the character order of a string — `reverseString(str) => string` — via the classic two-pointer swap: pointers start at both ends and walk inward, swapping the characters at each position until they meet or cross. Edge cases follow the source problem: empty string → `""`, single character → itself unchanged. **Input:** `InputKind.TEXT` (see the kind's own decision above); default input `"hello"`. **Output:** the reversed `string`, reusing the existing string-result formatting from the 2026-06-19 decision. The visualization is a new two-pointer-over-characters archetype — a row of character cells with left/right pointer markers that swap-and-converge each step, narrated by the per-step log (`swap`/`meet`/`done`), distinct from the existing scan-cursor (decode-string, valid-parentheses) and bar-chart (sorts) archetypes. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-03 | Added `palindrome-check` exercise (category `TEXT`, level `EASY`, serial `COMP-STR-VAL-STD` — intentional duplicate of `valid-parentheses`: both are boolean-verdict `VAL` checks over `STR`, but via different techniques and over different properties) | Second exercise using `InputKind.TEXT` (seeded by the 2026-07-02 decision). Checks whether a string reads the same forwards and backwards — `isPalindrome(s) => boolean` — via the same two-pointer walk as `reverse-string`, but comparing instead of swapping: pointers start at both ends and step inward while the characters they point to match; the first mismatch short-circuits the scan and returns `false` immediately, and if the pointers meet or cross without a mismatch the string is a palindrome. Case-sensitive, exact-character comparison (no normalization of case/whitespace/punctuation) to keep it the direct two-pointer counterpart of `reverse-string` at the same EASY level. Edge cases follow the source problem: empty string → `true`, single character → `true`. **Input:** `InputKind.TEXT`; default input `"racecar"`. **Output:** `boolean`, reusing the existing boolean-result handling seeded by `valid-parentheses` (2026-06-19). The visualization reuses `reverse-string`'s two-pointer-over-characters archetype (character cells, `L`/`R` pointer markers) but recolors it for validation instead of transformation: matched pairs shade `--viz-found`, the active comparison shades `--viz-mid`, and a mismatch shades `--viz-invalid` (reusing `valid-parentheses`'s verdict color) and ends the walk immediately. Step log keys: `match` / `mismatch` / `doneMiddle` / `doneCrossed`. No new `--viz-*` color tokens, no new `InputKind`; existing exercises are untouched |
| 2026-07-06 | Added `NUM` to the STRUCT segment of the serial nomenclature: "Scalar / single number (no aggregate data structure)" | Every existing STRUCT code (`ARR`, `LIST`, `TREE`, `GRPH`, `MAT`, `STR`, `HEAP`, `HASH`, `STCK`, `QUE`) names an aggregate data structure the algorithm walks or builds. `fibonacci` operates over neither — its input is a single integer `n` and its output is a single integer — so none of the existing codes describe what the algorithm actually touches. Misclassifying it as `ARR` (e.g. to reuse `SRCH-ARR-...`) would misrepresent the exercise's real shape for future classification. A dedicated scalar code was needed instead |
| 2026-07-06 | Added `NTH` to the OBJ segment of the serial nomenclature: "Compute the n-th value of a sequence (e.g. Fibonacci, factorial)" | The existing OBJ codes describe finding, reshaping, counting, ordering, validating, averaging, or frequency-ranking data that already exists in the input; none captures an exercise whose objective is to *generate* the n-th term of a sequence from a scalar index. `fibonacci`'s result isn't found, reshaped, or aggregated from an input collection — it's computed from `n` alone — so a dedicated objective code was needed |
| 2026-07-06 | Added `InputKind.SCALAR` — a fifth input kind for exercises whose natural input is a single integer, not an array, string, or matrix | The seed I/O model assumed every non-text/non-matrix exercise's primary input was `number[]` (`VizInput.values`, `Exercise.defaultInput`/`SavedInput.value` as an array, `parseIntegerArray`). `fibonacci` takes a single integer `n` — wrapping it as a one-element array (`[10]`) would work at the type level but would force the "trivially copyable" `exercise.js` reference (`fibonacci(n)`) to be described and demonstrated through an array-shaped UI, and would show a misleading `[2, 4, 6, 8]`-style placeholder for what is actually one number. Rather than repurpose the existing `target` field (which the UI always renders as a secondary value appended to a primary array/text/matrix input, and reusing it as the sole input would either leave the primary field showing a stray `[]` or double-render the value), the contract was widened with a genuine fourth carrier shape: `VizInput` gains an optional `scalar?: number`, `Exercise.defaultInput` and `SavedInput.value` accept a bare `number`, a new `parseSingleInteger` validator (JSON.parse of a single integer, no array brackets) keeps the security schema, `isValidSavedInput` accepts a bounded integer `value`, and the shared controller gets an `isScalarInput` branch alongside `isTextInput`/`isMatrixInput` for display (`formatInput`), custom-input parsing, and saved-input save/load. `exerciseInit.ts` gains a `SCALAR` branch to build the default `VizInput` from the registry's plain-number `defaultInput`, and `[slug].astro`'s placeholder chain gains `inputPlaceholderScalar` ("e.g. 10"). The numeric target field stays hidden for `SCALAR` exercises exactly as it already is for text/matrix ones (no `defaultTarget`). `inputKind` still defaults to `NUMBERS`, so every existing exercise is untouched. This is shared infra expected to be reused by other queued scalar-input exercises (e.g. `climbing-stairs`) |
| 2026-07-06 | Added `fibonacci` exercise (category `RECURSION`, level `EASY`, serial `RECR-NUM-NTH-STD`) | First `RECURSION`-category exercise and first to use `InputKind.SCALAR`, the new `NUM` struct code, and the new `NTH` objective. Receives a non-negative integer `n` and returns the n-th Fibonacci number (`fib(0) = 0`, `fib(1) = 1`) — `fibonacci(n) => number` — via top-down recursive decomposition (`fib(k) = fib(k-1) + fib(k-2)`) with memoization (a `Map` keyed by `k`) so each sub-problem is solved once, in O(n) time and space instead of the exponential O(2^n) of naive recursion. Edge cases: `n <= 0` returns `0` directly without recursing. **Input:** `InputKind.SCALAR` (see the kind's own decision above); default input `10`. **Output:** `number`, reusing the existing numeric-result formatting. The visualization is a new memo-table archetype: a row of cells for indices `0..n` (reusing the linear-cell archetype seeded by `binary-search`), each showing its cached value once computed; the active index is highlighted by call kind (`call` entering a sub-problem, `base` hitting `k <= 1`, `cacheHit` reusing a memoized value, `compute` combining two already-solved sub-results), narrated by the per-step log with the actual `fib(k-1) + fib(k-2) = value` arithmetic. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-07 | Added `binary-search-rotated` exercise (category `SEARCHING`, level `MEDIUM`, serial `SRCH-ARR-FIND-BIN` — intentional duplicate of `binary-search`: two difficulty tiers of the same search-array-find-binary technique, following the `quicksort`/`bubble-sort`/`merge-sort` precedent for tiered variants of one serial code) | Harder binary-search variant: the input array is sorted but rotated at an unknown pivot (e.g. `[4,5,6,7,0,1,2]`), so a plain `arr[mid] < target` comparison no longer determines which half to keep. `searchRotated(arr, target) => number` still halves the search space each step, but first determines which half (`[lo..mid]` or `[mid..hi]`) is contiguously sorted by comparing `arr[lo]` to `arr[mid]`, then checks whether the target falls within that sorted half's value range to decide whether to search it or the other half. Edge cases follow the source problem: target absent → `-1`, single-element array → itself or `-1`, and an unrotated (already-sorted) array degrades to plain binary search since the "left half" check is always true. **Input:** reuses `binary-search`'s existing `number[]` + `target` contract (`InputKind.NUMBERS`, no new kind); default input `[4, 5, 6, 7, 0, 1, 2]`, default target `0`. **Output:** `number` (index or `-1`), reusing the existing numeric-result formatting. The visualization extends `binary-search`'s linear-cell archetype (array cells, `lo`/`hi`/`mid` range and pointer) with a bracket beneath whichever half is currently known-sorted, using the existing `--viz-sorted` token (already used by the sort exercises for "this range is settled/ordered", semantically consistent here). Step log keys: `searchSortedHalf` (target lies in the known-sorted half, narrow into it) / `skipSortedHalf` (target isn't in the known-sorted half, search the other side) / `found`. No new `--viz-*` color tokens, no new `InputKind`; existing exercises are untouched |
| 2026-07-07 | Fixed `binary-search-rotated`: added a terminal `notFound` step for the miss case | Developer feedback: when the target is absent, the trace previously ended on the last `skipSortedHalf`/`searchSortedHalf` message, which reads as "still narrowing" even though the search is actually exhausted (`lo > hi`, returning `-1`) — misleading, since the step log never states the target wasn't found. Fixed by pushing one extra terminal step (`BsrStep.notFound: true`, `mid: -1`) after the loop in `buildSteps` whenever `result === -1`, mirroring the existing `two-sum` precedent (its `done` step for the no-pair case). `describeStep` returns a new `notFound` key with `{ target }`; `codeLines` highlights the loop condition and the final `return -1` line (`js: [14, 35]`, `pseudo: [5, 22]`); `renderStep` needs no change since `mid: -1` already suppresses the mid pointer and sorted-half bracket. New `stepMessages.notFound` entry added to both `en`/`es`. Authorized by the developer as a direct bug-fix report |
| 2026-07-07 | Added `WAYS` to the OBJ segment of the serial nomenclature: "Count the number of distinct ways to reach an outcome (combinatorial path counting)" | `climbing-stairs` counts the number of distinct step sequences that reach the top, computed purely from a scalar `n` — the same "generated from a scalar, not aggregated from an input collection" shape that justified `NTH` on 2026-07-06. `CNT` doesn't fit for the identical reason `FREQ`'s decision (2026-06-23) already ruled out: `CNT` names counting occurrences of values that already exist in an input collection, not generating a combinatorial count from a single index. A dedicated objective code was needed rather than misclassifying it as `CNT` |
| 2026-07-07 | Added `climbing-stairs` exercise (category `DYNAMIC_PROGRAMMING`, level `EASY`, serial `DYNA-NUM-WAYS-STD`) | First `DYNAMIC_PROGRAMMING`-category exercise and first to use the new `WAYS` objective, reusing `InputKind.SCALAR` and the `NUM` struct code seeded by `fibonacci` (2026-07-06), which flagged `climbing-stairs` as the next queued scalar-input candidate. Receives a non-negative integer `n` (number of stairs) and returns the number of distinct ways to reach the top taking 1 or 2 steps at a time — `climbingStairs(n) => number` — via **bottom-up** dynamic programming: `ways(n) = ways(n-1) + ways(n-2)`, built iteratively from the base cases `ways(0) = ways(1) = 1` in O(n) time and O(1) extra space (two rolling variables, no recursion, no memo `Map`). This is the deliberate DP counterpart to `fibonacci`'s top-down recursive-with-memoization technique: same underlying recurrence shape, opposite technique, distinguishing `DYNA` from `RECR` in the serial nomenclature by how the sub-problems are actually solved (iterative tabulation vs. recursive decomposition), not just by category label. Edge cases: `n <= 1` returns `1` directly (base case: a staircase of 0 or 1 steps has exactly one trivial way). **Input:** `InputKind.SCALAR`; default input `10`. **Output:** `number`, reusing the existing numeric-result formatting. The visualization is a new bottom-up tabulation archetype — a row of cells for indices `0..n` (reusing the linear-cell shape seeded by `fibonacci`'s memo table) filled strictly left-to-right as the loop runs, with no call/cache-hit distinction since there is no recursion: step kinds are `trivial` (n ≤ 1 short-circuit), `base` (seeding index 0 and 1), `compute` (each loop iteration, highlighting the two prior cells it sums), and a terminal `done` step highlighting the final `return`. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-08 | Added `max-subarray` exercise (category `DYNAMIC_PROGRAMMING`, level `MEDIUM`, serial `DYNA-ARR-MAX-STD`) | Second `DYNAMIC_PROGRAMMING`-category exercise (after `climbing-stairs`) and the first over the `ARR` struct, reusing the existing `MAX` objective — all four serial segments already existed in the nomenclature tables, so no new decision was needed there. Receives an integer array and returns the sum of its largest contiguous subarray — `maxSubArray(arr) => number` — via **Kadane's algorithm**: a single O(n) pass that, at each index, decides whether extending the running subarray from the previous index (`currentSum + arr[i]`) beats restarting at the current element alone (`arr[i]`), while a second variable tracks the best sum seen so far independent of the running one. Edge case: an empty array returns `0` directly (no loop runs). **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind, no target); default input `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` (the canonical example, result `6`). **Output:** `number`, reusing the existing numeric-result formatting. The visualization extends the linear-cell archetype (seeded by `binary-search`, reused by `running-average`/`fibonacci`/`climbing-stairs`) with **two** simultaneous highlighted ranges — the running (Kadane) subarray and the best-so-far subarray, which frequently overlap — plus a live `current = X   best = Y` readout; step kinds are `empty` (length-0 guard), `init` (seed from the first element), `extend`/`reset` (the loop body, each with a `*NewMax` variant when the step raises the best sum), and a terminal `done` step highlighting the final `return`. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-09 | Added `coin-change` exercise (category `DYNAMIC_PROGRAMMING`, level `MEDIUM`, serial `DYNA-ARR-MAX-STD` — intentional duplicate of `max-subarray`: the `MAX` code's meaning ("find maximum **or minimum**") covers coin-change's minimization objective, and both are `DYNA`-over-`ARR` DP exercises, though via distinct techniques — full 1D tabulation over the target range vs. Kadane's O(1)-space single pass) | Third `DYNAMIC_PROGRAMMING`-category exercise. Receives an array of coin denominations and a target amount, and returns the minimum number of coins needed to make that amount, or `-1` if it cannot be made — `coinChange(coins, amount) => number` — via **bottom-up tabulation**: a `dp` table indexed `0..amount` is seeded with the base case `dp[0] = 0`, then for every amount `i` from 1 to the target it tries every coin no larger than `i` and keeps the smallest `dp[i - coin] + 1` found, in O(amount × coins.length) time. Edge cases: `amount = 0` returns `0` directly (the loop never runs); no combination of coins summing exactly to the target leaves `dp[amount]` unreachable, returned as `-1`. **Input:** reuses the existing `number[]` + target contract (`InputKind.NUMBERS`, no new kind) exactly as `top-k-frequent`/`two-sum`/`running-average` ride their secondary numeric parameter on `target` — `values` carries the coin denominations, `target` carries the amount; default input `[1, 2, 5]`, default target `11` (the canonical example, result `3`). **Output:** `number`, reusing the existing numeric-result formatting (`-1` for the impossible case, consistent with `binary-search`'s not-found convention). The visualization reuses the memo-table archetype seeded by `climbing-stairs`/`fibonacci` — a row of cells for amounts `0..amount`, filled as the tabulation runs — extended with a coin strip below it highlighting the denomination currently being tried; step kinds are `init` (seeding `dp[0]`), `update`/`noChange` (one step per coin tested against an amount, whether or not it improved `dp[i]`; the `coin > i` skip guard has no dedicated step, since it is a silent, uninteresting short-circuit), and a terminal `done` step reporting `doneFound`/`doneImpossible` depending on the outcome. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-range`/`--viz-mid`/`--viz-found`); existing exercises are untouched |
| 2026-07-10 | Added `inorder-traversal` exercise (category `TREES`, level `EASY`, serial `TRAV-TREE-ORD-BIN`) | Second `TREES`-category exercise, deliberately contrasted with `binary-tree` (`TRAV-TREE-ORD-BST`): both perform a recursive in-order walk (`ORD`), but `binary-tree` teaches BST *construction* (insert-by-comparison, which incidentally makes in-order = sorted order), while `inorder-traversal` teaches the general recursive DFS *traversal* pattern (visit left subtree, process node, visit right subtree) on an arbitrary binary tree shape, making the point that in-order does **not** imply sorted output unless the tree happens to be a BST. Distinguished in the serial nomenclature by `VAR`: `BST` vs. the existing `BIN` (generic binary tree) — no new segment was needed, `BIN` already covers "generic binary tree" per its table entry. Interprets the input array as a complete binary tree laid out level-order — index `i`'s children live at `2i+1` and `2i+2`, the same array-as-tree indexing used by binary heaps — then walks it recursively in-order — `inorderTraversal(values) => number[]`. Edge cases: empty array returns `[]` (the walk immediately hits the out-of-range base case); a single value returns itself; non-power-of-two lengths produce a ragged (non-perfect) tree shape, exercised by a dedicated test. **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind, no target); default input `[1, 2, 3, 4, 5, 6, 7]` (a perfect 7-node tree), result `[4, 2, 5, 1, 6, 3, 7]` — deliberately not sorted, to make the BST-vs-generic-tree distinction visible at a glance. **Output:** `number[]`, reusing the existing array-result formatting. The visualization reuses `binary-tree`'s tree-graph archetype (nodes positioned by in-order index (x) and depth (y), each step lighting up the next visited node) with the same node-visited/active color roles, but builds the tree via level-order index arithmetic instead of BST insertion, and sets up the next queued exercise (`level-order-traversal`, BFS) as the natural DFS/BFS-traversal pair. No new `--viz-*` color tokens, no new `InputKind`; existing exercises (including `binary-tree`) are untouched |
| 2026-07-13 | Widened `ExerciseViz.result` to accept a nested integer array, `readonly (readonly number[])[]` | Every exercise so far returns a scalar, a flat array, a string, or a boolean (`number \| readonly number[] \| string \| boolean`, per the 2026-06-19/2026-06-23 decisions). `level-order-traversal`'s natural result is a list of tree levels — `number[][]` — which none of those shapes cover: flattening it would discard the level grouping that is the entire pedagogical point (see that exercise's own decision below), and no existing exercise needed a 2D result (`matrix-spiral`'s matrix is an *input* shape, not a result shape). Rather than special-case the type, the shared `ExerciseViz.result` union gains this fifth arm, and `controller.ts`'s `formatValue` gains a branch that recognizes an array-of-arrays and renders it bracket-nested (`[[1], [2, 3]]`), delegating to the same per-row join used for flat arrays instead of `String(value)` (which would print `[object Object],...`). No existing exercise's result type changes; `formatMatrix` (the *input*-side matrix formatter) is unaffected and kept separate since inputs and results are validated/formatted through different paths. This is shared infra expected to be reused by future exercises whose natural output is grouped/nested (e.g. graph BFS layers) |
| 2026-07-13 | Added `level-order-traversal` exercise (category `TREES`, level `MEDIUM`, serial `TRAV-TREE-ORD-BIN` — intentional duplicate of `inorder-traversal`, flagged and reviewed above in `§ Serial Code Nomenclature — Current exercises`) | Third `TREES`-category exercise, the deliberate breadth-first counterpart to `inorder-traversal`'s depth-first recursive walk, queued for exactly this pairing by that exercise's own decision entry (2026-07-10). Interprets the input array as the same complete-binary-tree level-order layout used by `binary-tree`/`inorder-traversal` (index `i`'s children live at `2i+1` and `2i+2`), then performs a **breadth-first search with an explicit queue**: starting from a queue holding only the root index, each iteration drains the queue's current contents (one tree level) into a result row while enqueuing their in-range children for the next iteration — `levelOrderTraversal(values) => number[][]`, one inner array per depth, shallowest first. This is deliberately **not** a reordering exercise: because the input is already a level-order array, a flat breadth-first visit sequence over it is the identity permutation of the input (visiting indices `0, 1, 2, …` in order, since a child index is always greater than its parent's) — grouping by level is the entire teaching point (the new `ExerciseViz.result` shape above exists to carry it), not the traversal order itself. Edge cases: empty array returns `[]` (queue starts empty, loop never runs); a single value returns `[[value]]`; non-power-of-two lengths produce a ragged final level, exercised by a dedicated test (mirroring `inorder-traversal`'s ragged-tree case). **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind, no target); default input `[1, 2, 3, 4, 5, 6, 7]` (a perfect 7-node tree), result `[[1], [2, 3], [4, 5, 6, 7]]`. **Output:** `number[][]`, using the new nested-array result shape. The visualization is a new complete-binary-tree archetype distinct from `binary-tree`/`inorder-traversal`'s in-order-indexed layout: each node's screen position is derived directly from its heap-array index (`depth = floor(log2(index + 1))`, evenly spaced left-to-right within its depth row), so the tree renders as a standard breadth-first "heap shape" instead of the DFS in-order zigzag — visually reinforcing that this exercise walks by level, not by subtree. Steps visit nodes in array-index order (per the identity-permutation note above), coloring visited/active nodes with the same `--viz-range`/`--viz-mid` roles as `inorder-traversal`, and the per-step log narrates `visit` with the node's value and its depth. No new `--viz-*` color tokens, no new `InputKind`; existing exercises (including `binary-tree` and `inorder-traversal`) are untouched |
| 2026-07-14 | Added `bfs-graph` exercise (category `GRAPHS`, level `MEDIUM`, serial `TRAV-GRPH-ORD-STD`) | First `GRAPHS`-category exercise and first to use the existing `GRPH` struct code (previously reserved in the nomenclature table but unused); no new serial segment was needed. Receives a general graph and returns the node indices in breadth-first visit order starting from node 0 — `bfsGraph(adjacencyMatrix) => number[]` — via the classic **explicit-queue BFS**: node 0 is marked visited and enqueued, then each loop iteration dequeues one node, appends it to the result, and enqueues every not-yet-visited neighbor found by scanning its row. Edge cases: an empty matrix returns `[]`; nodes unreachable from node 0 (disconnected components) are never visited, so the result can be shorter than the node count — the direct, deliberate counterpart to `level-order-traversal`'s tree BFS (2026-07-13), now over an arbitrary graph shape instead of a tree. **Input:** reuses the existing `InputKind.MATRIX` (seeded 2026-06-23 for `matrix-spiral`) rather than adding a new kind — an N×N adjacency matrix (`matrix[i][j]` nonzero ⇒ edge between `i` and `j`) is already exactly what `parseIntegerMatrix`'s "equal-length integer rows" validator accepts, so no shared-infra change was needed. The traversal's start node is fixed at index 0 rather than exposed as a configurable second parameter: `MATRIX`-kind exercises already hide the numeric target field in the UI (2026-06-23 decision), and introducing a start-node selector would require reworking that visibility rule for one exercise — deferred as a possible follow-up rather than done speculatively. Default input is a symmetric (undirected) 6-node connected graph so the default run visits every node. **Output:** `number[]`, reusing the existing flat-array result formatting (no new shape needed, unlike `level-order-traversal`'s nested result). The visualization is a new node-link graph archetype — nodes placed evenly around a circle (no tree hierarchy to lay out by), edges drawn between every adjacent pair, plus a live queue strip beneath the circle showing which nodes are discovered-but-not-yet-processed — distinct from the tree-graph archetype (`binary-tree`/`inorder-traversal`/`level-order-traversal`) and the map/chip archetype (`two-sum`/`top-k-frequent`). Node roles reuse existing tokens: unvisited `--viz-cell`, in-queue/pending `--viz-compare`, current `--viz-mid` (`--viz-found` on the final step), visited-and-expanded `--viz-range`; no new `--viz-*` tokens. Step model: one step per node dequeued (mirroring `level-order-traversal`'s per-node granularity), narrated by a single `visit` step key reporting the node and the neighbors it enqueued. |
| 2026-07-14 | Fixed `bfs-graph`: edges are now tagged with direction and one-directional edges render with an arrowhead | Developer feedback: the adjacency matrix is directed (`bfsGraph` only ever reads `matrix[node][neighbor]`, never the neighbor's own row), but the original visualization drew every connected pair as a single plain line regardless of direction — so two matrices differing only in which direction an edge points could look visually identical while producing different traversal results (reported with a concrete pair: `[[0,1,0,0],[0,0,1,0],[0,1,0,0],[1,0,0,0]] → [0,1,2]` vs. the same matrix with `matrix[0][3]` also set to `1` → `[0,1,3,2]`), with no visual cue explaining why. Fixed by classifying each connected pair during edge collection as `"both"` (present in both directions — rendered as a plain line, unchanged from before) or `"forward"`/`"backward"` (present in only one direction — rendered with a small chevron arrowhead at the target end, built from two short `line` elements at the existing `NODE_R` boundary; no new shared SVG primitive was added). `buildSteps`'s `edges` return type changed from a bare `[number, number]` tuple to a `GraphEdge` object (`{ a, b, direction }`) to carry this; `viz.test.ts`'s edge-list assertions and the affected test fixtures were updated to match (test changes made as part of this same authorized bug-fix, per the `binary-search-rotated` 2026-07-07 precedent). No new `--viz-*` tokens; the default symmetric example's appearance is unchanged since all of its edges are mutual. |
| 2026-07-15 | Added `dfs-graph` exercise (category `GRAPHS`, level `MEDIUM`, serial `TRAV-GRPH-ORD-STD` — intentional duplicate of `bfs-graph`, same rationale accepted for `inorder-traversal`/`level-order-traversal`: the serial nomenclature has no segment distinguishing depth-first from breadth-first technique) | Second `GRAPHS`-category exercise, the deliberate depth-first counterpart to `bfs-graph`'s breadth-first walk (2026-07-14), mirroring the `inorder-traversal`/`level-order-traversal` DFS/BFS pairing already established for `TREES`. Receives a general graph and returns the node indices in depth-first visit order starting from node 0 — `dfsGraph(adjacencyMatrix) => number[]` — via **iterative stack-based DFS** (not recursion, to keep the step model an explicit, inspectable data structure exactly like `bfs-graph`'s explicit queue): node 0 is pushed onto a stack, then each loop iteration pops one node, and — only if it is not already visited — marks it visited, appends it to the result, and pushes every not-yet-visited neighbor found by scanning its row **in descending index order** (so ascending-index neighbors pop first, reproducing the same visit order a recursive DFS would produce). A node can be pushed more than once before it is first popped; the visited-check at pop time discards the stale duplicates instead of a second visited-at-push-time check, which is what makes the traversal genuinely depth-first (BFS's queue marks visited at enqueue time — copying that here would degrade the walk to level-order instead of depth-order). Edge cases: an empty matrix returns `[]`; nodes unreachable from node 0 are never visited. **Input:** reuses the existing `InputKind.MATRIX` (no new kind), and reuses `bfs-graph`'s exact default adjacency matrix (`[[0,1,1,0,0,0],[1,0,0,1,1,0],[1,0,0,0,0,1],[0,1,0,0,0,0],[0,1,0,0,0,1],[0,0,1,0,1,0]]`) so the two exercises are directly comparable on identical input — BFS visits `[0,1,2,3,4,5]`, DFS visits `[0,1,3,4,5,2]`, the same graph explored two different ways. **Output:** `number[]`, reusing the existing flat-array result formatting. The visualization reuses `bfs-graph`'s node-link circle archetype (nodes placed evenly around a circle, edges tagged and arrowed exactly as the 2026-07-14 fix describes) with its discovery strip relabeled `stack` and rendered LIFO (newest entry marked as next-to-process) instead of `queue`/FIFO — the same struct (`GRPH`) and archetype as `bfs-graph`, differing only in the underlying data structure driving traversal order, so no new archetype or `--viz-*` token was introduced. Node roles reuse the identical tokens as `bfs-graph`: unvisited `--viz-cell`, on-stack/pending `--viz-compare`, current `--viz-mid` (`--viz-found` on the final step), visited `--viz-range`. Step model: one step per node popped and confirmed unvisited (stale duplicate pops that hit the `continue` guard are not stepped, since they perform no visible work — mirroring `coin-change`'s decision not to step its silent `coin > i` skip guard), narrated by a single `visit` step key reporting the node and the neighbors it newly pushed. |
| 2026-07-16 | Added `min-heap` exercise (category `HEAPS`, level `MEDIUM`, serial `BUILD-HEAP-ORD-STD`) — *entry backfilled 2026-07-17; the exercise was implemented and merged without this Decisions Log entry or its serial-table row, a spec-first process gap caught and closed while starting the next `HEAPS` exercise* | First `HEAPS`-category exercise and first to use the existing `HEAP` struct code (previously reserved in the nomenclature table but unused) and the existing `BUILD` type code (previously unused). Receives an array of integers and returns a new array rearranged into min-heap order — `buildMinHeap(arr) => number[]` — via **Floyd's bottom-up build-heap**: the array is read as a complete binary tree (index `i`'s children at `2i + 1` and `2i + 2`), and starting from the last parent node back to the root, each subtree is sifted down (swap the parent with its smallest child until the min-heap property holds or a leaf is reached), producing the classic O(n) heap-construction bound. Edge cases: empty array returns `[]`; a single element or an already-valid heap is returned unchanged (no swaps); duplicate and negative values are handled by the same comparison, no special-casing. **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind, no target); default input `[9, 4, 7, 1, 8, 5, 2, 3]`. **Output:** `number[]`, reusing the existing array-result formatting. The visualization is a new complete-binary-tree archetype distinct from the `TREES`-category tree layouts (`binary-tree`/`inorder-traversal`/`level-order-traversal` are BST/traversal-shaped): nodes positioned by the array's implicit heap-tree structure, each step lighting up the subtree currently being sifted, coloring the active parent, the children being compared, the smallest child found, and settled (already-heapified) subtrees. Step model: one step per subtree entered (`start`), one per comparison outcome that swaps (`swap`), one per comparison outcome that settles without swapping (`settle`), and a terminal `done` step. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-mid`/`--viz-compare`/`--viz-pivot`/`--viz-sorted`); existing exercises are untouched |
| 2026-07-17 | Added `TOPK` to the OBJ segment of the serial nomenclature: "Select the k largest/smallest elements by value (not by frequency)" | `top-k-elements` selects the k largest values of an array by value, which none of the existing OBJ codes capture: `FREQ` (2026-06-23) is explicitly scoped to top-k-by-frequency (`top-k-frequent`'s mode selection), and `MAX` is a single extreme, not k of them. Misclassifying it as either would blur a real distinction the taxonomy already draws elsewhere (`FREQ` vs `MAX`), so a dedicated objective code was needed. Approved by the developer before any code was written |
| 2026-07-17 | Added `top-k-elements` exercise (category `HEAPS`, level `MEDIUM`, serial `COMP-HEAP-TOPK-STD`) | Second `HEAPS`-category exercise (after `min-heap`, 2026-07-16) and first to use the new `TOPK` objective. Receives an integer array and a number `k`, and returns the `k` largest values in descending order — `topKElements(arr, k) => number[]` — via a **min-heap bounded to size k**: each value is pushed onto the heap, and whenever the heap holds more than `k` elements the smallest is popped off, so by the end the heap holds exactly the k largest values seen; draining it (repeated pop, which yields ascending order) and reversing gives the descending result, in O(n log k) — the practical heap application the exercise queue targeted, distinct from `min-heap`'s O(n) full-array heapify and from `top-k-frequent`'s bucket-sort-by-frequency technique despite the superficially similar name. Edge cases: `k <= 0` needs no special-casing — the bound check (`heap.length > k`) evicts every push immediately, so the heap (and result) end up empty by construction; `k >= arr.length` keeps every value pushed, so the result is the full input sorted descending; an empty array returns `[]` (the loop never runs). **Classification:** category `HEAPS` (topical, matches `min-heap`) with serial `TYPE=COMP` (the technique aggregates/selects a value set, mirroring `running-average`'s `COMP-ARR-AVG-STD`), `STRUCT=HEAP` (the algorithm explicitly builds and maintains a heap, unlike `top-k-frequent`'s `ARR`+bucket-sort), `OBJ=TOPK` (new, see above), `VAR=STD`. **Input:** reuses the existing `number[]` + target contract (`InputKind.NUMBERS`, no new kind); `k` rides on the existing optional numeric target field exactly as `top-k-frequent`'s `k` does; default input `[3, 10, 12, 2, 8, 15, 1, 7]`, default target `3` (result `[15, 12, 10]`). **Output:** `number[]`, reusing the existing array-result formatting. The visualization is a new two-zone archetype — the input array with a scanning cursor, and a live bounded min-heap drawn as a complete binary tree of at most `k` nodes (root = current smallest of the k largest seen so far, reusing `min-heap`'s tree-layout technique but sized to `k` instead of the full input so positions stay stable as the heap fills and drains) — narrated per input element by the per-step log (`insert` when the heap stays within size k, `evict` when pushing overflows it and the smallest is popped), plus a terminal `done` step revealing the result strip. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-mid`/`--viz-range`/`--viz-pivot`/`--viz-found`/`--viz-muted`); existing exercises (including `min-heap` and `top-k-frequent`) are untouched |
| 2026-07-20 | Added `single-number` exercise (category `BIT_MANIPULATION`, level `EASY`, serial `COMP-ARR-FIND-STD`) | First `BIT_MANIPULATION`-category exercise, activating the category reserved since 2025-01-01 and previously called out as empty by `T-FILT-05`. Receives an integer array in which every value appears exactly twice except one, and returns that unpaired value — `singleNumber(arr) => number` — by XORing every element together in a single O(n), O(1)-space pass: XOR is commutative and associative, and a value XORed with itself cancels to `0`, so every duplicate pair cancels out and only the unpaired value survives in the running result. Edge case: an empty array returns `0` directly (the loop never runs, mirroring `max-subarray`'s empty-guard precedent). **Classification:** serial `TYPE=COMP` (the technique aggregates a single value across the whole array via XOR, mirroring `running-average`'s `COMP-ARR-AVG-STD`, not a lookup/search technique like `two-sum`'s `SRCH-HASH-FIND-STD`), `STRUCT=ARR`, `OBJ=FIND` (the objective is to locate the one unpaired element — the existing `FIND` code already covers this without a new segment), `VAR=STD`; no duplicate of this serial exists. **Input:** reuses the existing `number[]` I/O contract (`InputKind.NUMBERS`, no new kind, no target); default input `[4, 1, 2, 1, 2]` (result `4`). **Output:** `number`, reusing the existing numeric-result formatting. The visualization reuses the linear-cell archetype (seeded by `binary-search`, most recently reused by `running-average`) with a live `result = X` XOR readout: each step shades the just-XORed cell `--viz-mid`, prior cells `--viz-range`, and on the terminal step the cell matching the final result shades `--viz-found`; step kinds are `empty` (length-0 guard), `scan` (one per element XORed), and a terminal `done` step highlighting the final return. No new `--viz-*` color tokens, no new `InputKind`; existing exercises are untouched |
| 2026-07-21 | Added `count-bits` exercise (category `BIT_MANIPULATION`, level `EASY`, serial `COMP-NUM-CNT-STD`) | Second `BIT_MANIPULATION`-category exercise, queued as the next daily addition after `single-number` (2026-07-20). Receives a non-negative integer `n` and returns its population count (Hamming weight) — the number of `1` bits in its binary representation — `countBits(n) => number` — via **Brian Kernighan's trick**: repeatedly AND the running value with itself minus one, which clears exactly its current lowest set bit each pass, so the loop runs exactly once per set bit (O(popcount) time, O(1) space) instead of once per bit position. Edge case: `n <= 0` returns `0` directly (no iterations), the same guard-clause shape used by `fibonacci`/`climbing-stairs` for their non-negative-`n` domains. **Classification:** `TYPE=COMP` (aggregates a single count across the value, mirroring `single-number`'s `COMP-ARR-FIND-STD`), `STRUCT=NUM` (a scalar single-integer input with no aggregate data structure, matching `fibonacci`'s `RECR-NUM-NTH-STD` and `climbing-stairs`'s `DYNA-NUM-WAYS-STD`), `OBJ=CNT` (count occurrences — the existing code already covers "count set bits" without a new segment), `VAR=STD`; no duplicate of this serial exists. **Input:** reuses the existing `InputKind.SCALAR` contract (seeded 2026-07-06 for `fibonacci`, no new kind, no target); default input `11` (binary `1011`, result `3`). **Output:** `number`, reusing the existing numeric-result formatting. The visualization is a new bit-row archetype distinct from the `NUM`-struct DP-table layouts (`fibonacci`/`climbing-stairs` render a memo/dp array indexed `0..n`): a row of cells one per bit position of `n` (MSB to LSB, sized to `n`'s own bit width, mirroring how those exercises size their cell count to `n`), plus a live `count = X` readout. Each step independently simulates one Kernighan iteration (`buildSteps` does not import `countBits`), coloring the bit just cleared this step `--viz-mid`, bits already cleared in an earlier step `--viz-found`, bits still set and pending `--viz-range`, and bits that were never set `--viz-cell`; step kinds are `empty` (the `n <= 0` guard), `clear` (one per iteration), and a terminal `done` step. No new `--viz-*` color tokens, no new `InputKind`; existing exercises (including `fibonacci` and `climbing-stairs`) are untouched |
| 2026-07-22 | Added `DIFF` to the OBJ segment of the serial nomenclature: "Compute the difference or distance between two values (e.g. days between two dates)" | `date-difference` computes the day distance between two dates, which none of the existing OBJ codes capture: it isn't finding/locating an element (`FIND`), aggregating over a collection (`AVG`/`CNT`/`MAX`), generating a value from a scalar index (`NTH`/`WAYS`), or any of the structural/reshaping codes (`DEDUP`/`REM`/`REV`/`ORD`/`DEC`/`MRG`/`XPOS`/`VAL`/`FREQ`/`TOPK`). The operation is a magnitude between exactly two values, a shape the taxonomy had no code for, so a dedicated objective code was needed |
| 2026-07-22 | Added `InputKind.DATES` — a sixth input kind for exercises whose natural input is a pair of calendar dates | First `DATES`-category exercise, `date-difference`, needs two ISO 8601 (`YYYY-MM-DD`) dates as input — a shape none of the existing kinds fit: `NUMBERS` is an integer array, `MATRIX` a 2D integer array, `SCALAR` a single integer, and the three text kinds (`STRING`/`BRACKETS`/`TEXT`) each carry one free-form string whose *placeholder and error copy* describe run-length/bracket/generic-text formats that would mislead a user typing two dates (the `add-exercise` skill explicitly warns against silently reusing a text kind whose charset happens to validate but whose UI copy doesn't fit — Vitest only tests the pure function, so a misleading custom-input panel would still go green). Rather than add a new carrier shape (the heavier `SCALAR`-style change), `DATES` reuses the existing `VizInput.text` carrier seeded by the 2026-06-19 decision — the two dates travel as one comma-separated string (`"2024-01-15,2024-03-22"`) — following the "third text-shaped kind is lighter" precedent set by `TEXT` (2026-07-02). Only four things changed: (1) the enum gains `DATES`; (2) a new `parseDatePair` validator in `userInput.ts` requires the exact `YYYY-MM-DD,YYYY-MM-DD` shape via a bounded regex and additionally verifies both halves round-trip through `Date.UTC` (rejecting calendar-invalid dates like `2024-02-30` that a naive regex would accept but `Date` would silently roll into March); (3) the shared `isTextInput` check in `controller.ts` widens to include `DATES` alongside `STRING`/`BRACKETS`/`TEXT`, with its own `invalidInputDates` error key; (4) `[slug].astro`'s placeholder-key chain and both i18n files gain `inputPlaceholderDates`/`invalidInputDates`. `isValidSavedInput` needs no change (already accepts any bounded string regardless of kind, per the 2026-07-02 `TEXT` precedent), and `exerciseInit.ts` needs no change (its `inputKind !== NUMBERS` branch already builds `{ values: [], text }` generically for every text-shaped kind). `inputKind` still defaults to `NUMBERS`, so every existing exercise is untouched |
| 2026-07-22 | Added `date-difference` exercise (category `DATES`, level `EASY`, serial `COMP-NUM-DIFF-STD`) | First `DATES`-category exercise, activating the category reserved since 2025-01-01 and previously called out as empty by `T-FILT-05`, and first to use the new `InputKind.DATES` and the new `DIFF` objective. Receives two ISO 8601 dates as one comma-separated string and returns the number of whole days between them — `dateDifference(input) => number` — by converting each date to its UTC epoch-millisecond instant (`Date.UTC(year, month - 1, day)`) via a small `parseIsoDate` helper, then taking the rounded absolute difference divided by the milliseconds in a day. No loop: the computation is O(1), the same "short, non-iterative, still worth stepping through conceptually" shape as a scalar arithmetic exercise. **Classification:** `TYPE=COMP` (aggregates a single magnitude from the input, mirroring `count-bits`'s `COMP-NUM-CNT-STD`), `STRUCT=NUM` (two scalar date values with no aggregate data structure — the comma-separated wire format is a UI convenience, not character-level text processing like the `STR`-struct exercises, so `NUM` was judged the closer semantic fit over `STR`), `OBJ=DIFF` (new, see above), `VAR=STD`; no duplicate of this serial exists. **Input:** `InputKind.DATES` (see the kind's own decision above); default input `"2024-01-15,2024-03-22"` (result `67`, a leap-year span exercising February's 29th day). **Output:** `number`, reusing the existing numeric-result formatting. The visualization is a new two-node timeline archetype, distinct from the linear-cell (`binary-search`/`running-average`/`fibonacci`) and tree/graph archetypes: two fixed date markers with a step sequence of `parseFirst` (left marker resolves to its epoch-day count), `parseSecond` (right marker resolves to its epoch-day count), and a terminal `compute`/`done` step drawing a connecting span labeled with the final day count. No new `--viz-*` color tokens (reuses `--viz-cell`/`--viz-mid`/`--viz-found`/`--viz-mid-label`); existing exercises are untouched |