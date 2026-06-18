import { PERCENT_SCALE } from "./constants";

/** Progress summary for the home page progress bar. */
export interface Progress {
  readonly percent: number;
  readonly label: string;
}

/**
 * Computes learning progress from the learned list and the total exercise count.
 * `percent` is rounded to the nearest integer; `label` is "<learned> / <total>".
 */
export function computeProgress(
  learned: readonly string[],
  total: number
): Progress {
  const count = learned.length;
  const percent =
    total <= 0 ? 0 : Math.round((count / total) * PERCENT_SCALE);
  return { percent, label: `${count} / ${total}` };
}
