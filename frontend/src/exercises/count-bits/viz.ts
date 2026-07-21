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
 * in lockstep with exercise.js and exercise.pseudo. The `empty` guard (n <= 0)
 * highlights its one-line short-circuit return; `clear` highlights the loop
 * header plus the AND-clear and count-increment it performs each iteration;
 * `done` highlights the final return once the loop condition goes false.
 */
const JS_LINE = {
  guard: 13,
  loopHeader: 18,
  clearBit: 19,
  countIncrement: 20,
  returnValue: 23,
} as const;

const PSEUDO_LINE = {
  guardCheck: 2,
  guardReturn: 3,
  loopHeader: 8,
  clearBit: 9,
  countIncrement: 10,
  returnValue: 12,
} as const;

const EMPTY_LINES: CodeLines = {
  js: [JS_LINE.guard],
  pseudo: [PSEUDO_LINE.guardCheck, PSEUDO_LINE.guardReturn],
};

const CLEAR_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.clearBit, JS_LINE.countIncrement],
  pseudo: [PSEUDO_LINE.loopHeader, PSEUDO_LINE.clearBit, PSEUDO_LINE.countIncrement],
};

const DONE_LINES: CodeLines = {
  js: [JS_LINE.returnValue],
  pseudo: [PSEUDO_LINE.returnValue],
};

type StepKind = "empty" | "clear" | "done";

export interface CbStep {
  /** Bit position (0-based from the LSB) cleared this step; -1 for the empty guard and the terminal done step. */
  readonly bitIndex: number;
  /** Running count of cleared (set) bits after this step. */
  readonly count: number;
  /** Value of `remaining` after this step's clear (or the untouched input for the empty/initial state). */
  readonly remaining: number;
  readonly kind: StepKind;
}

const VIEW_W = 640;
const VIEW_H = 170;
const CELL_GAP = 8;
const CELL_Y = 56;
const CELL_H = 48;
const LABEL_Y = 134;
const READOUT_Y = 28;

/** Number of bits needed to display n (at least 1, so n = 0 still renders one cell). */
function bitWidthFor(n: number): number {
  return n <= 0 ? 1 : Math.floor(Math.log2(n)) + 1;
}

/**
 * Pure step model for count-bits. Independently simulates Brian Kernighan's
 * lowest-set-bit-clearing loop (it does not import the exercise function) and
 * returns the trace plus the final count, so tests can assert this result
 * matches `countBits`.
 */
export function buildSteps(input: VizInput): { steps: CbStep[]; result: number } {
  const n = input.scalar ?? 0;

  if (n <= 0) {
    return { steps: [{ bitIndex: -1, count: 0, remaining: 0, kind: "empty" }], result: 0 };
  }

  const steps: CbStep[] = [];
  let remaining = n;
  let count = 0;

  while (remaining !== 0) {
    const bitIndex = Math.log2(remaining & -remaining);
    remaining &= remaining - 1;
    count += 1;
    steps.push({ bitIndex, count, remaining, kind: "clear" });
  }

  steps.push({ bitIndex: -1, count, remaining, kind: "done" });

  return { steps, result: count };
}

/** Count-bits visualization: a row of n's bit cells, cleared lowest-set-bit-first with a running count readout. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const n = input.scalar ?? 0;
  const { steps, result } = buildSteps(input);
  const width = bitWidthFor(n);
  const INITIAL_STEP: CbStep = { bitIndex: -1, count: 0, remaining: n, kind: "empty" };
  const renderable: CbStep[] = [INITIAL_STEP, ...steps];

  const cellW = (VIEW_W - CELL_GAP * (width + 1)) / width;
  const cellX = (position: number): number => CELL_GAP + position * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-loop state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      if (step.kind === "empty") {
        return { key: "empty" };
      }
      if (step.kind === "done") {
        return { key: "done", params: { count: step.count } };
      }
      return { key: "clear", params: { index: step.bitIndex, count: step.count } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-loop state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      if (step.kind === "empty") return EMPTY_LINES;
      if (step.kind === "done") return DONE_LINES;
      return CLEAR_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      for (let position = 0; position < width; position += 1) {
        // Positions are laid out MSB (leftmost) to LSB (rightmost).
        const bitPosition = width - 1 - position;
        const wasSet = n > 0 && ((n >> bitPosition) & 1) === 1;
        const stillSet = wasSet && ((step.remaining >> bitPosition) & 1) === 1;
        const isActive = step.kind === "clear" && bitPosition === step.bitIndex;
        const digit = wasSet ? "1" : "0";

        let fill = "var(--viz-cell)";
        if (wasSet) fill = "var(--viz-range)";
        if (isActive) fill = "var(--viz-mid)";
        if (wasSet && !stillSet && !isActive) fill = "var(--viz-found)";

        g.appendChild(
          rect({
            x: cellX(position),
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
          text(digit, {
            x: cellX(position) + cellW / 2,
            y: CELL_Y + CELL_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 18,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(bitPosition), {
            x: cellX(position) + cellW / 2,
            y: LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 12,
          })
        );
      }

      if (step.kind !== "empty") {
        g.appendChild(
          text(`count = ${step.count}`, {
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
