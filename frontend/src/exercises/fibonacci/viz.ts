import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" at each step kind, by code mode. 1-based, kept
 * in lockstep with exercise.js and exercise.pseudo. A `call` step highlights
 * the function entry plus the base-case check (the outcome isn't known yet);
 * `base`/`cacheHit` highlight their one-line short-circuit return; `compute`
 * highlights the recursive sum, the memo write, and the return.
 */
const JS_LINE = {
  topLevel: 11,
  fnDef: 14,
  baseCheck: 15,
  cacheCheck: 16,
  recurse: 17,
  memoSet: 18,
  returnValue: 19,
} as const;

const PSEUDO_LINE = {
  topCheck: 2,
  topReturn: 3,
  fnDef: 6,
  baseCheck: 7,
  baseReturn: 8,
  cacheCheck: 9,
  cacheReturn: 10,
  recurse: 11,
  memoSet: 12,
  returnValue: 13,
} as const;

export type FibStepKind = "shortCircuit" | "call" | "base" | "cacheHit" | "compute";

export interface FibStep {
  readonly index: number;
  readonly kind: FibStepKind;
  /** The value resolved at this step; `null` for a `call` (outcome not known yet). */
  readonly value: number | null;
  /** Snapshot of the memo table (index -> resolved value, or `null` if unsolved) after this step. */
  readonly memo: readonly (number | null)[];
  readonly leftIndex?: number;
  readonly rightIndex?: number;
  readonly left?: number;
  readonly right?: number;
}

const VIEW_W = 640;
const VIEW_H = 160;
const CELL_GAP = 8;
const CELL_Y = 50;
const CELL_H = 48;
const POINTER_Y = 30;
const LABEL_Y = 130;

/**
 * Pure step model for memoized recursive Fibonacci. Independently simulates the
 * top-down recursion (it does not import the exercise function) and returns the
 * trace plus the final result, so tests can assert this result matches
 * `fibonacci`.
 */
export function buildSteps(input: VizInput): { steps: FibStep[]; result: number } {
  const n = input.scalar ?? 0;

  if (n <= 0) {
    return {
      steps: [{ index: 0, kind: "shortCircuit", value: 0, memo: [0] }],
      result: 0,
    };
  }

  const memo: (number | null)[] = new Array(n + 1).fill(null);
  const steps: FibStep[] = [];

  function fib(k: number): number {
    steps.push({ index: k, kind: "call", value: null, memo: [...memo] });

    if (k <= 1) {
      memo[k] = k;
      steps.push({ index: k, kind: "base", value: k, memo: [...memo] });
      return k;
    }

    const cached = memo[k];
    if (cached !== null) {
      steps.push({ index: k, kind: "cacheHit", value: cached, memo: [...memo] });
      return cached;
    }

    const left = fib(k - 1);
    const right = fib(k - 2);
    const value = left + right;
    memo[k] = value;
    steps.push({
      index: k,
      kind: "compute",
      value,
      memo: [...memo],
      leftIndex: k - 1,
      rightIndex: k - 2,
      left,
      right,
    });
    return value;
  }

  return { steps, result: fib(n) };
}

/** Fibonacci visualization: a memo-table row of cells for indices 0..n. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const n = input.scalar ?? 0;
  const { steps, result } = buildSteps(input);
  const count = Math.max(n, 0) + 1;
  const INITIAL_STEP: FibStep = {
    index: -1,
    kind: "call",
    value: null,
    memo: new Array(count).fill(null),
  };
  const renderable: FibStep[] = [INITIAL_STEP, ...steps];

  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-recursion state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "shortCircuit":
          return { key: "shortCircuit" };
        case "call":
          return { key: "call", params: { index: step.index } };
        case "base":
          return { key: "base", params: { index: step.index, value: step.value ?? 0 } };
        case "cacheHit":
          return { key: "cacheHit", params: { index: step.index, value: step.value ?? 0 } };
        case "compute":
          return {
            key: "compute",
            params: {
              index: step.index,
              leftIndex: step.leftIndex ?? 0,
              rightIndex: step.rightIndex ?? 0,
              left: step.left ?? 0,
              right: step.right ?? 0,
              value: step.value ?? 0,
            },
          };
        default:
          return null;
      }
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-recursion state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "shortCircuit":
          return { js: [JS_LINE.topLevel], pseudo: [PSEUDO_LINE.topCheck, PSEUDO_LINE.topReturn] };
        case "call":
          return {
            js: [JS_LINE.fnDef, JS_LINE.baseCheck],
            pseudo: [PSEUDO_LINE.fnDef, PSEUDO_LINE.baseCheck],
          };
        case "base":
          return { js: [JS_LINE.baseCheck], pseudo: [PSEUDO_LINE.baseCheck, PSEUDO_LINE.baseReturn] };
        case "cacheHit":
          return { js: [JS_LINE.cacheCheck], pseudo: [PSEUDO_LINE.cacheCheck, PSEUDO_LINE.cacheReturn] };
        case "compute":
          return {
            js: [JS_LINE.recurse, JS_LINE.memoSet, JS_LINE.returnValue],
            pseudo: [PSEUDO_LINE.recurse, PSEUDO_LINE.memoSet, PSEUDO_LINE.returnValue],
          };
        default:
          return null;
      }
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      for (let index = 0; index < count; index += 1) {
        const value = step.memo[index] ?? null;
        const isActive = index === step.index;
        let fill = "var(--viz-cell)";
        if (isActive) {
          fill = step.kind === "call" ? "var(--viz-mid)" : "var(--viz-found)";
        } else if (value !== null) {
          fill = "var(--viz-range)";
        }

        g.appendChild(
          rect({
            x: cellX(index),
            y: CELL_Y,
            width: cellW,
            height: CELL_H,
            rx: 6,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(value === null ? "?" : String(value), {
            x: cellX(index) + cellW / 2,
            y: CELL_Y + CELL_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 18,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(index), {
            x: cellX(index) + cellW / 2,
            y: LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 12,
          })
        );
      }

      if (step.index >= 0 && step.index < count) {
        g.appendChild(
          text("fib", {
            x: cellX(step.index) + cellW / 2,
            y: POINTER_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 13,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
