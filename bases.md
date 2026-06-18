# Objective

Create an interactive system for practicing algorithms and data structures.

# Features

* Search field.
* Exercise list (name, brief description, link to access it, tags).
* Tags: Type, Level, Learned, New.
* View mode (grid or list).
* Filter (type, level, learned/to learn, New).
* Saves preferences, exercises, and input values in localStorage (allows export/import to take it to another device).
* Exercise (detail view).
* Learned tag (the user marks the exercise when they consider they have learned it).
* Library (list of references used in the exercises so the user can learn more theory or practice separately if preferred).
* Learning progress bar.
* Language switcher English and Spanish (detects by default but saves the user's selection).

# Views (own URL)

* Home (exercise list and progress).
* Exercise (one per exercise).
* Library.

# Categories

* General
* Text
* Dates
* Lists
* Matrices
* Trees
* Graphs

Recommend other categories you can think of.

# Level

1. Simple
2. Medium
3. Advanced
4. Expert

Recommend another level scheme if necessary.

# Exercise (detail view of each exercise)

* Name.
* Description.
* Link to a reference site to learn more.
* Interactive graphic showing step by step how the algorithm/structure progresses (especially useful for lists, matrices, and graphs).
* Preload/reset/auto/forward/back options for the flow.
* Option for the user to load their own inputs (can save them to reload later via a list).
* Pure algorithm/structure code with a copy-all button (JavaScript).
* Mark as Learned (and also Unlearn — maybe I want to practice it again or I clicked by mistake).

# Library

* List of links to external websites to go deeper into the algorithms/structures (can be more than one per exercise).
* Each link in turn has a cross-reference to the exercise view it belongs to.

# Interface Style

* Support for dark and light theme depending on browser preferences, but saved in localStorage when the user makes a selection in the app.
* Should feel like an educational app.

# Security

* Strongly validate user input to prevent code injection or any vulnerability, both in text fields and in URL parameters and data coming from localStorage. Any inconsistency will generate a visible failure rather than being silent, and will be blocked before touching any code that could be exploited.

# Non-functional Specifications

* Repository with two separate projects: Frontend App (GitHub Action to publish and run invalidations) and Infra (CDK, CloudFront, S3, Route 53 record, configurable URLs).
* Astro framework.
* JavaScript + TypeScript (no framework).
* Development principles:
    * All code created or modified must satisfy the scenarios and features in Gherkin format and the specifications in general.
    * Code and documentation always in English (`spec.md`, `claude.md`, `readme.md`, and others).
    * Any code modification that involves new decisions or new features must be documented immediately.
    * Any code change that contradicts current documentation or decisions must alert and wait for confirmation before being applied, and if applied, update the documentation immediately.
    * All text visible to the user comes from `.json` files with their English and Spanish versions, switcheable.
    * Separate the general project behavior from the behavior of each view.
    * Keep state and functionality in separate layers as well.
    * Keep at a reusable level everything that is possible.
    * In turn, each exercise keeps its own exclusive code and functions separate from the others.
    * Do not use free values or magic numbers — everything in constants and enums.
    * Only code that can be tested should be created, and it must pass its respective test if one already exists.
    * Tests will not be modified or created without developer authorization.
    * Every new test confirmed to be added or modified must satisfy its respective scenario/feature in Gherkin format.
    * When a test becomes orphaned, alert to confirm its removal.
    * Code not directly related to the current task must not be modified without user authorization.
* All sensitive data is placed in the `.env` file (ensure this is maintained on every edit).
* All non-sensitive configuration goes in the corresponding `.json` files (e.g. language).

## Exercise — detailed specifications

It was already mentioned that it must keep its code isolated, but I will explain it in more detail:

* The general information for all exercises/structures is kept in a JSON file:
  1. Name
  2. Description
  3. Links
  4. Base inputs/outputs
  5. Level
  6. Type
  7. New (flag)
  8. Date added (for internal use only)
  9. Reference to the `.js` file of its own base code, which is the one shown for copying in the view (always a pure function that receives a given input and resolves completely, returning an expected output)
* When Claude generates the interactive view of an exercise, it starts by creating its config, the base code (separate `.js`) — this acts as a seed to define the behavior of that view: what steps to include, what graphic to use, what data to display, what elements are clickable. All of that is relative to that structure and will not be shared.
* Each exercise also has its own test for its base code and for the interaction-related code.

# Discussion — Claude must confirm this before creating the project

* What algorithms or structures are we going to include first? I recommend starting with 3 (even if we list more) to validate structure and functionality.

# Spec Definition

The output of this discussion is a `spec.md` file that will be used with Claude Code. It will contain:

- Prompts needed to convey this working style and stages to Claude Code.
- No source code inside the spec.
- All agreed specifications and details.
- Gherkin Syntax format representing each feature of the system.
- List of unit tests satisfying each feature from the Gherkin format, with a breakdown of their objective and expected input/output (no code).
- Implementation stages (executed in order, one at a time, with developer authorization before proceeding — Claude Code starts with Stage 1 and continues only when the developer requests it, confirming when the spec has been fully implemented):
  1. Creation of the infrastructure publishing stack with AWS CDK.
  2. Dependency installation in the frontend project (no code yet).
  3. Generation of unit tests that will fail at this stage.
  4. Generation of code that makes the unit tests pass (no code will be added that does not pass the tests).
  5. Generation of `claude.md` and `readme.md` with their respective focuses.
      1. Claude.md needs to consider how to add a new exercise following the standard format when requested in a prompt.