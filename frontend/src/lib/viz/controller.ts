import { createStepEngine } from "./stepEngine";
import type { VizFactory, VizInput, ExerciseViz } from "./types";
import { AUTO_PLAY_INTERVAL_MS } from "../constants";
import { parseIntegerArray, parseIntegerTarget } from "../validation/userInput";
import {
  readLearned,
  writeLearned,
  readInputs,
  writeInputs,
} from "../storage";
import type { SavedInput, LocalizedText } from "../types";
import { resolve, localize, interpolate } from "../../i18n";
import type { LanguageCode } from "../../i18n";
import { getPrefs, LANGUAGE_CHANGE_EVENT } from "../clientPrefs";

export interface ExerciseControllerDeps {
  readonly root: HTMLElement;
  readonly exerciseId: string;
  readonly createViz: VizFactory;
  readonly defaultInput: VizInput;
  /** Bilingual step-detail templates for this exercise (from exercises.json). */
  readonly stepMessages: Readonly<Record<string, LocalizedText>>;
}

const I18N = {
  auto: "exercise.auto",
  stop: "exercise.stop",
  markLearned: "exercise.markLearned",
  unlearn: "exercise.unlearn",
  invalidInput: "exercise.invalidInput",
  currentStep: "exercise.currentStep",
  inputLabel: "exercise.inputLabel",
  resultLabel: "exercise.resultLabel",
  targetLabel: "exercise.targetLabel",
  load: "exercise.load",
  delete: "exercise.delete",
  noSavedInputs: "exercise.noSavedInputs",
  stepLogEmpty: "exercise.stepLogEmpty",
} as const;

function lang(): LanguageCode {
  return getPrefs().language as LanguageCode;
}

/** Wires up all interactive behavior for a single exercise page. */
export function mountExercise(deps: ExerciseControllerDeps): void {
  const { root, exerciseId, createViz, defaultInput, stepMessages } = deps;

  const svg = root.querySelector<SVGSVGElement>('[data-role="viz-svg"]');
  const stepLabel = root.querySelector<HTMLElement>('[data-role="step-label"]');
  const stepLog = root.querySelector<HTMLElement>('[data-role="step-log"]');
  const inputLabel = root.querySelector<HTMLElement>('[data-role="input-label"]');
  const resultLine = root.querySelector<HTMLElement>('[data-role="result-line"]');
  const resultLabel = root.querySelector<HTMLElement>('[data-role="result-label"]');
  const inputField = root.querySelector<HTMLInputElement>('[data-role="input"]');
  const targetField = root.querySelector<HTMLInputElement>('[data-role="target"]');
  const inputError = root.querySelector<HTMLElement>('[data-role="input-error"]');
  const saveLabel = root.querySelector<HTMLInputElement>('[data-role="save-label"]');
  const savedList = root.querySelector<HTMLElement>('[data-role="saved-list"]');
  const autoBtn = root.querySelector<HTMLButtonElement>('[data-action="auto"]');
  const backBtn = root.querySelector<HTMLButtonElement>('[data-action="back"]');
  const forwardBtn = root.querySelector<HTMLButtonElement>('[data-action="forward"]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-action="reset"]');
  const preloadBtn = root.querySelector<HTMLButtonElement>('[data-action="preload"]');
  const learnedBtn = root.querySelector<HTMLButtonElement>('[data-action="learned"]');

  if (!svg) {
    return;
  }

  let viz: ExerciseViz = createViz(defaultInput);
  let engine = createStepEngine(viz.totalSteps);
  let currentInput: VizInput = defaultInput;
  let autoTimer: ReturnType<typeof setInterval> | null = null;

  function setButtonLabel(btn: HTMLElement | null, key: string): void {
    if (!btn) return;
    btn.dataset.i18n = key;
    btn.textContent = resolve(key, lang());
  }

  function setDisabled(btn: HTMLButtonElement | null, disabled: boolean): void {
    if (btn) btn.disabled = disabled;
  }

  /** Reflects whether each control currently applies (step bounds + auto state). */
  function syncControls(): void {
    const playing = autoTimer !== null;
    const atStart = engine.currentStep <= 0;
    const atEnd = engine.currentStep >= viz.totalSteps - 1;
    const single = viz.totalSteps <= 1;

    setDisabled(backBtn, playing || atStart);
    setDisabled(forwardBtn, playing || atEnd);
    setDisabled(resetBtn, playing || atStart);
    setDisabled(preloadBtn, playing);
    // Auto has nothing to play on a single-step trace; otherwise it stays
    // enabled so it can toggle to Stop.
    setDisabled(autoBtn, single && !playing);
    autoBtn?.classList.toggle("is-playing", playing);
  }

  function formatValue(value: number | readonly number[]): string {
    return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
  }

  function renderIo(): void {
    if (inputLabel) {
      let text = formatValue(currentInput.values);
      if (currentInput.target !== undefined) {
        text += ` · ${resolve(I18N.targetLabel, lang())} ${currentInput.target}`;
      }
      inputLabel.textContent = text;
    }
    const atEnd = engine.currentStep >= viz.totalSteps - 1;
    if (resultLine) resultLine.hidden = !atEnd;
    if (resultLabel) resultLabel.textContent = atEnd ? formatValue(viz.result) : "";
  }

  /**
   * Rebuilds the step-detail log from scratch for the current step: one row per
   * advanced step (1..currentStep). Derived purely from the step index, so going
   * back simply drops the trailing rows and Reset clears it to the empty state.
   */
  function renderStepLog(): void {
    if (!stepLog) return;
    while (stepLog.firstChild) {
      stepLog.removeChild(stepLog.firstChild);
    }
    const l = lang();
    let lastRow: HTMLElement | null = null;

    for (let step = 1; step <= engine.currentStep; step += 1) {
      const descriptor = viz.describeStep(step);
      if (!descriptor) continue;

      const template = stepMessages[descriptor.key];
      const message = template
        ? interpolate(localize(template, l), descriptor.params)
        : descriptor.key;

      const row = document.createElement("li");
      row.className = "step-log-row";

      const num = document.createElement("span");
      num.className = "step-log-num";
      num.textContent = `${resolve(I18N.currentStep, l)} ${step}`;

      const msg = document.createElement("span");
      msg.className = "step-log-msg";
      msg.textContent = message; // resolved template — textContent only

      row.append(num, msg);
      stepLog.appendChild(row);
      lastRow = row;
    }

    if (lastRow === null) {
      const empty = document.createElement("li");
      empty.className = "step-log-empty muted";
      empty.textContent = resolve(I18N.stepLogEmpty, l);
      stepLog.appendChild(empty);
    } else {
      lastRow.classList.add("is-active");
      stepLog.scrollTop = stepLog.scrollHeight;
    }
  }

  function render(): void {
    if (!svg) return;
    viz.renderStep(svg, engine.currentStep);
    if (stepLabel) {
      stepLabel.textContent = `${resolve(I18N.currentStep, lang())} ${
        engine.currentStep
      } / ${viz.totalSteps - 1}`;
    }
    renderIo();
    renderStepLog();
    syncControls();
  }

  function rebuild(input: VizInput): void {
    stopAuto();
    currentInput = input;
    viz = createViz(input);
    engine = createStepEngine(viz.totalSteps);
    render();
  }

  function stopAuto(): void {
    if (autoTimer !== null) {
      clearInterval(autoTimer);
      autoTimer = null;
      setButtonLabel(autoBtn, I18N.auto);
      syncControls();
    }
  }

  function startAuto(): void {
    // Replay behavior: starting Auto from the last step rewinds to the
    // beginning first, so the button always plays the full sequence.
    if (engine.currentStep >= viz.totalSteps - 1) {
      engine.reset();
      render();
    }
    setButtonLabel(autoBtn, I18N.stop);
    autoTimer = setInterval(() => {
      if (engine.currentStep >= viz.totalSteps - 1) {
        stopAuto();
        return;
      }
      engine.stepForward();
      render();
    }, AUTO_PLAY_INTERVAL_MS);
    syncControls();
  }

  // --- Playback controls ---
  root.querySelectorAll<HTMLElement>("[data-action]").forEach((el) => {
    const action = el.dataset.action;
    el.addEventListener("click", () => {
      switch (action) {
        case "preload":
          rebuild(defaultInput);
          break;
        case "reset":
          stopAuto();
          engine.reset();
          render();
          break;
        case "forward":
          stopAuto();
          engine.stepForward();
          render();
          break;
        case "back":
          stopAuto();
          engine.stepBack();
          render();
          break;
        case "auto":
          if (autoTimer === null) {
            startAuto();
          } else {
            stopAuto();
          }
          break;
        default:
          break;
      }
    });
  });

  // --- Custom input ---
  const applyBtn = root.querySelector<HTMLButtonElement>('[data-action="apply"]');
  function applyCustomInput(): void {
    if (!inputField || !inputError) return;
    const arrayResult = parseIntegerArray(inputField.value);
    if (!arrayResult.ok) {
      inputError.textContent = resolve(I18N.invalidInput, lang());
      inputError.hidden = false;
      return;
    }
    let target: number | undefined;
    if (targetField) {
      const targetResult = parseIntegerTarget(targetField.value);
      if (!targetResult.ok) {
        inputError.textContent = resolve(I18N.invalidInput, lang());
        inputError.hidden = false;
        return;
      }
      target = targetResult.value;
    }
    inputError.hidden = true;
    rebuild({ values: arrayResult.value, target });
  }
  applyBtn?.addEventListener("click", applyCustomInput);

  // --- Saved inputs ---
  function getSaved(): SavedInput[] {
    const all = readInputs();
    return all[exerciseId] ?? [];
  }

  function persistSaved(list: SavedInput[]): void {
    const all = readInputs();
    all[exerciseId] = list;
    writeInputs(all);
  }

  function renderSaved(): void {
    if (!savedList) return;
    while (savedList.firstChild) {
      savedList.removeChild(savedList.firstChild);
    }
    const list = getSaved();
    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.dataset.i18n = I18N.noSavedInputs;
      empty.textContent = resolve(I18N.noSavedInputs, lang());
      savedList.appendChild(empty);
      return;
    }
    list.forEach((saved, index) => {
      const row = document.createElement("div");
      row.className = "saved-input-row";

      const name = document.createElement("span");
      name.className = "saved-input-label";
      name.textContent = saved.label; // user text — textContent only

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.className = "btn btn-small";
      loadBtn.textContent = resolve(I18N.load, lang());
      loadBtn.addEventListener("click", () => {
        rebuild({ values: [...saved.value], target: saved.target });
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-small btn-danger";
      delBtn.textContent = resolve(I18N.delete, lang());
      delBtn.addEventListener("click", () => {
        const next = getSaved();
        next.splice(index, 1);
        persistSaved(next);
        renderSaved();
      });

      row.append(name, loadBtn, delBtn);
      savedList.appendChild(row);
    });
  }

  const saveBtn = root.querySelector<HTMLButtonElement>('[data-action="save"]');
  saveBtn?.addEventListener("click", () => {
    if (!saveLabel) return;
    const label = saveLabel.value.trim();
    if (label === "" || currentInput.values.length === 0) {
      return;
    }
    const list = getSaved();
    list.push({
      label,
      value: [...currentInput.values],
      target: currentInput.target,
    });
    persistSaved(list);
    saveLabel.value = "";
    renderSaved();
  });

  // --- Learned toggle ---
  function isLearned(): boolean {
    return readLearned().includes(exerciseId);
  }
  function syncLearnedLabel(): void {
    setButtonLabel(learnedBtn, isLearned() ? I18N.unlearn : I18N.markLearned);
    learnedBtn?.classList.toggle("is-learned", isLearned());
  }
  learnedBtn?.addEventListener("click", () => {
    const list = readLearned();
    const idx = list.indexOf(exerciseId);
    if (idx === -1) {
      list.push(exerciseId);
    } else {
      list.splice(idx, 1);
    }
    writeLearned(list);
    syncLearnedLabel();
  });

  // Re-resolve dynamic labels when language changes.
  document.addEventListener(LANGUAGE_CHANGE_EVENT, () => {
    render();
    syncLearnedLabel();
    renderSaved();
  });

  // Initial paint.
  render();
  syncLearnedLabel();
  renderSaved();
}
