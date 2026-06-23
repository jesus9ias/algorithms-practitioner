import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that execute for each scan action, by code mode. Each step
 * processes one character, taking exactly one branch of the scan loop. 1-based;
 * kept in lockstep with exercise.js and exercise.pseudo.
 */
const ACTION_LINES: Record<BracketAction, CodeLines> = {
  open: { js: [16, 17, 18], pseudo: [5, 6, 7] },
  match: { js: [16, 19, 20], pseudo: [5, 8, 9] },
  mismatch: { js: [16, 19, 20, 21], pseudo: [5, 8, 9, 10] },
  ignore: { js: [16], pseudo: [5] },
};

/** Each closing bracket maps to the opening bracket it must match. */
const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

const OPEN_BRACKETS = "([{";
const CLOSE_BRACKETS = ")]}";

type BracketAction = "open" | "match" | "mismatch" | "ignore";

/** Snapshot of the scan after processing a single character. */
interface BracketStep {
  /** Index of the scanned character in the input. */
  readonly index: number;
  readonly char: string;
  readonly action: BracketAction;
  /** Stack of pending opening brackets after this character (bottom-first). */
  readonly stack: readonly string[];
  /** For a closing bracket: the opening bracket it required. */
  readonly expected: string;
}

const VIEW_W = 640;
const VIEW_H = 300;
const CELL_W = 26;
const CELL_H = 34;
const CHARS_X = 20;
const CHARS_Y = 40;
const STACK_LABEL_Y = 110;
const STACK_Y = 128;
const FRAME_H = 30;
const FRAME_W = 60;
const RESULT_Y = 270;

/**
 * Pure step model for the bracket validator. Scans the string once with the same
 * stack as `isBalanced`, recording one step per character; on the first
 * mismatching closing bracket the scan short-circuits, mirroring the early
 * return. The final `result` matches `isBalanced`, so tests can assert it.
 */
export function buildSteps(input: VizInput): { steps: BracketStep[]; result: boolean } {
  const s = input.text ?? "";
  const stack: string[] = [];
  const steps: BracketStep[] = [];
  let mismatch = false;

  for (let i = 0; i < s.length; i += 1) {
    const char = s[i];
    let action: BracketAction;
    let expected = "";

    if (OPEN_BRACKETS.includes(char)) {
      stack.push(char);
      action = "open";
    } else if (CLOSE_BRACKETS.includes(char)) {
      expected = PAIRS[char];
      if (stack.length > 0 && stack[stack.length - 1] === expected) {
        stack.pop();
        action = "match";
      } else {
        action = "mismatch";
        mismatch = true;
      }
    } else {
      action = "ignore";
    }

    steps.push({ index: i, char, action, stack: [...stack], expected });
    if (mismatch) break;
  }

  return { steps, result: !mismatch && stack.length === 0 };
}

const DESCRIPTOR_KEY: Record<BracketAction, string> = {
  open: "pushOpen",
  match: "matchClose",
  mismatch: "mismatchClose",
  ignore: "ignoreChar",
};

function describeParams(step: BracketStep): Record<string, string | number> {
  switch (step.action) {
    case "open":
      return { bracket: step.char };
    case "match":
      return { bracket: step.char, expected: step.expected };
    case "mismatch":
      return { bracket: step.char };
    case "ignore":
      return { char: step.char };
    default:
      return {};
  }
}

/** Bracket validator visualization: a scanning cursor, the pending-open stack and verdict. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const chars = [...(input.text ?? "")];
  const { steps, result } = buildSteps(input);

  return {
    totalSteps: steps.length + 1,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 shows the untouched input; the scan starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      const step = steps[stepIndex - 1];
      return { key: DESCRIPTOR_KEY[step.action], params: describeParams(step) };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 shows the untouched input; the scan starts at step 1.
      if (stepIndex <= 0 || stepIndex > steps.length) {
        return null;
      }
      return ACTION_LINES[steps[stepIndex - 1].action];
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const activeIndex = stepIndex - 1; // -1 at the initial state
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const totalW = Math.max(VIEW_W, CHARS_X * 2 + chars.length * CELL_W);
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      // Input string, one box per character, with a scanning cursor.
      chars.forEach((char, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const failed = active && step?.action === "mismatch";
        const matched = active && step?.action === "match";
        let fill = "var(--viz-cell)";
        if (done) fill = "var(--viz-range)";
        if (active) fill = "var(--viz-mid)";
        if (matched) fill = "var(--viz-found)";
        if (failed) fill = "var(--viz-invalid)";

        const x = CHARS_X + index * CELL_W;
        g.appendChild(
          rect({
            x,
            y: CHARS_Y,
            width: CELL_W - 4,
            height: CELL_H,
            rx: 5,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(char, {
            x: x + (CELL_W - 4) / 2,
            y: CHARS_Y + CELL_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
      });

      // The stack of pending opening brackets (top of stack drawn first / left).
      g.appendChild(
        text("stack — pending opening brackets (top first)", {
          x: CHARS_X,
          y: STACK_LABEL_Y,
          fill: "var(--viz-muted)",
          "font-size": 13,
          "font-weight": 600,
        })
      );

      const frames = step ? step.stack : [];
      if (frames.length === 0) {
        g.appendChild(
          text("(empty)", {
            x: CHARS_X,
            y: STACK_Y + 20,
            fill: "var(--viz-muted)",
            "font-size": 13,
          })
        );
      } else {
        frames
          .slice()
          .reverse()
          .forEach((bracket, col) => {
            const x = CHARS_X + col * (FRAME_W + 8);
            g.appendChild(
              rect({
                x,
                y: STACK_Y,
                width: FRAME_W,
                height: FRAME_H,
                rx: 6,
                fill: "var(--viz-cell)",
                stroke: "var(--viz-stroke)",
                "stroke-width": 1.5,
              })
            );
            g.appendChild(
              text(bracket, {
                x: x + FRAME_W / 2,
                y: STACK_Y + FRAME_H / 2 + 5,
                "text-anchor": "middle",
                fill: "var(--viz-text)",
                "font-size": 16,
                "font-weight": 700,
              })
            );
          });
      }

      // Final verdict, shown only once the whole string has been scanned.
      if (step && stepIndex >= steps.length) {
        const balanced = result;
        g.appendChild(
          text(`balanced: ${balanced ? "true" : "false"}`, {
            x: CHARS_X,
            y: RESULT_Y,
            fill: balanced ? "var(--viz-found)" : "var(--viz-invalid)",
            "font-size": 16,
            "font-weight": 700,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
