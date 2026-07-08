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
 * in lockstep with exercise.js and exercise.pseudo. `empty` is the length-0
 * guard, `init` seeds currentSum/maxSum from the first element, `extend`/
 * `reset` are the loop body (the running-sum update, plus the max-tracking
 * update when a step raises maxSum), and `done` is the final return.
 */
const JS_LINE = {
  emptyCheck: 11,
  emptyReturn: 12,
  init: [15, 16],
  loopHeader: 18,
  update: 19,
  updateMax: 20,
  returnValue: 23,
} as const;

const PSEUDO_LINE = {
  emptyCheck: 2,
  emptyReturn: 3,
  init: [5, 6],
  loopHeader: 8,
  update: 9,
  updateMax: 10,
  returnValue: 12,
} as const;

const EMPTY_LINES: CodeLines = {
  js: [JS_LINE.emptyCheck, JS_LINE.emptyReturn],
  pseudo: [PSEUDO_LINE.emptyCheck, PSEUDO_LINE.emptyReturn],
};

const INIT_LINES: CodeLines = {
  js: [...JS_LINE.init],
  pseudo: [...PSEUDO_LINE.init],
};

const STEP_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.update],
  pseudo: [PSEUDO_LINE.loopHeader, PSEUDO_LINE.update],
};

const STEP_NEW_MAX_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.update, JS_LINE.updateMax],
  pseudo: [PSEUDO_LINE.loopHeader, PSEUDO_LINE.update, PSEUDO_LINE.updateMax],
};

const DONE_LINES: CodeLines = {
  js: [JS_LINE.returnValue],
  pseudo: [PSEUDO_LINE.returnValue],
};

export type MsaStepKind = "empty" | "init" | "extend" | "reset" | "done";

export interface MsaStep {
  readonly index: number;
  readonly value: number;
  /** Bounds of the running (Kadane) subarray ending at `index`, inclusive. */
  readonly currentStart: number;
  readonly currentEnd: number;
  readonly currentSum: number;
  /** Bounds of the best subarray found so far, inclusive. */
  readonly maxStart: number;
  readonly maxEnd: number;
  readonly maxSum: number;
  readonly kind: MsaStepKind;
  /** Whether this step raised maxSum to a new best. */
  readonly isNewMax: boolean;
}

const VIEW_W = 640;
const VIEW_H = 170;
const CELL_GAP = 8;
const CELL_Y = 56;
const CELL_H = 48;
const LABEL_Y = 134;
const READOUT_Y = 28;

/**
 * Pure step model for Kadane's algorithm. Independently simulates the running
 * sum (it does not import the exercise function) and returns the trace plus
 * the maximum subarray sum, so tests can assert this result matches
 * `maxSubArray`.
 */
export function buildSteps(input: VizInput): { steps: MsaStep[]; result: number } {
  const values = [...input.values];

  if (values.length === 0) {
    return {
      steps: [
        {
          index: -1,
          value: 0,
          currentStart: -1,
          currentEnd: -1,
          currentSum: 0,
          maxStart: -1,
          maxEnd: -1,
          maxSum: 0,
          kind: "empty",
          isNewMax: false,
        },
      ],
      result: 0,
    };
  }

  const steps: MsaStep[] = [];
  let currentStart = 0;
  let currentSum = values[0];
  let maxSum = values[0];
  let maxStart = 0;
  let maxEnd = 0;

  steps.push({
    index: 0,
    value: values[0],
    currentStart,
    currentEnd: 0,
    currentSum,
    maxStart,
    maxEnd,
    maxSum,
    kind: "init",
    isNewMax: true,
  });

  for (let i = 1; i < values.length; i += 1) {
    const extended = currentSum + values[i];
    const kind: MsaStepKind = values[i] >= extended ? "reset" : "extend";
    if (kind === "reset") {
      currentStart = i;
      currentSum = values[i];
    } else {
      currentSum = extended;
    }

    let isNewMax = false;
    if (currentSum > maxSum) {
      maxSum = currentSum;
      maxStart = currentStart;
      maxEnd = i;
      isNewMax = true;
    }

    steps.push({
      index: i,
      value: values[i],
      currentStart,
      currentEnd: i,
      currentSum,
      maxStart,
      maxEnd,
      maxSum,
      kind,
      isNewMax,
    });
  }

  steps.push({
    index: values.length - 1,
    value: values[values.length - 1],
    currentStart,
    currentEnd: values.length - 1,
    currentSum,
    maxStart,
    maxEnd,
    maxSum,
    kind: "done",
    isNewMax: false,
  });

  return { steps, result: maxSum };
}

/**
 * Max-subarray visualization: a linear array with the running (Kadane) window
 * and the best-so-far window both highlighted, plus a live sum readout.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const { steps, result } = buildSteps(input);
  const INITIAL_STEP: MsaStep = {
    index: -1,
    value: 0,
    currentStart: -1,
    currentEnd: -1,
    currentSum: 0,
    maxStart: -1,
    maxEnd: -1,
    maxSum: 0,
    kind: "init",
    isNewMax: false,
  };
  const renderable: MsaStep[] = [INITIAL_STEP, ...steps];

  const count = Math.max(values.length, 1);
  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-algorithm state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "empty":
          return { key: "empty" };
        case "init":
          return { key: "init", params: { value: step.value } };
        case "extend":
          return {
            key: step.isNewMax ? "extendNewMax" : "extend",
            params: { index: step.index, value: step.value, sum: step.currentSum },
          };
        case "reset":
          return {
            key: step.isNewMax ? "resetNewMax" : "reset",
            params: { index: step.index, value: step.value, sum: step.currentSum },
          };
        case "done":
          return {
            key: "done",
            params: { value: step.maxSum, start: step.maxStart, end: step.maxEnd },
          };
        default:
          return null;
      }
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-algorithm state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      switch (step.kind) {
        case "empty":
          return EMPTY_LINES;
        case "init":
          return INIT_LINES;
        case "extend":
        case "reset":
          return step.isNewMax ? STEP_NEW_MAX_LINES : STEP_LINES;
        case "done":
          return DONE_LINES;
        default:
          return null;
      }
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      values.forEach((value, index) => {
        const inBest = step.maxStart >= 0 && index >= step.maxStart && index <= step.maxEnd;
        const inCurrent =
          step.currentStart >= 0 && index >= step.currentStart && index <= step.currentEnd;
        const isActive = index === step.index;

        let fill = "var(--viz-cell)";
        if (inCurrent) fill = "var(--viz-range)";
        if (inBest) fill = "var(--viz-found)";
        if (isActive) fill = "var(--viz-mid)";

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
          text(String(value), {
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
      });

      // Running-sum / best-sum readout, shown once the pass has started.
      if (step.index >= 0) {
        g.appendChild(
          text(`current = ${step.currentSum}    best = ${step.maxSum}`, {
            x: VIEW_W / 2,
            y: READOUT_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 15,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
