import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of merge-sort step, by code mode.
 * 1-based, kept in lockstep with exercise.js and exercise.pseudo. A step marks
 * every line involved in it (loop header + branch taken + pointer update), so
 * the highlighted lines may be non-contiguous.
 */
const JS_LINE = {
  whileLoop: 21,
  ifCompare: 22,
  pushLeft: 23,
  incrI: 24,
  pushRight: 26,
  incrJ: 27,
  concatRemaining: 30,
} as const;

const PSEUDO_LINE = {
  whileLoop: 12,
  ifCompare: 13,
  appendLeft: 14,
  incrI: 15,
  appendRight: 17,
  incrJ: 18,
  appendRemainingLeft: 19,
  appendRemainingRight: 20,
} as const;

const TAKE_LEFT_LINES: CodeLines = {
  js: [JS_LINE.whileLoop, JS_LINE.ifCompare, JS_LINE.pushLeft, JS_LINE.incrI],
  pseudo: [PSEUDO_LINE.whileLoop, PSEUDO_LINE.ifCompare, PSEUDO_LINE.appendLeft, PSEUDO_LINE.incrI],
};
const TAKE_RIGHT_LINES: CodeLines = {
  js: [JS_LINE.whileLoop, JS_LINE.ifCompare, JS_LINE.pushRight, JS_LINE.incrJ],
  pseudo: [PSEUDO_LINE.whileLoop, PSEUDO_LINE.ifCompare, PSEUDO_LINE.appendRight, PSEUDO_LINE.incrJ],
};
const FLUSH_LEFT_LINES: CodeLines = {
  js: [JS_LINE.concatRemaining],
  pseudo: [PSEUDO_LINE.appendRemainingLeft],
};
const FLUSH_RIGHT_LINES: CodeLines = {
  js: [JS_LINE.concatRemaining],
  pseudo: [PSEUDO_LINE.appendRemainingRight],
};

/** Role of each bar at a given step, mapped to a `--viz-*` color in renderStep. */
const enum Role {
  Unprocessed,
  Left,
  Right,
  InMerge,
  Placed,
  Sorted,
}

type StepKind = "takeLeft" | "takeRight" | "flushLeft" | "flushRight" | "done";

export interface MergeSortStep {
  /** Snapshot of the array at this step (display values, reconstructed). */
  readonly array: readonly number[];
  /** Per-index role, one entry per array slot. */
  readonly roles: readonly Role[];
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
}

const ROLE_FILL: Record<Role, string> = {
  [Role.Unprocessed]: "var(--viz-cell)",
  [Role.Left]: "var(--viz-less)",
  [Role.Right]: "var(--viz-greater)",
  [Role.InMerge]: "var(--viz-range)",
  [Role.Placed]: "var(--viz-pivot)",
  [Role.Sorted]: "var(--viz-sorted)",
};

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  takeLeft: TAKE_LEFT_LINES,
  takeRight: TAKE_RIGHT_LINES,
  flushLeft: FLUSH_LEFT_LINES,
  flushRight: FLUSH_RIGHT_LINES,
  done: null,
};

const VIEW_W = 640;
const VIEW_H = 220;
const BAR_GAP = 8;
const BASELINE_Y = 185;
const TOP_PAD = 40;
const MIN_BAR_H = 10;

/**
 * Pure step model for merge sort. Uses top-down divide-and-conquer: recursively
 * sorts each half, then emits one step per element placed during each merge.
 * The display array at each step shows merged elements in place, with remaining
 * left/right elements shown at their conceptual positions (reconstructed from
 * auxiliary buffers so overwrites don't corrupt the visual).
 */
export function buildSteps(input: VizInput): { steps: MergeSortStep[]; result: number[] } {
  const arr = [...input.values];
  const n = arr.length;
  const steps: MergeSortStep[] = [];
  const sorted = new Array<boolean>(n).fill(false);

  if (n <= 1) {
    if (n === 1) sorted[0] = true;
    return { steps, result: [...arr] };
  }

  const mergeRange = (lo: number, mid: number, hi: number): void => {
    const left = arr.slice(lo, mid + 1);
    const right = arr.slice(mid + 1, hi + 1);
    const leftLen = left.length;
    const rightLen = right.length;
    let i = 0;
    let j = 0;
    let k = lo;

    for (let x = lo; x <= hi; x++) sorted[x] = false;

    const buildDisplay = (): number[] => {
      // arr[lo..k-1] is correct (written back). Positions k..hi may be stale
      // due to in-place overwrites, so reconstruct from the auxiliary buffers.
      const display = [...arr];
      let p = k;
      for (let li = i; li < leftLen; li++) display[p++] = left[li];
      for (let ri = j; ri < rightLen; ri++) display[p++] = right[ri];
      return display;
    };

    const pushStep = (kind: StepKind, params: Record<string, number>): void => {
      const display = buildDisplay();
      const placedIdx = k - 1;
      const leftRemaining = leftLen - i;
      const roles: Role[] = display.map((_, idx) => {
        if (idx < lo || idx > hi) return sorted[idx] ? Role.Sorted : Role.Unprocessed;
        if (idx === placedIdx) return Role.Placed;
        if (idx < k) return Role.InMerge;
        if (idx < k + leftRemaining) return Role.Left;
        return Role.Right;
      });
      steps.push({ array: display, roles, kind, params });
    };

    while (i < leftLen && j < rightLen) {
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        k += 1; i += 1;
        pushStep("takeLeft", { leftVal: left[i - 1], rightVal: right[j], pos: k - 1 });
      } else {
        arr[k] = right[j];
        k += 1; j += 1;
        pushStep("takeRight", { leftVal: left[i], rightVal: right[j - 1], pos: k - 1 });
      }
    }
    while (i < leftLen) {
      arr[k] = left[i];
      k += 1; i += 1;
      pushStep("flushLeft", { value: left[i - 1], pos: k - 1 });
    }
    while (j < rightLen) {
      arr[k] = right[j];
      k += 1; j += 1;
      pushStep("flushRight", { value: right[j - 1], pos: k - 1 });
    }

    for (let x = lo; x <= hi; x++) sorted[x] = true;
  };

  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) {
      sorted[lo] = true;
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    mergeRange(lo, mid, hi);
  };

  sort(0, n - 1);

  const doneRoles: Role[] = arr.map(() => Role.Sorted);
  steps.push({ array: [...arr], roles: doneRoles, kind: "done", params: {} });

  return { steps, result: [...arr] };
}

/** Merge-sort visualization: a value-scaled bar chart colored by merge role. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];
  const count = Math.max(values.length, 1);
  const maxValue = Math.max(...values, 1);

  // Step 0 is the initial, undecorated array (all unprocessed).
  const initial: MergeSortStep = {
    array: values,
    roles: values.map(() => Role.Unprocessed),
    kind: "takeLeft",
    params: {},
  };
  const renderable: MergeSortStep[] = [initial, ...steps];

  const barW = (VIEW_W - BAR_GAP * (count + 1)) / count;
  const barX = (index: number): number => BAR_GAP + index * (barW + BAR_GAP);
  const barH = (value: number): number =>
    Math.max(MIN_BAR_H, (value / maxValue) * (BASELINE_Y - TOP_PAD));

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      if (stepIndex <= 0) return null;
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return { key: step.kind, params: step.params };
    },
    codeLines(stepIndex: number): CodeLines | null {
      if (stepIndex <= 0) return null;
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return LINES_BY_KIND[step.kind];
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      g.appendChild(
        line({
          x1: 0,
          y1: BASELINE_Y,
          x2: VIEW_W,
          y2: BASELINE_Y,
          stroke: "var(--viz-stroke)",
          "stroke-width": 1,
        })
      );

      step.array.forEach((value, index) => {
        const role = step.roles[index] ?? Role.Unprocessed;
        const height = barH(value);
        const y = BASELINE_Y - height;
        const isActive = role === Role.Placed;

        g.appendChild(
          rect({
            x: barX(index),
            y,
            width: barW,
            height,
            rx: 4,
            fill: ROLE_FILL[role],
            stroke: isActive ? "var(--viz-mid-label)" : "var(--viz-stroke)",
            "stroke-width": isActive ? 2.5 : 1,
          })
        );
        g.appendChild(
          text(String(value), {
            x: barX(index) + barW / 2,
            y: y - 8,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(index), {
            x: barX(index) + barW / 2,
            y: BASELINE_Y + 18,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 12,
          })
        );
      });

      svg.appendChild(g);
    },
  };
};
