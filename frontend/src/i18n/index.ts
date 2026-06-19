import { Language } from "../lib/constants";
import type { LocalizedText } from "../lib/types";
import en from "./en.json";
import es from "./es.json";

/** Concrete language code strings ("en" | "es"). */
export type LanguageCode = `${Language}`;

/** Picks the string for the given language from an inline LocalizedText. */
export function localize(text: LocalizedText, lang: LanguageCode): string {
  return text[lang] ?? text[Language.EN];
}

type Dictionary = Record<string, unknown>;

const dictionaries: Record<LanguageCode, Dictionary> = {
  [Language.EN]: en as Dictionary,
  [Language.ES]: es as Dictionary,
};

/**
 * Resolves a dotted i18n key (e.g. "exercises.binarySearch.name") for a given
 * language. Returns the key itself as a fallback when the key is unknown or the
 * resolved value is not a string (T-I18N-04).
 */
export function resolve(key: string, lang: LanguageCode): string {
  const dictionary = dictionaries[lang] ?? dictionaries[Language.EN];
  let current: unknown = dictionary;

  for (const part of key.split(".")) {
    if (current !== null && typeof current === "object" && part in current) {
      current = (current as Dictionary)[part];
    } else {
      return key;
    }
  }

  return typeof current === "string" ? current : key;
}

/**
 * Substitutes `{name}` placeholders in a template with the matching `params`
 * value. Unknown placeholders are left untouched. Used to fill dynamic values
 * (e.g. `{mid}`, `{target}`) into step-detail message templates.
 */
export function interpolate(
  template: string,
  params?: Readonly<Record<string, string | number>>
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
