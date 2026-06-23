import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of step, by code mode. 1-based,
 * kept in lockstep with exercise.js and exercise.pseudo. The first window step
 * highlights the initial-sum loop and the first push; every slide step
 * highlights the slide loop header, the running-sum update, and the push.
 */
const JS_LINE = {
  firstLoop: 18,
  firstAccumulate: 19,
  firstPush: 21,
  slideLoop: 23,
  slideUpdate: 24,
  slidePush: 25,
} as const;

const PSEUDO_LINE = {
  firstLoop: 8,
  firstAccumulate: 9,
  firstPush: 10,
  slideLoop: 12,
  slideUpdate: 13,
  slidePush: 14,
} as const;

const FIRST_WINDOW_LINES: CodeLines = {
  js: [JS_LINE.firstLoop, JS_LINE.firstAccumulate, JS_LINE.firstPush],
  pseudo: [PSEUDO_LINE.firstLoop, PSEUDO_LINE.firstAccumulate, PSEUDO_LINE.firstPush],
};

const SLIDE_LINES: CodeLines = {
  js: [JS_LINE.slideLoop, JS_LINE.slideUpdate, JS_LINE.slidePush],
  pseudo: [PSEUDO_LINE.slideLoop, PSEUDO_LINE.slideUpdate, PSEUDO_LINE.slidePush],
};

type StepKind = "firstWindow" | "slide";

export interface AvgStep {
  /** Window bounds, inclusive. `start < 0` marks the pre-algorithm state. */
  readonly start: number;
  readonly end: number;
  readonly sum: number;
  readonly avg: number;
  readonly kind: StepKind;
  /** Value entering the window on a slide (undefined on the first window). */
  readonly added?: number;
  /** Value leaving the window on a slide (undefined on the first window). */
  readonly removed?: number;
}

const VIEW_W = 640;
const VIEW_H = 170;
const CELL_GAP = 8;
const CELL_Y = 56;
const CELL_H = 48;
const LABEL_Y = 134;
const READOUT_Y = 28;

/** Rounds a number to two decimals (mirrors exercise.js `round2`). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pure step model for the running average. Independently simulates the sliding
 * running sum (it does not import the exercise function) and returns the trace
 * plus the array of per-window averages, so tests can assert this result matches
 * `runningAverage`.
 */
export function buildSteps(input: VizInput): { steps: AvgStep[]; result: number[] } {
  const values = [...input.values];
  // The window size `w` rides on the optional numeric target; with none, fall
  // back to the whole array (a single window over every element).
  const w = input.target ?? values.length;
  const steps: AvgStep[] = [];
  const result: number[] = [];

  if (w <= 0 || w > values.length) {
    return { steps, result };
  }

  let sum = 0;
  for (let i = 0; i < w; i += 1) {
    sum += values[i];
  }
  let avg = round2(sum / w);
  result.push(avg);
  steps.push({ start: 0, end: w - 1, sum, avg, kind: "firstWindow" });

  for (let i = w; i < values.length; i += 1) {
    sum += values[i] - values[i - w];
    avg = round2(sum / w);
    result.push(avg);
    steps.push({
      start: i - w + 1,
      end: i,
      sum,
      avg,
      kind: "slide",
      added: values[i],
      removed: values[i - w],
    });
  }

  return { steps, result };
}

/** Running-average visualization: a linear array with a highlighted window. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const { steps, result } = buildSteps(input);
  const INITIAL_STEP: AvgStep = { start: -1, end: -1, sum: 0, avg: 0, kind: "firstWindow" };
  const renderable: AvgStep[] = [INITIAL_STEP, ...steps];

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
      const avg = step.avg.toFixed(2);
      if (step.kind === "firstWindow") {
        return { key: "firstWindow", params: { start: step.start, end: step.end, sum: step.sum, avg } };
      }
      return {
        key: "slide",
        params: { added: step.added ?? 0, removed: step.removed ?? 0, sum: step.sum, avg },
      };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-algorithm state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return step.kind === "firstWindow" ? FIRST_WINDOW_LINES : SLIDE_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      values.forEach((value, index) => {
        const inWindow = step.start >= 0 && index >= step.start && index <= step.end;
        const isEntering = step.kind === "slide" && index === step.end;
        let fill = "var(--viz-cell)";
        if (inWindow) fill = "var(--viz-range)";
        if (isEntering) fill = "var(--viz-mid)";

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

      // Running-sum / average readout, shown once a window has formed.
      if (step.start >= 0) {
        g.appendChild(
          text(`sum = ${step.sum}    avg = ${step.avg.toFixed(2)}`, {
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
