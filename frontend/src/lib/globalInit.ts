import { Language, Theme, ViewMode } from "./constants";
import { exercises } from "../data/exercises";
import {
  initPrefs,
  toggleTheme,
  setLanguage,
  getPrefs,
} from "./clientPrefs";
import { readLearned, readInputs, writeLearned, writeInputs, writePrefs } from "./storage";
import { exportState, importState } from "./exportImport";
import { validatePrefs } from "./validation/localStorage";
import { resolve } from "../i18n";
import type { LanguageCode } from "../i18n";
import type { AppState } from "./types";

const EXPORT_FILENAME = "algo-dsa-data.json";
const JSON_MIME = "application/json";

function currentLang(): LanguageCode {
  return getPrefs().language as LanguageCode;
}

function showTransient(el: HTMLElement | null, message: string): void {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: JSON_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function collectState(): AppState {
  return {
    algo_learned: readLearned(),
    algo_inputs: readInputs(),
    algo_prefs: getPrefs(),
  };
}

/** Wires global header/settings behavior. Called once per page. */
export function initGlobal(): void {
  const warning = document.querySelector<HTMLElement>('[data-role="storage-warning"]');

  initPrefs(() => {
    showTransient(warning, resolve("errors.storageReset", currentLang()));
  });

  // Theme toggle.
  document
    .querySelector('[data-action="toggle-theme"]')
    ?.addEventListener("click", () => toggleTheme());

  // Language switcher.
  const langSelect = document.querySelector<HTMLSelectElement>('[data-role="language-select"]');
  if (langSelect) {
    langSelect.value = getPrefs().language;
    langSelect.addEventListener("change", () => {
      const value = langSelect.value === Language.ES ? Language.ES : Language.EN;
      setLanguage(value);
    });
  }

  // Settings dialog open/close. The dialog is a read-only summary; theme and
  // language are changed from the header, so the summary is (re)populated each
  // time it opens to reflect the latest state.
  const dialog = document.querySelector<HTMLElement>('[data-role="settings"]');

  function setSummary(role: string, text: string): void {
    const el = document.querySelector<HTMLElement>(`[data-role="${role}"]`);
    if (el) el.textContent = text;
  }

  function populateSummary(): void {
    const lang = currentLang();
    const prefs = getPrefs();
    setSummary(
      "sum-theme",
      resolve(prefs.theme === Theme.DARK ? "settings.themeDark" : "settings.themeLight", lang)
    );
    setSummary(
      "sum-language",
      resolve(prefs.language === Language.ES ? "settings.languageEs" : "settings.languageEn", lang)
    );
    setSummary(
      "sum-view",
      resolve(prefs.viewMode === ViewMode.LIST ? "settings.viewList" : "settings.viewGrid", lang)
    );
    setSummary("sum-learned", `${readLearned().length} / ${exercises.length}`);
    const savedCount = Object.values(readInputs()).reduce((n, list) => n + list.length, 0);
    setSummary("sum-inputs", String(savedCount));
  }

  document
    .querySelector('[data-action="open-settings"]')
    ?.addEventListener("click", () => {
      populateSummary();
      dialog?.removeAttribute("hidden");
    });
  dialog
    ?.querySelectorAll('[data-action="close-settings"]')
    .forEach((el) =>
      el.addEventListener("click", () => dialog.setAttribute("hidden", "")),
    );

  // Export.
  document
    .querySelector('[data-action="export"]')
    ?.addEventListener("click", () => {
      downloadJson(EXPORT_FILENAME, exportState(collectState()));
    });

  // Import.
  const importInput = document.querySelector<HTMLInputElement>('[data-role="import-file"]');
  const importMsg = document.querySelector<HTMLElement>('[data-role="import-msg"]');
  importInput?.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const result = importState(raw);
    if (!result.ok) {
      showTransient(importMsg, resolve("settings.importError", currentLang()));
      importInput.value = "";
      return;
    }
    writeLearned(result.value.algo_learned);
    writeInputs(result.value.algo_inputs);
    const prefs = validatePrefs(result.value.algo_prefs);
    if (prefs.ok) {
      writePrefs(prefs.value);
    }
    showTransient(importMsg, resolve("settings.importSuccess", currentLang()));
    // Reload so every view reflects the restored state consistently.
    window.location.reload();
  });
}
