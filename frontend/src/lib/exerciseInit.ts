import { loadViz } from "../exercises/registry";
import { exercises } from "../data/exercises";
import { mountExercise } from "./viz/controller";
import { parseIntegerArray } from "./validation/userInput";
import { COPY_FEEDBACK_MS, InputKind } from "./constants";
import type { VizInput } from "./viz/types";
import { resolve } from "../i18n";
import { getPrefs } from "./clientPrefs";
import type { LanguageCode } from "../i18n";

function setupCopyButton(): void {
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-action="copy"]');
  const codeEl = document.querySelector<HTMLElement>('[data-role="code"]');
  if (!copyBtn || !codeEl) return;

  copyBtn.addEventListener("click", async () => {
    const code = codeEl.textContent ?? "";
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

/** Bootstraps the exercise detail page once the DOM is ready. */
export async function initExercise(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-role="exercise"]');
  if (!root) return;

  const id = root.dataset.exerciseId;
  if (!id) return;

  setupCopyButton();

  const exercise = exercises.find((e) => e.id === id);
  const inputKind = exercise?.inputKind ?? InputKind.NUMBERS;

  let defaultInput: VizInput;
  if (inputKind === InputKind.STRING) {
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
