/** Application-wide numeric/string constants (no magic numbers in code). */

/** Maximum number of elements accepted in a user-provided input array. */
export const MAX_INPUT_LENGTH = 10000;

/** Minimum number of elements required in a user-provided input array. */
export const MIN_INPUT_LENGTH = 1;

/** Fixed interval between steps during auto playback, in milliseconds. */
export const AUTO_PLAY_INTERVAL_MS = 1000;

/** Duration the "Copied!" confirmation indicator stays visible, in ms. */
export const COPY_FEEDBACK_MS = 1500;

/** Percentage scale used by the progress calculation. */
export const PERCENT_SCALE = 100;

/** First step index for any visualization. */
export const FIRST_STEP_INDEX = 0;

/** Fallback default language when the browser language is not supported. */
export const DEFAULT_LANGUAGE = "en";

/** localStorage key prefix used to namespace all application keys. */
export const STORAGE_PREFIX = "algo_";
