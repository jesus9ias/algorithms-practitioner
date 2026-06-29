import { clear, rect, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of bubble-sort step, by code mode.
 * 1-based, kept in lockstep with exercise.js and exercise.pseudo. A step marks
 * every line involved in it (loop header + branch taken + swaps), so the
 * highlighted lines may be non-contiguous.
 */
const JS_LINE = {
  outerLoop: 12,
  innerLoop: 14,
  compare: 15,
  swapTemp: 16,
  swapSetA: 17,
  swapSetB: 18,
  setSwapped: 19,
  checkSwapped: 22,
} as const;

const PSEUDO_LINE = {
  outerLoop: 4,
  innerLoop: 6,
  compare: 7,
  swapCall: 8,
  setSwapped: 9,
  checkSwapped: 10,
  breakLine: 11,
} as const;

const COMPARE_LINES: CodeLines = {
  js: [JS_LINE.innerLoop, JS_LINE.compare],
  pseudo: [PSEUDO_LINE.innerLoop, PSEUDO_LINE.compare],
};
const SWAP_LINES: CodeLines = {
  js: [
    JS_LINE.innerLoop,
    JS_LINE.compare,
    JS_LINE.swapTemp,
    JS_LINE.swapSetA,
    JS_LINE.swapSetB,
    JS_LINE.setSwapped,
  ],
  pseudo: [
    PSEUDO_LINE.innerLoop,
    PSEUDO_LINE.compare,
    PSEUDO_LINE.swapCall,
    PSEUDO_LINE.setSwapped,
  ],
};
const PASS_LINES: CodeLines = {
  js: [JS_LINE.outerLoop, JS_LINE.checkSwapped],
  pseudo: [PSEUDO_LINE.outerLoop, PSEUDO_LINE.checkSwapped, PSEUDO_LINE.breakLine],
};

/** Role of each bar at a given step, mapped to a `--viz-*` color in renderStep. */
const enum Role {
  Unprocessed,
  Compare,
  Bubble,
  Sorted,
}

type StepKind = "compare" | "swap" | "pass" | "done";

export interface BubbleSortStep {
  /** Snapshot of the array at this step (swaps already applied). */
  readonly array: readonly number[];
  /** Per-index role, one entry per array slot. */
  readonly roles: readonly Role[];
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
}

const ROLE_FILL: Record<Role, string> = {
  [Role.Unprocessed]: "var(--viz-cell)",
  [Role.Compare]: "var(--viz-compare)",
  [Role.Bubble]: "var(--viz-pivot)",
  [Role.Sorted]: "var(--viz-sorted)",
};

const VIEW_W = 640;
const VIEW_H = 220;
const BAR_GAP = 8;
const BASELINE_Y = 185;
const TOP_PAD = 40;
const MIN_BAR_H = 10;

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  compare: COMPARE_LINES,
  swap: SWAP_LINES,
  pass: PASS_LINES,
  done: null,
};

/**
 * Pure step model for bubble sort. Records one step per adjacent comparison (and
 * swap when needed), one step per completed pass, and a terminal "done" step.
 * Returns the trace and the final sorted array so tests can assert the result
 * matches `bubbleSort`.
 */
export function buildSteps(input: VizInput): { steps: BubbleSortStep[]; result: number[] } {
  const arr = [...input.values];
  const n = arr.length;
  const steps: BubbleSortStep[] = [];
  let alreadySortedCount = 0;

  const pushStep = (
    kind: StepKind,
    params: Record<string, number>,
    decorate: (roles: Role[]) => void
  ): void => {
    const roles: Role[] = arr.map((_, idx) =>
      idx >= n - alreadySortedCount ? Role.Sorted : Role.Unprocessed
    );
    decorate(roles);
    steps.push({ array: [...arr], roles, kind, params });
  };

  const swapArr = (a: number, b: number): void => {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  };

  for (let i = 0; i < n - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j += 1) {
      const left = arr[j];
      const right = arr[j + 1];
      if (left > right) {
        swapArr(j, j + 1);
        swapped = true;
        pushStep("swap", { left, right }, (roles) => {
          // After the swap: arr[j] is the smaller (moved left), arr[j+1] is
          // the larger that just bubbled right.
          roles[j] = Role.Compare;
          roles[j + 1] = Role.Bubble;
        });
      } else {
        pushStep("compare", { left, right }, (roles) => {
          roles[j] = Role.Compare;
          roles[j + 1] = Role.Compare;
        });
      }
    }
    alreadySortedCount += 1;
    const sortedPos = n - alreadySortedCount;
    pushStep("pass", { value: arr[sortedPos], pos: sortedPos, passNum: i + 1 }, () => {
      // Base role computation already marks positions >= sortedPos as Sorted.
    });
    if (!swapped) break;
  }

  if (n > 0) {
    pushStep("done", {}, (roles) => {
      for (let k = 0; k < n; k += 1) roles[k] = Role.Sorted;
    });
  }

  return { steps, result: [...arr] };
}

/** Bubble-sort visualization: a value-scaled bar chart re-ordered as swaps happen. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];
  const count = Math.max(values.length, 1);
  const maxValue = Math.max(...values, 1);

  // Step 0 is the initial, undecorated array (all unprocessed); the algorithm
  // steps follow.
  const initial: BubbleSortStep = {
    array: values,
    roles: values.map(() => Role.Unprocessed),
    kind: "compare",
    params: {},
  };
  const renderable: BubbleSortStep[] = [initial, ...steps];

  const barW = (VIEW_W - BAR_GAP * (count + 1)) / count;
  const barX = (index: number): number => BAR_GAP + index * (barW + BAR_GAP);
  const barH = (value: number): number =>
    Math.max(MIN_BAR_H, (value / maxValue) * (BASELINE_Y - TOP_PAD));

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial state and has no log row.
      if (stepIndex <= 0) return null;
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return { key: step.kind, params: step.params };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the initial state; nothing executes.
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
        const isActive = role === Role.Compare || role === Role.Bubble;

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
