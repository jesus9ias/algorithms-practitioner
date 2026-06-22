import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of quicksort step, by code mode.
 * 1-based, kept in lockstep with exercise.js and exercise.pseudo. A step marks
 * every line involved in it (loop header + branch taken + pointer updates), so
 * the highlighted lines may be non-contiguous.
 */
const JS_LINE = {
  selectPivot: 26,
  initBoundary: 27,
  loop: 28,
  compare: 29,
  swapLess: 30,
  advanceBoundary: 31,
  placePivot: 34,
  returnBoundary: 35,
} as const;

const PSEUDO_LINE = {
  selectPivot: 14,
  initBoundary: 15,
  loop: 16,
  compare: 17,
  swapLess: 18,
  advanceBoundary: 19,
  placePivot: 20,
  returnBoundary: 21,
} as const;

const PIVOT_LINES: CodeLines = {
  js: [JS_LINE.selectPivot, JS_LINE.initBoundary, JS_LINE.loop],
  pseudo: [PSEUDO_LINE.selectPivot, PSEUDO_LINE.initBoundary, PSEUDO_LINE.loop],
};
const LESS_LINES: CodeLines = {
  js: [JS_LINE.loop, JS_LINE.compare, JS_LINE.swapLess, JS_LINE.advanceBoundary],
  pseudo: [PSEUDO_LINE.loop, PSEUDO_LINE.compare, PSEUDO_LINE.swapLess, PSEUDO_LINE.advanceBoundary],
};
const GREATER_LINES: CodeLines = {
  js: [JS_LINE.loop, JS_LINE.compare],
  pseudo: [PSEUDO_LINE.loop, PSEUDO_LINE.compare],
};
const PLACE_LINES: CodeLines = {
  js: [JS_LINE.placePivot, JS_LINE.returnBoundary],
  pseudo: [PSEUDO_LINE.placePivot, PSEUDO_LINE.returnBoundary],
};

/** Role of each bar at a given step, mapped to a `--viz-*` color in renderStep. */
const enum Role {
  Unprocessed,
  Less,
  Greater,
  Pivot,
  Compare,
  Sorted,
}

type StepKind = "pivot" | "less" | "greaterEqual" | "place" | "done";

export interface SortStep {
  /** Snapshot of the array at this step (positions reflect swaps so far). */
  readonly array: readonly number[];
  /** Per-index role, one entry per array slot. */
  readonly roles: readonly Role[];
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
}

const ROLE_FILL: Record<Role, string> = {
  [Role.Unprocessed]: "var(--viz-cell)",
  [Role.Less]: "var(--viz-less)",
  [Role.Greater]: "var(--viz-greater)",
  [Role.Pivot]: "var(--viz-pivot)",
  [Role.Compare]: "var(--viz-compare)",
  [Role.Sorted]: "var(--viz-sorted)",
};

const VIEW_W = 640;
const VIEW_H = 220;
const BAR_GAP = 8;
const BASELINE_Y = 185;
const TOP_PAD = 40;
const MIN_BAR_H = 10;

/**
 * Pure step model for quicksort. Independently simulates Lomuto-partition
 * quicksort (it does not import the exercise function), recording one step per
 * pivot selection, per comparison, and per pivot placement, plus a terminal
 * "done" step. Returns the trace and the final sorted array, so tests can assert
 * this result matches `quickSort`.
 */
export function buildSteps(input: VizInput): { steps: SortStep[]; result: number[] } {
  const arr = [...input.values];
  const n = arr.length;
  const steps: SortStep[] = [];
  const placed = new Array<boolean>(n).fill(false);

  const pushStep = (
    kind: StepKind,
    params: Record<string, number>,
    decorate: (roles: Role[]) => void
  ): void => {
    const roles = placed.map((p) => (p ? Role.Sorted : Role.Unprocessed));
    decorate(roles);
    steps.push({ array: [...arr], roles, kind, params });
  };

  const swap = (a: number, b: number): void => {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  };

  const partition = (lo: number, hi: number): number => {
    const pivot = arr[hi];
    pushStep("pivot", { pivot, lo, hi }, (roles) => {
      roles[hi] = Role.Pivot;
    });

    let boundary = lo;
    for (let j = lo; j < hi; j += 1) {
      const value = arr[j];
      const isLess = value < pivot;
      const scanned = boundary;
      const cursor = j;
      pushStep(isLess ? "less" : "greaterEqual", { value, pivot }, (roles) => {
        roles[hi] = Role.Pivot;
        for (let k = lo; k < scanned; k += 1) roles[k] = Role.Less;
        for (let k = scanned; k < cursor; k += 1) roles[k] = Role.Greater;
        roles[cursor] = Role.Compare;
      });
      if (isLess) {
        swap(boundary, j);
        boundary += 1;
      }
    }

    swap(boundary, hi);
    const finalIndex = boundary;
    pushStep("place", { pivot, index: finalIndex }, (roles) => {
      for (let k = lo; k < finalIndex; k += 1) roles[k] = Role.Less;
      for (let k = finalIndex + 1; k <= hi; k += 1) roles[k] = Role.Greater;
      roles[finalIndex] = Role.Pivot;
    });
    placed[finalIndex] = true;
    return finalIndex;
  };

  const sort = (lo: number, hi: number): void => {
    if (lo > hi) {
      return;
    }
    if (lo === hi) {
      // A single-element range is already in its final position.
      placed[lo] = true;
      return;
    }
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  };

  if (n > 0) {
    sort(0, n - 1);
    pushStep("done", {}, (roles) => {
      for (let k = 0; k < n; k += 1) roles[k] = Role.Sorted;
    });
  }

  return { steps, result: [...arr] };
}

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  pivot: PIVOT_LINES,
  less: LESS_LINES,
  greaterEqual: GREATER_LINES,
  place: PLACE_LINES,
  done: null,
};

/** Quicksort visualization: a value-scaled bar chart re-ordered as swaps happen. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];
  const count = Math.max(values.length, 1);
  const maxValue = Math.max(...values, 1);

  // Step 0 is the initial, undecorated array (all unprocessed); the algorithm
  // steps follow.
  const initial: SortStep = {
    array: values,
    roles: values.map(() => Role.Unprocessed),
    kind: "pivot",
    params: {},
  };
  const renderable: SortStep[] = [initial, ...steps];

  const barW = (VIEW_W - BAR_GAP * (count + 1)) / count;
  const barX = (index: number): number => BAR_GAP + index * (barW + BAR_GAP);
  const barH = (value: number): number =>
    Math.max(MIN_BAR_H, (value / maxValue) * (BASELINE_Y - TOP_PAD));

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return { key: step.kind, params: step.params };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the initial state; nothing executes.
      if (stepIndex <= 0) {
        return null;
      }
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
        const isCompare = role === Role.Compare;

        g.appendChild(
          rect({
            x: barX(index),
            y,
            width: barW,
            height,
            rx: 4,
            fill: ROLE_FILL[role],
            stroke: isCompare ? "var(--viz-mid-label)" : "var(--viz-stroke)",
            "stroke-width": isCompare ? 2.5 : 1,
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
