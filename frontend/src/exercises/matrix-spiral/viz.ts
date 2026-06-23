import { clear, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" when a cell is appended, by code mode and by the
 * spiral side that produced it. 1-based, kept in lockstep with exercise.js and
 * exercise.pseudo. Each visit highlights the loop header plus the `for` and the
 * append of the side currently being walked.
 */
const JS_LINE = {
  whileHeader: 20,
  topFor: 21,
  topPush: 22,
  rightFor: 26,
  rightPush: 27,
  bottomFor: 32,
  bottomPush: 33,
  leftFor: 39,
  leftPush: 40,
} as const;

const PSEUDO_LINE = {
  whileHeader: 12,
  topFor: 13,
  topPush: 14,
  rightFor: 17,
  rightPush: 18,
  bottomFor: 22,
  bottomPush: 23,
  leftFor: 27,
  leftPush: 28,
} as const;

/** The four sides walked on each lap of the spiral. */
type Segment = "top" | "right" | "bottom" | "left";

const JS_SEGMENT_LINES: Record<Segment, readonly number[]> = {
  top: [JS_LINE.whileHeader, JS_LINE.topFor, JS_LINE.topPush],
  right: [JS_LINE.whileHeader, JS_LINE.rightFor, JS_LINE.rightPush],
  bottom: [JS_LINE.whileHeader, JS_LINE.bottomFor, JS_LINE.bottomPush],
  left: [JS_LINE.whileHeader, JS_LINE.leftFor, JS_LINE.leftPush],
};

const PSEUDO_SEGMENT_LINES: Record<Segment, readonly number[]> = {
  top: [PSEUDO_LINE.whileHeader, PSEUDO_LINE.topFor, PSEUDO_LINE.topPush],
  right: [PSEUDO_LINE.whileHeader, PSEUDO_LINE.rightFor, PSEUDO_LINE.rightPush],
  bottom: [PSEUDO_LINE.whileHeader, PSEUDO_LINE.bottomFor, PSEUDO_LINE.bottomPush],
  left: [PSEUDO_LINE.whileHeader, PSEUDO_LINE.leftFor, PSEUDO_LINE.leftPush],
};

export interface SpiralStep {
  readonly row: number;
  readonly col: number;
  readonly value: number;
  readonly segment: Segment;
}

const MAX_VIEW_W = 640;
const CELL_GAP = 8;
const MAX_CELL = 64;

/**
 * Pure step model for the spiral traversal. Independently simulates the same
 * boundary-shrinking walk as the exercise (it does not import the exercise
 * function) and returns one step per appended cell plus the flat result, so
 * tests can assert this result matches `spiralOrder`.
 */
export function buildSteps(input: VizInput): { steps: SpiralStep[]; result: number[] } {
  const matrix = (input.matrix ?? []).map((row) => [...row]);
  const steps: SpiralStep[] = [];
  const result: number[] = [];

  if (matrix.length === 0 || matrix[0].length === 0) {
    return { steps, result };
  }

  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  const visit = (row: number, col: number, segment: Segment): void => {
    steps.push({ row, col, value: matrix[row][col], segment });
    result.push(matrix[row][col]);
  };

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col += 1) {
      visit(top, col, "top");
    }
    top += 1;

    for (let row = top; row <= bottom; row += 1) {
      visit(row, right, "right");
    }
    right -= 1;

    if (top <= bottom) {
      for (let col = right; col >= left; col -= 1) {
        visit(bottom, col, "bottom");
      }
      bottom -= 1;
    }

    if (left <= right) {
      for (let row = bottom; row >= top; row -= 1) {
        visit(row, left, "left");
      }
      left += 1;
    }
  }

  return { steps, result };
}

/**
 * Matrix spiral visualization: a row×column grid where each step lights up the
 * next cell in clockwise spiral order, shading already-visited cells and
 * numbering them with their 1-based spiral position.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const matrix = (input.matrix ?? []).map((row) => [...row]);
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const { steps, result } = buildSteps(input);

  // Step 0 is the initial state (nothing visited); steps 1..N visit one cell.
  const totalSteps = steps.length + 1;

  // order[r][c] = 0-based spiral position of the cell, or -1 if never visited.
  const order: number[][] = matrix.map((row) => row.map(() => -1));
  steps.forEach((step, index) => {
    order[step.row][step.col] = index;
  });

  const cellSize = cols > 0
    ? Math.min(MAX_CELL, (MAX_VIEW_W - CELL_GAP * (cols + 1)) / cols)
    : MAX_CELL;
  const gridW = cols * cellSize + CELL_GAP * (cols + 1);
  const gridH = rows * cellSize + CELL_GAP * (rows + 1);
  // Keep a fixed viewBox width and center the grid in it, so small matrices keep
  // their natural cell size (the SVG scales the viewBox to the panel width)
  // instead of stretching a narrow grid up to fill it.
  const viewW = Math.max(gridW, MAX_VIEW_W);
  const offsetX = (viewW - gridW) / 2;
  const cellX = (col: number): number => offsetX + CELL_GAP + col * (cellSize + CELL_GAP);
  const cellY = (row: number): number => CELL_GAP + row * (cellSize + CELL_GAP);

  return {
    totalSteps,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-traversal state and has no log row.
      if (stepIndex <= 0 || steps.length === 0) {
        return null;
      }
      const step = steps[Math.min(stepIndex, steps.length) - 1];
      return {
        key: "visit",
        params: {
          value: step.value,
          row: step.row,
          col: step.col,
          position: Math.min(stepIndex, steps.length),
        },
      };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the pre-traversal state; it highlights nothing.
      if (stepIndex <= 0 || steps.length === 0) {
        return null;
      }
      const step = steps[Math.min(stepIndex, steps.length) - 1];
      return {
        js: JS_SEGMENT_LINES[step.segment],
        pseudo: PSEUDO_SEGMENT_LINES[step.segment],
      };
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      svg.setAttribute("viewBox", `0 0 ${Math.max(viewW, 1)} ${Math.max(gridH, 1)}`);
      clear(svg);
      const g = group();

      // Cells whose spiral position is < visitedCount are already collected;
      // the cell at exactly visitedCount - 1 is the one just appended.
      const visitedCount = Math.min(stepIndex, steps.length);
      const isLast = stepIndex >= totalSteps - 1;

      matrix.forEach((row, r) => {
        row.forEach((value, c) => {
          const position = order[r][c];
          const visited = position >= 0 && position < visitedCount;
          const isCurrent = position === visitedCount - 1;

          let fill = "var(--viz-cell)";
          if (visited) fill = "var(--viz-range)";
          if (isCurrent) fill = isLast ? "var(--viz-found)" : "var(--viz-mid)";

          g.appendChild(
            rect({
              x: cellX(c),
              y: cellY(r),
              width: cellSize,
              height: cellSize,
              rx: 6,
              fill,
              stroke: "var(--viz-stroke)",
              "stroke-width": 1.5,
            })
          );
          g.appendChild(
            text(String(value), {
              x: cellX(c) + cellSize / 2,
              y: cellY(r) + cellSize / 2 + 6,
              "text-anchor": "middle",
              fill: "var(--viz-text)",
              "font-size": 18,
              "font-weight": 600,
            })
          );
          // Small spiral-order index in the corner of each visited cell.
          if (visited || isCurrent) {
            g.appendChild(
              text(String(position + 1), {
                x: cellX(c) + 6,
                y: cellY(r) + 14,
                "text-anchor": "start",
                fill: "var(--viz-muted)",
                "font-size": 10,
                "font-weight": 700,
              })
            );
          }
        });
      });

      svg.appendChild(g);
    },
  };
};
