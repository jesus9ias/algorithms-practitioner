import { resolve } from "./index";
import type { LanguageCode } from "./index";

/**
 * Applies a language to the DOM by re-resolving every element annotated with an
 * i18n data attribute. This enables language switching without a page reload.
 * Text is set via textContent / attribute setters only (no innerHTML).
 */
export function applyLanguage(lang: LanguageCode, root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = resolve(key, lang);
    }
  });

  // Inline localized text (e.g. exercise name/description/link labels) carries
  // both languages on the element itself via data-loc-en / data-loc-es.
  root.querySelectorAll<HTMLElement>("[data-loc-en]").forEach((el) => {
    const value = lang === "es" ? el.dataset.locEs : el.dataset.locEn;
    if (value !== undefined) {
      el.textContent = value;
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key && "placeholder" in el) {
      (el as HTMLInputElement).placeholder = resolve(key, lang);
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (key) {
      el.setAttribute("aria-label", resolve(key, lang));
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (key) {
      el.setAttribute("title", resolve(key, lang));
    }
  });

  if (root === document) {
    document.documentElement.lang = lang;
  }
}
