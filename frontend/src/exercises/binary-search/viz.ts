import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

export interface BsStep {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly found: boolean;
}

const VIEW_W = 640;
const VIEW_H = 160;
const CELL_GAP = 8;
const CELL_Y = 50;
const CELL_H = 48;
const POINTER_Y = 30;
const LABEL_Y = 130;

/**
 * Pure step model for binary search. Independently simulates the search (it does
 * not import the exercise function) and returns the trace plus the final index,
 * so tests can assert this result matches `binarySearch`.
 */
export function buildSteps(input: VizInput): { steps: BsStep[]; result: number } {
  const values = [...input.values];
  const target = input.target ?? values[0] ?? 0;
  const steps: BsStep[] = [];
  let lo = 0;
  let hi = values.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const found = values[mid] === target;
    steps.push({ lo, hi, mid, found });
    if (found) {
      result = mid;
      break;
    }
    if (values[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return { steps, result };
}

/** Binary search visualization: a linear array with lo/hi/mid pointers. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const target = input.target ?? values[0] ?? 0;
  const { steps, result } = buildSteps(input);
  const INITIAL_STEP: BsStep = { lo: -1, hi: -1, mid: -1, found: false };
  const algorithmSteps: BsStep[] =
    steps.length > 0 ? steps : [{ lo: 0, hi: values.length - 1, mid: 0, found: false }];
  const renderable: BsStep[] = [INITIAL_STEP, ...algorithmSteps];

  const count = Math.max(values.length, 1);
  const cellW = (VIEW_W - CELL_GAP * (count + 1)) / count;
  const cellX = (index: number): number => CELL_GAP + index * (cellW + CELL_GAP);

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-search state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      const midValue = values[step.mid];
      if (step.found) {
        return { key: "found", params: { mid: midValue, index: step.mid } };
      }
      // midValue < target means the target lies to the right, and vice versa.
      const key = midValue < target ? "compareGreater" : "compareSmaller";
      return { key, params: { mid: midValue, target } };
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      values.forEach((value, index) => {
        const inRange = index >= step.lo && index <= step.hi;
        const isMid = index === step.mid;
        let fill = "var(--viz-cell)";
        if (inRange) fill = "var(--viz-range)";
        if (isMid) fill = step.found ? "var(--viz-found)" : "var(--viz-mid)";

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

      if (step.mid >= 0 && step.mid < values.length) {
        g.appendChild(
          text("mid", {
            x: cellX(step.mid) + cellW / 2,
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
