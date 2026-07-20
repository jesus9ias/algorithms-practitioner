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
 * kept in lockstep with exercise.js and exercise.pseudo. A scan step highlights
 * the loop header and the XOR update; the empty guard (no iterations at all)
 * and the terminal done step both highlight the initializer and the return,
 * since with zero (or with every) iteration those are the only two lines that
 * matter to the trace.
 */
const JS_LINE = {
  init: 12,
  loop: 14,
  xor: 15,
  returnResult: 18,
} as const;

const PSEUDO_LINE = {
  init: 2,
  loop: 4,
  xor: 5,
  returnResult: 7,
} as const;

const EMPTY_LINES: CodeLines = {
  js: [JS_LINE.init, JS_LINE.returnResult],
  pseudo: [PSEUDO_LINE.init, PSEUDO_LINE.returnResult],
};

const SCAN_LINES: CodeLines = {
  js: [JS_LINE.loop, JS_LINE.xor],
  pseudo: [PSEUDO_LINE.loop, PSEUDO_LINE.xor],
};

const DONE_LINES: CodeLines = {
  js: [JS_LINE.returnResult],
  pseudo: [PSEUDO_LINE.returnResult],
};

type StepKind = "empty" | "scan" | "done";

export interface SnStep {
  /** Element index just XORed in; -1 for the empty guard and the terminal done step. */
  readonly index: number;
  readonly value: number;
  /** Running XOR after this step. */
  readonly result: number;
  readonly kind: StepKind;
}

const VIEW_W = 640;
const VIEW_H = 170;
const CELL_GAP = 8;
const CELL_Y = 56;
const CELL_H = 48;
const LABEL_Y = 134;
const READOUT_Y = 28;

/**
 * Pure step model for single-number. Independently simulates the running XOR
 * (it does not import the exercise function) and returns the trace plus the
 * final value, so tests can assert this result matches `singleNumber`.
 */
export function buildSteps(input: VizInput): { steps: SnStep[]; result: number } {
  const values = [...input.values];
  const steps: SnStep[] = [];

  if (values.length === 0) {
    steps.push({ index: -1, value: 0, result: 0, kind: "empty" });
    return { steps, result: 0 };
  }

  let result = 0;
  values.forEach((value, index) => {
    result ^= value;
    steps.push({ index, value, result, kind: "scan" });
  });
  steps.push({ index: -1, value: 0, result, kind: "done" });

  return { steps, result };
}

/** Single-number visualization: an array XORed left to right into a running result. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const { steps, result } = buildSteps(input);
  const INITIAL_STEP: SnStep = { index: -1, value: 0, result: 0, kind: "empty" };
  const renderable: SnStep[] = [INITIAL_STEP, ...steps];

  const count = Math.max(values.length, 1);
  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-scan state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      if (step.kind === "empty") {
        return { key: "empty" };
      }
      if (step.kind === "done") {
        return { key: "done", params: { result: step.result } };
      }
      return { key: "scan", params: { index: step.index, value: step.value, result: step.result } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-scan state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      if (step.kind === "empty") return EMPTY_LINES;
      if (step.kind === "done") return DONE_LINES;
      return SCAN_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      values.forEach((value, index) => {
        const processed = step.kind === "done" || (step.kind === "scan" && index <= step.index);
        const isCurrent = step.kind === "scan" && index === step.index;
        const isAnswer = step.kind === "done" && value === step.result;
        let fill = "var(--viz-cell)";
        if (processed) fill = "var(--viz-range)";
        if (isCurrent) fill = "var(--viz-mid)";
        if (isAnswer) fill = "var(--viz-found)";

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

      if (step.kind !== "empty") {
        g.appendChild(
          text(`result = ${step.result}`, {
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
