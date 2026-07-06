import { loadViz } from "../exercises/registry";
import { exercises } from "../data/exercises";
import { mountExercise } from "./viz/controller";
import { parseIntegerArray, parseIntegerMatrix } from "./validation/userInput";
import { COPY_FEEDBACK_MS, CODE_BLOCK_DEFAULT_OPEN, InputKind } from "./constants";
import type { VizInput } from "./viz/types";
import { resolve } from "../i18n";
import { getPrefs } from "./clientPrefs";
import { readCodeOpen, writeCodeOpen } from "./storage";
import type { LanguageCode } from "../i18n";

/** i18n keys for the code-block toggle button, by current open state. */
const CODE_TOGGLE_KEY = {
  show: "exercise.showCode",
  hide: "exercise.hideCode",
} as const;

/**
 * Wires the Expand/Collapse button for the code block. The block is collapsed
 * by default (rendered server-side with `is-collapsed`); the per-exercise state
 * is read from and persisted to localStorage so it survives reloads.
 */
function setupCodeToggle(id: string): void {
  const toggleBtn = document.querySelector<HTMLButtonElement>('[data-action="toggle-code"]');
  const codeEl = document.querySelector<HTMLElement>('[data-role="code"]');
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-action="copy"]');
  if (!toggleBtn || !codeEl) return;

  function apply(open: boolean): void {
    codeEl!.classList.toggle("is-collapsed", !open);
    const key = open ? CODE_TOGGLE_KEY.hide : CODE_TOGGLE_KEY.show;
    toggleBtn!.dataset.i18n = key;
    toggleBtn!.textContent = resolve(key, getPrefs().language as LanguageCode);
    toggleBtn!.setAttribute("aria-expanded", String(open));
    // The copy action only makes sense when the code is visible.
    if (copyBtn) copyBtn.hidden = !open;
  }

  let open = readCodeOpen()[id] ?? CODE_BLOCK_DEFAULT_OPEN;
  apply(open);

  toggleBtn.addEventListener("click", () => {
    open = !open;
    apply(open);
    writeCodeOpen({ ...readCodeOpen(), [id]: open });
  });
}

function setupCopyButton(): void {
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-action="copy"]');
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    // Copy whichever inner block is currently visible (JS or pseudo-code).
    // Falls back to the outer wrapper for exercises without a mode switcher,
    // but in practice the js block is always present.
    const pseudoEl = document.querySelector<HTMLElement>('[data-role="code-pseudo"]');
    const jsEl = document.querySelector<HTMLElement>('[data-role="code-js"]');
    const activeEl =
      pseudoEl && !pseudoEl.hidden ? pseudoEl : jsEl ?? document.querySelector('[data-role="code"]');
    const code = activeEl?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    const lang = getPrefs().language as LanguageCode;
    const original = resolve("exercise.copy", lang);
    copyBtn.textContent = resolve("exercise.copied", lang);
    copyBtn.dataset.i18n = "";
    setTimeout(() => {
      copyBtn.dataset.i18n = "exercise.copy";
      copyBtn.textContent = original;
    }, COPY_FEEDBACK_MS);
  });
}

function setupCodeSwitcher(): void {
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-action="code-mode"]');
  const jsEl = document.querySelector<HTMLElement>('[data-role="code-js"]');
  const pseudoEl = document.querySelector<HTMLElement>('[data-role="code-pseudo"]');
  if (!modeButtons.length || !jsEl || !pseudoEl) return;

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isPseudo = btn.dataset.mode === "pseudo";
      jsEl.hidden = isPseudo;
      pseudoEl.hidden = !isPseudo;
      modeButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    });
  });
}

/** Bootstraps the exercise detail page once the DOM is ready. */
export async function initExercise(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-role="exercise"]');
  if (!root) return;

  const id = root.dataset.exerciseId;
  if (!id) return;

  setupCopyButton();
  setupCodeSwitcher();
  setupCodeToggle(id);

  const exercise = exercises.find((e) => e.id === id);
  const inputKind = exercise?.inputKind ?? InputKind.NUMBERS;

  let defaultInput: VizInput;
  if (inputKind === InputKind.MATRIX) {
    const rawMatrix = root.dataset.defaultInput ?? "[]";
    const parsed = parseIntegerMatrix(rawMatrix);
    const matrix = parsed.ok ? parsed.value : [];
    defaultInput = { values: [], matrix };
  } else if (inputKind === InputKind.SCALAR) {
    const scalar = typeof exercise?.defaultInput === "number" ? exercise.defaultInput : 0;
    defaultInput = { values: [], scalar };
  } else if (inputKind !== InputKind.NUMBERS) {
    const text = typeof exercise?.defaultInput === "string" ? exercise.defaultInput : "";
    defaultInput = { values: [], text };
  } else {
    const rawInput = root.dataset.defaultInput ?? "[]";
    const parsed = parseIntegerArray(rawInput);
    const values = parsed.ok ? parsed.value : [];
    const target = root.dataset.defaultTarget
      ? Number(root.dataset.defaultTarget)
      : undefined;
    defaultInput = { values, target };
  }

  const createViz = await loadViz(id);
  const stepMessages = exercise?.stepMessages ?? {};
  mountExercise({
    root,
    exerciseId: id,
    inputKind,
    createViz,
    defaultInput,
    stepMessages,
  });
}
