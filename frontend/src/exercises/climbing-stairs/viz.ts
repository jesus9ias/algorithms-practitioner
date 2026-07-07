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
 * in lockstep with exercise.js and exercise.pseudo. Unlike fibonacci's
 * top-down recursion, this is a bottom-up loop: `trivial` is the n <= 1
 * short-circuit, `base` seeds dp[0]/dp[1] (prev/curr), `compute` is one loop
 * iteration, and `done` is the final return after the loop.
 */
const JS_LINE = {
  trivial: 12,
  base0: 14,
  base1: 15,
  loopHeader: 16,
  nextSum: 17,
  prevUpdate: 18,
  currUpdate: 19,
  returnValue: 21,
} as const;

const PSEUDO_LINE = {
  trivialCheck: 2,
  trivialReturn: 3,
  base0: 5,
  base1: 6,
  loopHeader: 7,
  nextSum: 8,
  prevUpdate: 9,
  currUpdate: 10,
  returnValue: 11,
} as const;

export type StairsStepKind = "trivial" | "base" | "compute" | "done";

export interface StairsStep {
  readonly index: number;
  readonly kind: StairsStepKind;
  readonly value: number;
  /** Snapshot of the dp table (index -> resolved ways, or `null` if unfilled) after this step. */
  readonly dp: readonly (number | null)[];
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
 * Pure step model for bottom-up climbing-stairs DP. Independently simulates
 * the iterative tabulation (it does not import the exercise function) and
 * returns the trace plus the final result, so tests can assert this result
 * matches `climbingStairs`.
 */
export function buildSteps(input: VizInput): { steps: StairsStep[]; result: number } {
  const n = input.scalar ?? 0;

  if (n <= 1) {
    return {
      steps: [{ index: Math.max(n, 0), kind: "trivial", value: 1, dp: [1] }],
      result: 1,
    };
  }

  const dp: (number | null)[] = new Array(n + 1).fill(null);
  const steps: StairsStep[] = [];

  dp[0] = 1;
  steps.push({ index: 0, kind: "base", value: 1, dp: [...dp] });

  dp[1] = 1;
  steps.push({ index: 1, kind: "base", value: 1, dp: [...dp] });

  for (let i = 2; i <= n; i += 1) {
    const left = dp[i - 1] as number;
    const right = dp[i - 2] as number;
    const value = left + right;
    dp[i] = value;
    steps.push({
      index: i,
      kind: "compute",
      value,
      dp: [...dp],
      leftIndex: i - 1,
      rightIndex: i - 2,
      left,
      right,
    });
  }

  steps.push({ index: n, kind: "done", value: dp[n] as number, dp: [...dp] });

  return { steps, result: dp[n] as number };
}

/** Climbing-stairs visualization: a dp-table row of cells for indices 0..n, filled left to right. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const n = input.scalar ?? 0;
  const { steps, result } = buildSteps(input);
  const count = Math.max(n, 0) + 1;
  const INITIAL_STEP: StairsStep = {
    index: -1,
    kind: "base",
    value: 0,
    dp: new Array(count).fill(null),
  };
  const renderable: StairsStep[] = [INITIAL_STEP, ...steps];

  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-computation state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "trivial":
          return { key: "trivial", params: { index: step.index, value: step.value } };
        case "base":
          return { key: "base", params: { index: step.index, value: step.value } };
        case "compute":
          return {
            key: "compute",
            params: {
              index: step.index,
              leftIndex: step.leftIndex ?? 0,
              rightIndex: step.rightIndex ?? 0,
              left: step.left ?? 0,
              right: step.right ?? 0,
              value: step.value,
            },
          };
        case "done":
          return { key: "done", params: { value: step.value } };
        default:
          return null;
      }
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-computation state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "trivial":
          return { js: [JS_LINE.trivial], pseudo: [PSEUDO_LINE.trivialCheck, PSEUDO_LINE.trivialReturn] };
        case "base":
          return step.index === 0
            ? { js: [JS_LINE.base0], pseudo: [PSEUDO_LINE.base0] }
            : { js: [JS_LINE.base1], pseudo: [PSEUDO_LINE.base1] };
        case "compute":
          return {
            js: [JS_LINE.loopHeader, JS_LINE.nextSum, JS_LINE.prevUpdate, JS_LINE.currUpdate],
            pseudo: [
              PSEUDO_LINE.loopHeader,
              PSEUDO_LINE.nextSum,
              PSEUDO_LINE.prevUpdate,
              PSEUDO_LINE.currUpdate,
            ],
          };
        case "done":
          return { js: [JS_LINE.returnValue], pseudo: [PSEUDO_LINE.returnValue] };
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
        const value = step.dp[index] ?? null;
        const isActive = index === step.index;
        const isContributing = index === step.leftIndex || index === step.rightIndex;
        let fill = "var(--viz-cell)";
        if (isActive) {
          fill = "var(--viz-found)";
        } else if (isContributing) {
          fill = "var(--viz-mid)";
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
          text("ways", {
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
