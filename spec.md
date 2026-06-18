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
AWS_ACCOUNT_ID=
AWS_REGION=
CERTIFICATE_ARN=      # ACM certificate ARN (us-east-1 for CloudFront)
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

### User state — localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `algo_learned` | `string[]` (exercise IDs) | Learned exercise IDs |
| `algo_inputs` | `Record<id, SavedInput[]>` | User-saved custom inputs per exercise |
| `algo_prefs` | `{ theme, language, viewMode }` | User preferences |

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
- Algorithm code block (pure JS), syntax-highlighted, with Copy button.
- Mark as Learned / Unlearn toggle.

### Library page

- List of all reference links across all exercises.
- Each entry shows its linked exercise name (cross-reference to exercise page).

### Export / Import

- Available in settings.
- Exports `algo_learned`, `algo_inputs`, `algo_prefs` as a single JSON file download.
- Import parses and validates the JSON before applying. Invalid import shows a visible error, no partial state applied.

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

  Scenario: Copy algorithm code
    When the user clicks the "Copy" button on the code block
    Then the full algorithm code is copied to the clipboard
    And a confirmation indicator is briefly shown

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
    Then learned exercises, saved inputs, and preferences are restored

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
| `T-FILT-05` | No-match filter returns empty array | Category `BIT_MANIPULATION` (no exercises yet) | `[]` |
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
| `T-IMP-01` | Valid import restores all state | Valid export JSON | All state keys restored |
| `T-IMP-02` | Import with missing key fails validation | JSON missing `algo_prefs` | Error result, no state change |
| `T-IMP-03` | Import with wrong types fails | `algo_learned` as number | Error result, no state change |

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
- ACM certificate reference (ARN from `.env`)
- All resource names derived from constants, no hardcoded strings
- `infra/.env.example` documenting all required variables
- `infra/README.md` with deploy instructions

**GitHub Action:** `infra/.github/workflows/deploy-infra.yml` — triggered manually; runs `cdk deploy`

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
- `src/data/__tests__/exercises.test.ts` — T-REG-*
- `src/lib/__tests__/filters.test.ts` — T-FILT-*, T-SEARCH-*
- `src/lib/__tests__/progress.test.ts` — T-PROG-*
- `src/lib/__tests__/exportImport.test.ts` — T-EXP-*, T-IMP-*
- `src/lib/viz/__tests__/stepEngine.test.ts` — T-VIZ-*
- `src/exercises/binary-search/__tests__/exercise.test.ts` — T-ALG-BS-*
- `src/exercises/binary-search/__tests__/viz.test.ts` — T-VIZEX-BS, T-INT-BS
- `src/exercises/linked-list/__tests__/exercise.test.ts` — T-ALG-LL-*
- `src/exercises/linked-list/__tests__/viz.test.ts` — T-VIZEX-LL, T-INT-LL
- `src/exercises/binary-tree/__tests__/exercise.test.ts` — T-ALG-BST-*
- `src/exercises/binary-tree/__tests__/viz.test.ts` — T-VIZEX-BST, T-INT-BST

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