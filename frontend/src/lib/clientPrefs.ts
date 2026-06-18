import { Theme, Language, ViewMode } from "./constants";
import type { Prefs } from "./types";
import { readPrefs, writePrefs, DEFAULT_PREFS } from "./storage";
import { applyLanguage } from "../i18n/apply";
import type { LanguageCode } from "../i18n";

/** Custom event fired on <document> whenever the language changes. */
export const LANGUAGE_CHANGE_EVENT = "algo:languagechange";
/** Custom event fired on <document> whenever the view mode changes. */
export const VIEW_MODE_CHANGE_EVENT = "algo:viewmodechange";

let current: Prefs = DEFAULT_PREFS;

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Initializes client preferences from validated localStorage, falling back to
 * system preference for the initial theme/language when nothing is stored.
 */
export function initPrefs(onReset?: () => void): Prefs {
  const stored = readPrefs(onReset ? () => onReset() : undefined);
  current = stored;
  applyTheme(current.theme);
  applyLanguage(current.language as LanguageCode);
  return current;
}

export function getPrefs(): Prefs {
  return current;
}

export function setTheme(theme: Theme): void {
  current = { ...current, theme };
  applyTheme(theme);
  writePrefs(current);
}

export function toggleTheme(): void {
  setTheme(current.theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
}

export function setLanguage(language: Language): void {
  current = { ...current, language };
  applyLanguage(language as LanguageCode);
  writePrefs(current);
  document.dispatchEvent(
    new CustomEvent<LanguageCode>(LANGUAGE_CHANGE_EVENT, {
      detail: language as LanguageCode,
    })
  );
}

export function setViewMode(viewMode: ViewMode): void {
  current = { ...current, viewMode };
  writePrefs(current);
  document.dispatchEvent(
    new CustomEvent<ViewMode>(VIEW_MODE_CHANGE_EVENT, { detail: viewMode })
  );
}
