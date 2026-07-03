import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" at one comparison step, by code mode. 1-based,
 * kept in lockstep with exercise.js and exercise.pseudo. A match step
 * highlights the loop condition, the (false) if-branch and both pointer
 * moves; a mismatch step highlights the loop condition, the (true)
 * if-branch and the early return; a done step highlights the (now-false)
 * loop condition and the final return.
 */
const JS_LINE = {
  whileCond: 18,
  ifCond: 19,
  returnFalse: 20,
  moveLeft: 22,
  moveRight: 23,
  returnTrue: 26,
} as const;

const PSEUDO_LINE = {
  whileCond: 6,
  ifCond: 7,
  returnFalse: 8,
  moveLeft: 9,
  moveRight: 10,
  returnTrue: 12,
} as const;

const MATCH_LINES: CodeLines = {
  js: [JS_LINE.whileCond, JS_LINE.ifCond, JS_LINE.moveLeft, JS_LINE.moveRight],
  pseudo: [PSEUDO_LINE.whileCond, PSEUDO_LINE.ifCond, PSEUDO_LINE.moveLeft, PSEUDO_LINE.moveRight],
};

const MISMATCH_LINES: CodeLines = {
  js: [JS_LINE.whileCond, JS_LINE.ifCond, JS_LINE.returnFalse],
  pseudo: [PSEUDO_LINE.whileCond, PSEUDO_LINE.ifCond, PSEUDO_LINE.returnFalse],
};

const DONE_LINES: CodeLines = {
  js: [JS_LINE.whileCond, JS_LINE.returnTrue],
  pseudo: [PSEUDO_LINE.whileCond, PSEUDO_LINE.returnTrue],
};

type PalindromeAction = "match" | "mismatch" | "done";

/** Snapshot of the two-pointer walk after processing a single step. */
interface PalindromeStep {
  readonly left: number;
  readonly right: number;
  /** Character compared at `left` (empty for `done` steps). */
  readonly leftChar: string;
  /** Character compared at `right` (empty for `done` steps). */
  readonly rightChar: string;
  readonly action: PalindromeAction;
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
 * Pure step model for the palindrome check. Independently simulates the
 * two-pointer comparison (it does not import the exercise function) and
 * returns the trace plus the final boolean, so tests can assert this result
 * matches `isPalindrome`. The scan short-circuits on the first mismatch,
 * mirroring the early return.
 */
export function buildSteps(input: VizInput): { steps: PalindromeStep[]; result: boolean } {
  const chars = [...(input.text ?? "")];
  let left = 0;
  let right = chars.length - 1;
  const steps: PalindromeStep[] = [];
  let mismatch = false;

  while (left < right) {
    const leftChar = chars[left];
    const rightChar = chars[right];
    if (leftChar !== rightChar) {
      steps.push({ left, right, leftChar, rightChar, action: "mismatch" });
      mismatch = true;
      break;
    }
    steps.push({ left, right, leftChar, rightChar, action: "match" });
    left += 1;
    right -= 1;
  }
  if (!mismatch) {
    steps.push({ left, right, leftChar: "", rightChar: "", action: "done" });
  }

  return { steps, result: !mismatch };
}

/** Palindrome-check visualization: two pointers over character cells, comparing inward. */
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
      if (step.action === "match") {
        return {
          key: "match",
          params: {
            left: step.left,
            right: step.right,
            leftChar: step.leftChar,
            rightChar: step.rightChar,
          },
        };
      }
      if (step.action === "mismatch") {
        return {
          key: "mismatch",
          params: {
            left: step.left,
            right: step.right,
            leftChar: step.leftChar,
            rightChar: step.rightChar,
          },
        };
      }
      if (step.left === step.right) {
        return { key: "doneMiddle", params: { index: step.left, char: initialChars[step.left] } };
      }
      return { key: "doneCrossed", params: {} };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the untouched input; the walk starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const action = steps[stepIndex - 1].action;
      if (action === "match") return MATCH_LINES;
      if (action === "mismatch") return MISMATCH_LINES;
      return DONE_LINES;
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const left = step ? step.left : 0;
      const right = step ? step.right : count - 1;

      const totalW = Math.max(320, CHARS_X * 2 + count * CELL_W);
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      initialChars.forEach((char, index) => {
        let fill = "var(--viz-cell)";
        if (step) {
          const comparing = step.action !== "done" && (index === left || index === right);
          const settled = index < left || index > right || (index === left && index === right);
          if (step.action === "mismatch" && comparing) {
            fill = "var(--viz-invalid)";
          } else if (comparing) {
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

      // Final verdict, shown once the walk is complete (matched-through or a mismatch).
      if (step && stepIndex >= steps.length) {
        g.appendChild(
          text(`palindrome: ${result ? "true" : "false"}`, {
            x: CHARS_X,
            y: RESULT_Y,
            fill: result ? "var(--viz-found)" : "var(--viz-invalid)",
            "font-size": 16,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
