import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/** One saved (count, text) pair on the decode stack. */
interface Frame {
  readonly count: number;
  readonly text: string;
}

type DecodeAction = "digit" | "open" | "char" | "close";

/** Snapshot of the scan after processing a single character. */
interface DecodeStep {
  /** Index of the scanned character in the input. */
  readonly index: number;
  readonly char: string;
  readonly action: DecodeAction;
  /** Running repeat count (digit) or the count used by open/close. */
  readonly count: number;
  /** For a closing bracket: the group text before it was repeated. */
  readonly segment: string;
  /** Current built text after this character. */
  readonly current: string;
  /** Stack contents after this character (bottom-first). */
  readonly frames: readonly Frame[];
}

const VIEW_W = 640;
const VIEW_H = 320;
const CELL_W = 26;
const CELL_H = 34;
const CHARS_X = 20;
const CHARS_Y = 40;
const CURRENT_Y = 110;
const STACK_LABEL_Y = 150;
const STACK_Y = 168;
const FRAME_H = 30;

/**
 * Pure step model for the string decoder. Scans the encoded text once with the
 * same count/text stacks as `decodeString`, recording one step per character;
 * the final `current` is the result, so tests can assert it matches
 * `decodeString`.
 */
export function buildSteps(input: VizInput): { steps: DecodeStep[]; result: string } {
  const s = input.text ?? "";
  const countStack: number[] = [];
  const textStack: string[] = [];
  let current = "";
  let count = 0;
  const steps: DecodeStep[] = [];

  for (let i = 0; i < s.length; i += 1) {
    const char = s[i];
    let action: DecodeAction;
    let segment = "";
    let stepCount = count;

    if (char >= "0" && char <= "9") {
      count = count * 10 + Number(char);
      action = "digit";
      stepCount = count;
    } else if (char === "[") {
      countStack.push(count);
      textStack.push(current);
      action = "open";
      stepCount = count;
      count = 0;
      current = "";
    } else if (char === "]") {
      const repeat = countStack.pop() ?? 0;
      const previous = textStack.pop() ?? "";
      segment = current;
      current = previous + current.repeat(repeat);
      action = "close";
      stepCount = repeat;
    } else {
      current += char;
      action = "char";
    }

    const frames: Frame[] = countStack.map((c, k) => ({ count: c, text: textStack[k] }));
    steps.push({ index: i, char, action, count: stepCount, segment, current, frames });
  }

  return { steps, result: current };
}

const DESCRIPTOR_KEY: Record<DecodeAction, string> = {
  digit: "readDigit",
  open: "openGroup",
  char: "appendChar",
  close: "closeGroup",
};

function describeParams(step: DecodeStep): Record<string, string | number> {
  switch (step.action) {
    case "digit":
      return { digit: step.char, count: step.count };
    case "open":
      return { count: step.count };
    case "char":
      return { char: step.char, current: step.current };
    case "close":
      return { segment: step.segment, count: step.count, current: step.current };
    default:
      return {};
  }
}

/** String decoder visualization: a scanning cursor, the build stack and result. */
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
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const activeIndex = stepIndex - 1; // -1 at the initial state
      const step = stepIndex > 0 ? steps[Math.min(stepIndex, steps.length) - 1] : null;
      const totalW = Math.max(VIEW_W, CHARS_X * 2 + chars.length * CELL_W);
      svg.setAttribute("viewBox", `0 0 ${totalW} ${VIEW_H}`);
      clear(svg);
      const g = group();

      // Encoded input, one box per character, with a scanning cursor.
      chars.forEach((char, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        let fill = "var(--viz-cell)";
        if (done) fill = "var(--viz-range)";
        if (active) fill = "var(--viz-mid)";

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

      // Current built text.
      g.appendChild(
        text(`current: "${step ? step.current : ""}"`, {
          x: CHARS_X,
          y: CURRENT_Y,
          fill: "var(--viz-mid-label)",
          "font-size": 15,
          "font-weight": 600,
        })
      );

      // The count/text stack (top of stack drawn first / highest).
      g.appendChild(
        text("stack — pending: saved text + count × group", {
          x: CHARS_X,
          y: STACK_LABEL_Y,
          fill: "var(--viz-muted)",
          "font-size": 13,
          "font-weight": 600,
        })
      );

      const frames = step ? step.frames : [];
      if (frames.length === 0) {
        g.appendChild(
          text("(empty)", {
            x: CHARS_X,
            y: STACK_Y + 16,
            fill: "var(--viz-muted)",
            "font-size": 13,
          })
        );
      } else {
        // Draw with the top of the stack on top.
        frames
          .slice()
          .reverse()
          .forEach((frame, row) => {
            const y = STACK_Y + row * (FRAME_H + 6);
            g.appendChild(
              rect({
                x: CHARS_X,
                y,
                width: 260,
                height: FRAME_H,
                rx: 6,
                fill: "var(--viz-cell)",
                stroke: "var(--viz-stroke)",
                "stroke-width": 1.5,
              })
            );
            // A frame means: when this group closes, prepend the saved text
            // once and repeat the group being built `count` times. The `[ … ]`
            // placeholder stands for that pending group, so the formula reads in
            // final-string order: savedText + count × (group).
            g.appendChild(
              text(`"${frame.text}" + ${frame.count} × [ … ]`, {
                x: CHARS_X + 12,
                y: y + FRAME_H / 2 + 5,
                fill: "var(--viz-text)",
                "font-size": 14,
              })
            );
          });
      }

      svg.appendChild(g);
    },
  };
};
