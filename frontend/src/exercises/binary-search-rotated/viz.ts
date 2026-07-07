import { clear, line, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during one search iteration, by code mode.
 * 1-based, kept in lockstep with exercise.js and exercise.pseudo. Every step
 * highlights the loop condition, the mid computation, and the equality check,
 * then either the success return or the sorted-half check plus whichever
 * branch narrows the range — non-`found` steps highlight non-contiguous
 * lines, same pattern as binary-search.
 */
const JS_LINE = {
  whileCond: 14,
  computeMid: 15,
  compareEqual: 16,
  returnMid: 17,
  checkLeftSorted: 20,
  targetInLeftRange: 21,
  lowerHiFromLeft: 22,
  raiseLoFromLeft: 24,
  targetInRightRange: 27,
  raiseLoFromRight: 28,
  lowerHiFromRight: 30,
  returnNotFound: 35,
} as const;

const PSEUDO_LINE = {
  whileCond: 5,
  computeMid: 6,
  compareEqual: 8,
  returnMid: 9,
  checkLeftSorted: 11,
  targetInLeftRange: 12,
  lowerHiFromLeft: 13,
  raiseLoFromLeft: 15,
  targetInRightRange: 17,
  raiseLoFromRight: 18,
  lowerHiFromRight: 20,
  returnNotFound: 22,
} as const;

export interface BsrStep {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly found: boolean;
  /** Whether the `[lo..mid]` half is the contiguously sorted one. */
  readonly leftSorted: boolean;
  /** Whether the target falls inside the known-sorted half's value range. */
  readonly targetInSortedHalf: boolean;
  /** Whether this is the terminal step after the search space is exhausted with no match. */
  readonly notFound: boolean;
}

const VIEW_W = 640;
const VIEW_H = 180;
const CELL_GAP = 8;
const CELL_Y = 50;
const CELL_H = 48;
const POINTER_Y = 30;
const INDEX_LABEL_Y = 115;
const BRACKET_Y = 135;
const BRACKET_LABEL_Y = 155;

/**
 * Pure step model for rotated-array binary search. Independently simulates the
 * search (it does not import the exercise function) and returns the trace
 * plus the final index, so tests can assert this result matches
 * `searchRotated`.
 */
export function buildSteps(input: VizInput): { steps: BsrStep[]; result: number } {
  const values = [...input.values];
  const target = input.target ?? values[0] ?? 0;
  const steps: BsrStep[] = [];
  let lo = 0;
  let hi = values.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const found = values[mid] === target;
    const leftSorted = values[lo] <= values[mid];
    const targetInSortedHalf = leftSorted
      ? values[lo] <= target && target < values[mid]
      : values[mid] < target && target <= values[hi];
    steps.push({ lo, hi, mid, found, leftSorted, targetInSortedHalf, notFound: false });
    if (found) {
      result = mid;
      break;
    }
    if (leftSorted === targetInSortedHalf) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  if (result === -1) {
    steps.push({ lo, hi, mid: -1, found: false, leftSorted: true, targetInSortedHalf: false, notFound: true });
  }

  return { steps, result };
}

/**
 * Rotated-array binary search visualization: a linear array with lo/hi/mid
 * pointers, plus a bracket marking whichever half is currently known-sorted.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const values = [...input.values];
  const target = input.target ?? values[0] ?? 0;
  const { steps, result } = buildSteps(input);
  const INITIAL_STEP: BsrStep = {
    lo: -1,
    hi: -1,
    mid: -1,
    found: false,
    leftSorted: true,
    targetInSortedHalf: false,
    notFound: false,
  };
  const algorithmSteps: BsrStep[] =
    steps.length > 0
      ? steps
      : [
          {
            lo: 0,
            hi: values.length - 1,
            mid: 0,
            found: false,
            leftSorted: true,
            targetInSortedHalf: false,
            notFound: false,
          },
        ];
  const renderable: BsrStep[] = [INITIAL_STEP, ...algorithmSteps];

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
      if (step.notFound) {
        return { key: "notFound", params: { target } };
      }
      const midValue = values[step.mid];
      if (step.found) {
        return { key: "found", params: { mid: midValue, index: step.mid } };
      }
      const from = step.leftSorted ? values[step.lo] : midValue;
      const to = step.leftSorted ? midValue : values[step.hi];
      const key = step.targetInSortedHalf ? "searchSortedHalf" : "skipSortedHalf";
      return { key, params: { from, to, target } };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-search state; it highlights nothing.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      if (step.notFound) {
        return {
          js: [JS_LINE.whileCond, JS_LINE.returnNotFound],
          pseudo: [PSEUDO_LINE.whileCond, PSEUDO_LINE.returnNotFound],
        };
      }
      const js: number[] = [JS_LINE.whileCond, JS_LINE.computeMid, JS_LINE.compareEqual];
      const pseudo: number[] = [PSEUDO_LINE.whileCond, PSEUDO_LINE.computeMid, PSEUDO_LINE.compareEqual];
      if (step.found) {
        js.push(JS_LINE.returnMid);
        pseudo.push(PSEUDO_LINE.returnMid);
        return { js, pseudo };
      }
      js.push(JS_LINE.checkLeftSorted);
      pseudo.push(PSEUDO_LINE.checkLeftSorted);
      if (step.leftSorted) {
        if (step.targetInSortedHalf) {
          js.push(JS_LINE.targetInLeftRange, JS_LINE.lowerHiFromLeft);
          pseudo.push(PSEUDO_LINE.targetInLeftRange, PSEUDO_LINE.lowerHiFromLeft);
        } else {
          js.push(JS_LINE.raiseLoFromLeft);
          pseudo.push(PSEUDO_LINE.raiseLoFromLeft);
        }
      } else {
        if (step.targetInSortedHalf) {
          js.push(JS_LINE.targetInRightRange, JS_LINE.raiseLoFromRight);
          pseudo.push(PSEUDO_LINE.targetInRightRange, PSEUDO_LINE.raiseLoFromRight);
        } else {
          js.push(JS_LINE.lowerHiFromRight);
          pseudo.push(PSEUDO_LINE.lowerHiFromRight);
        }
      }
      return { js, pseudo };
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
            y: INDEX_LABEL_Y,
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

      if (step.lo >= 0 && step.mid >= 0 && !step.found) {
        const [sortedFrom, sortedTo] = step.leftSorted ? [step.lo, step.mid] : [step.mid, step.hi];
        const bracketX1 = cellX(sortedFrom);
        const bracketX2 = cellX(sortedTo) + cellW;
        g.appendChild(
          line({
            x1: bracketX1,
            y1: BRACKET_Y,
            x2: bracketX2,
            y2: BRACKET_Y,
            stroke: "var(--viz-sorted)",
            "stroke-width": 2,
          })
        );
        g.appendChild(
          text("sorted half", {
            x: (bracketX1 + bracketX2) / 2,
            y: BRACKET_LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-sorted)",
            "font-size": 12,
            "font-weight": 600,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
