import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during one loop iteration (a swap) and at the
 * final exit (a `done` step), by code mode. 1-based, kept in lockstep with
 * exercise.js and exercise.pseudo. A swap step highlights the whole loop body
 * (condition, temp assignment, both writes, both pointer moves); a done step
 * highlights the (now-false) loop condition and the return.
 */
const JS_LINE = {
  whileCond: 15,
  tempAssign: 16,
  swapLeft: 17,
  swapRight: 18,
  moveLeft: 19,
  moveRight: 20,
  returnJoin: 23,
} as const;

const PSEUDO_LINE = {
  whileCond: 6,
  tempAssign: 7,
  swapLeft: 8,
  swapRight: 9,
  moveLeft: 10,
  moveRight: 11,
  returnJoin: 13,
} as const;

const SWAP_LINES: CodeLines = {
  js: [
    JS_LINE.whileCond,
    JS_LINE.tempAssign,
    JS_LINE.swapLeft,
    JS_LINE.swapRight,
    JS_LINE.moveLeft,
    JS_LINE.moveRight,
  ],
  pseudo: [
    PSEUDO_LINE.whileCond,
    PSEUDO_LINE.tempAssign,
    PSEUDO_LINE.swapLeft,
    PSEUDO_LINE.swapRight,
    PSEUDO_LINE.moveLeft,
    PSEUDO_LINE.moveRight,
  ],
};

const DONE_LINES: CodeLines = {
  js: [JS_LINE.whileCond, JS_LINE.returnJoin],
  pseudo: [PSEUDO_LINE.whileCond, PSEUDO_LINE.returnJoin],
};

type ReverseAction = "swap" | "done";

/** Snapshot of the two-pointer walk after processing a single step. */
interface ReverseStep {
  readonly left: number;
  readonly right: number;
  /** Character that was at `left` before this swap (empty for `done` steps). */
  readonly leftChar: string;
  /** Character that was at `right` before this swap (empty for `done` steps). */
  readonly rightChar: string;
  /** Full character array after this step is applied. */
  readonly chars: readonly string[];
  readonly action: ReverseAction;
}

const VIEW_H = 200;
const CELL_W = 40;
const CELL_H = 48;
const CHARS_X = 20;
const CHARS_Y = 70;
const POINTER_Y = 46;
const LABEL_Y = 140;
const RESULT_Y = 175;

/**
 * Pure step model for string reversal. Independently simulates the two-pointer
 * swap (it does not import the exercise function) and returns the trace plus
 * the final joined string, so tests can assert this result matches
 * `reverseString`.
 */
export function buildSteps(input: VizInput): { steps: ReverseStep[]; result: string } {
  const chars = [...(input.text ?? "")];
  let left = 0;
  let right = chars.length - 1;
  const steps: ReverseStep[] = [];

  while (left < right) {
    const leftChar = chars[left];
    const rightChar = chars[right];
    chars[left] = rightChar;
    chars[right] = leftChar;
    steps.push({ left, right, leftChar, rightChar, chars: [...chars], action: "swap" });
    left += 1;
    right -= 1;
  }
  steps.push({ left, right, leftChar: "", rightChar: "", chars: [...chars], action: "done" });

  return { steps, result: chars.join("") };
}

/** String-reversal visualization: two pointers over character cells, swapping inward. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const initialChars = [...(input.text ?? "")];
  const { steps, result } = buildSteps(input);
  const count = initialChars.length;

  return {
    totalSteps: steps.length + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the untouched input; the walk starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      if (step.action === "swap") {
        return {
          key: "swap",
          params: {
            left: step.left,
            right: step.right,
            leftChar: step.leftChar,
            rightChar: step.rightChar,
          },
        };
      }
      if (step.left === step.right) {
        return { key: "doneMiddle", params: { index: step.left, char: step.chars[step.left] } };
      }
      return { key: "doneCrossed", params: {} };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the untouched input; the walk starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      return steps[stepIndex - 1].action === "swap" ? SWAP_LINES : DONE_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const chars = step ? step.chars : initialChars;
      const left = step ? step.left : 0;
      const right = step ? step.right : count - 1;

      const totalW = Math.max(320, CHARS_X * 2 + count * CELL_W);
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      chars.forEach((char, index) => {
        let fill = "var(--viz-cell)";
        if (step) {
          const justSwapped = step.action === "swap" && (index === left || index === right);
          const settled = index <= left || index >= right;
          if (justSwapped || (index === left && index === right)) {
            fill = "var(--viz-mid)";
          } else if (settled) {
            fill = "var(--viz-found)";
          } else {
            fill = "var(--viz-range)";
          }
        }

        const x = CHARS_X + index * CELL_W;
        g.appendChild(
          rect({
            x,
            y: CHARS_Y,
            width: CELL_W - 6,
            height: CELL_H,
            rx: 6,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(char, {
            x: x + (CELL_W - 6) / 2,
            y: CHARS_Y + CELL_H / 2 + 6,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 18,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(index), {
            x: x + (CELL_W - 6) / 2,
            y: LABEL_Y,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 12,
          })
        );
      });

      // Pointer labels above the cells they currently address.
      if (count > 0 && left >= 0 && left < count && right >= 0 && right < count && left <= right) {
        const label = left === right ? "L,R" : "L";
        g.appendChild(
          text(label, {
            x: CHARS_X + left * CELL_W + (CELL_W - 6) / 2,
            y: POINTER_Y,
            "text-anchor": "middle",
            fill: "var(--viz-mid-label)",
            "font-size": 13,
            "font-weight": 700,
          })
        );
        if (left !== right) {
          g.appendChild(
            text("R", {
              x: CHARS_X + right * CELL_W + (CELL_W - 6) / 2,
              y: POINTER_Y,
              "text-anchor": "middle",
              fill: "var(--viz-mid-label)",
              "font-size": 13,
              "font-weight": 700,
            })
          );
        }
      }

      // Final reversed string, shown only once the walk is complete.
      if (step && step.action === "done") {
        g.appendChild(
          text(`reversed: "${result}"`, {
            x: CHARS_X,
            y: RESULT_Y,
            fill: "var(--viz-found)",
            "font-size": 16,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
