import { clear, circle, line, rect, text, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of step, by code mode. 1-based,
 * kept in lockstep with exercise.js and exercise.pseudo. A step marks every
 * line involved in it (loop header + push + the overflow check, plus the pop
 * when eviction happens), so the highlighted lines may be non-contiguous.
 */
const JS_LINE = {
  loopHeader: 14,
  pushCall: 15,
  overflowCheck: 16,
  popCall: 17,
} as const;

const PSEUDO_LINE = {
  loopHeader: 3,
  pushCall: 4,
  overflowCheck: 5,
  popCall: 6,
} as const;

const INSERT_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.pushCall, JS_LINE.overflowCheck],
  pseudo: [PSEUDO_LINE.loopHeader, PSEUDO_LINE.pushCall, PSEUDO_LINE.overflowCheck],
};
const EVICT_LINES: CodeLines = {
  js: [JS_LINE.loopHeader, JS_LINE.pushCall, JS_LINE.overflowCheck, JS_LINE.popCall],
  pseudo: [
    PSEUDO_LINE.loopHeader,
    PSEUDO_LINE.pushCall,
    PSEUDO_LINE.overflowCheck,
    PSEUDO_LINE.popCall,
  ],
};

type StepKind = "insert" | "evict" | "done";

/** Snapshot of the bounded min-heap after processing one input element. */
export interface TopKStep {
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
  /** Input index just processed, -1 for the terminal step. */
  readonly index: number;
  /** Min-heap contents (array form) after this step. */
  readonly heap: readonly number[];
  /** Value evicted this step, or null. */
  readonly evicted: number | null;
}

function heapPush(heap: number[], value: number): void {
  heap.push(value);
  let child = heap.length - 1;
  while (child > 0) {
    const parent = Math.floor((child - 1) / 2);
    if (heap[parent] <= heap[child]) {
      break;
    }
    swap(heap, parent, child);
    child = parent;
  }
}

function heapPop(heap: number[]): number {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}

function siftDown(heap: number[], start: number): void {
  let parent = start;
  const size = heap.length;
  while (true) {
    let smallest = parent;
    const left = 2 * parent + 1;
    const right = 2 * parent + 2;
    if (left < size && heap[left] < heap[smallest]) {
      smallest = left;
    }
    if (right < size && heap[right] < heap[smallest]) {
      smallest = right;
    }
    if (smallest === parent) {
      return;
    }
    swap(heap, parent, smallest);
    parent = smallest;
  }
}

function swap(heap: number[], a: number, b: number): void {
  const temp = heap[a];
  heap[a] = heap[b];
  heap[b] = temp;
}

/**
 * Pure step model for top-k-elements. Independently runs the same
 * bounded-min-heap pipeline as `topKElements` (it does not import the
 * exercise function), recording one step per input element processed
 * ("insert" when the heap stays within size k, "evict" when pushing it
 * overflows the heap and the smallest value is popped), plus a terminal
 * "done" step. Returns the trace and the final top-k array (largest first),
 * so tests can assert this result matches `topKElements`.
 */
export function buildSteps(input: VizInput): { steps: TopKStep[]; result: number[] } {
  const values = [...input.values];
  const n = values.length;
  // `k` rides on the optional numeric target; with none, fall back to keeping every value.
  const k = input.target ?? n;
  const steps: TopKStep[] = [];
  const heap: number[] = [];

  for (let i = 0; i < n; i += 1) {
    const value = values[i];
    heapPush(heap, value);
    let evicted: number | null = null;
    if (heap.length > k) {
      evicted = heapPop(heap);
    }
    steps.push({
      kind: evicted !== null ? "evict" : "insert",
      params:
        evicted !== null
          ? { value, evicted, k, size: heap.length }
          : { value, k, size: heap.length },
      index: i,
      heap: [...heap],
      evicted,
    });
  }

  const scratch = [...heap];
  const collected: number[] = [];
  while (scratch.length > 0) {
    collected.push(heapPop(scratch));
  }
  const result = collected.reverse();

  steps.push({
    kind: "done",
    params: { k, count: result.length },
    index: -1,
    heap: [...heap],
    evicted: null,
  });

  return { steps, result };
}

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  insert: INSERT_LINES,
  evict: EVICT_LINES,
  done: null,
};

const VIEW_W = 640;
const GAP = 8;
const ARRAY_LABEL_Y = 16;
const ARRAY_Y = 24;
const ARRAY_H = 34;
const HEAP_LABEL_Y = ARRAY_Y + ARRAY_H + 30;
const HEAP_TOP = HEAP_LABEL_Y + 26;
const RADIUS = 18;
const LEVEL_H = 55;
const RESULT_CHIP_W = 40;
const RESULT_GAP = 8;

interface NodePosition {
  x: number;
  y: number;
}

/**
 * Lays out heap index `i` (of a heap bounded to size `n`) as node `i` of the
 * complete binary tree implied by its array representation (children at
 * `2i + 1` and `2i + 2`), using an in-order visit to assign horizontal slots
 * so sibling subtrees don't overlap. Depends only on `n`, not the values, so
 * positions stay stable across steps as the heap fills and drains.
 */
function layoutTree(n: number): { positions: NodePosition[]; maxDepth: number } {
  const positions = new Array<NodePosition>(n);
  const order = new Array<number>(n);
  let counter = 0;
  let maxDepth = 0;
  const visit = (index: number, depth: number): void => {
    if (index >= n) {
      return;
    }
    visit(2 * index + 1, depth + 1);
    order[index] = counter;
    counter += 1;
    positions[index] = { x: 0, y: HEAP_TOP + depth * LEVEL_H };
    maxDepth = Math.max(maxDepth, depth);
    visit(2 * index + 2, depth + 1);
  };
  visit(0, 0);

  const colW = VIEW_W / (n + 1);
  for (let i = 0; i < n; i += 1) {
    positions[i].x = colW * (order[i] + 1);
  }
  return { positions, maxDepth };
}

/**
 * Top-k-elements visualization: a two-zone diagram — the input array with a
 * scanning cursor, and a live bounded min-heap drawn as a complete binary
 * tree (root = current smallest of the k largest seen so far) — re-painted
 * from a snapshot at each step, with a result strip on the terminal step.
 */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];
  const k = input.target ?? values.length;
  const maxHeapSize = Math.max(k, 0);

  const { positions, maxDepth } = layoutTree(maxHeapSize);
  const resultLabelY = HEAP_TOP + maxDepth * LEVEL_H + RADIUS + 40;
  const resultY = resultLabelY + 8;
  const viewH = resultY + RESULT_CHIP_W + 16;

  const count = Math.max(values.length, 1);
  const arrayCellW = (VIEW_W - GAP * (count + 1)) / count;
  const arrayX = (index: number): number => GAP + index * (arrayCellW + GAP);

  const INITIAL: TopKStep = {
    kind: "insert",
    params: {},
    index: -1,
    heap: [],
    evicted: null,
  };
  const renderable: TopKStep[] = [INITIAL, ...steps];

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial, pre-algorithm state and has no log row.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return { key: step.kind, params: step.params };
    },
    codeLines(stepIndex: number): CodeLines | null {
      // Step 0 is the initial state; nothing executes.
      if (stepIndex <= 0) {
        return null;
      }
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      return LINES_BY_KIND[step.kind];
    },
    renderStep(svg: SVGSVGElement, stepIndex: number): void {
      const step = renderable[Math.min(stepIndex, renderable.length - 1)];
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${viewH}`);
      clear(svg);
      const g = group();

      const sectionLabel = (label: string, y: number): void => {
        g.appendChild(
          text(label, {
            x: GAP,
            y,
            fill: "var(--viz-muted)",
            "font-size": 13,
            "font-weight": 600,
          })
        );
      };

      // Zone 1 — input array with a scanning cursor.
      sectionLabel("input", ARRAY_LABEL_Y);
      const done = step.kind === "done";
      values.forEach((value, index) => {
        let fill = "var(--viz-cell)";
        if (done || (step.index >= 0 && index < step.index)) {
          fill = "var(--viz-range)";
        } else if (index === step.index) {
          fill = "var(--viz-mid)";
        }
        g.appendChild(
          rect({
            x: arrayX(index),
            y: ARRAY_Y,
            width: arrayCellW,
            height: ARRAY_H,
            rx: 6,
            fill,
            stroke: "var(--viz-stroke)",
            "stroke-width": 1.5,
          })
        );
        g.appendChild(
          text(String(value), {
            x: arrayX(index) + arrayCellW / 2,
            y: ARRAY_Y + ARRAY_H / 2 + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
      });

      // Zone 2 — the bounded min-heap, drawn as a complete binary tree.
      sectionLabel(`heap (size ${step.heap.length}/${maxHeapSize})`, HEAP_LABEL_Y);

      for (let i = 1; i < step.heap.length; i += 1) {
        const parentIndex = Math.floor((i - 1) / 2);
        g.appendChild(
          line({
            x1: positions[parentIndex].x,
            y1: positions[parentIndex].y,
            x2: positions[i].x,
            y2: positions[i].y,
            stroke: "var(--viz-stroke)",
            "stroke-width": 2,
          })
        );
      }

      for (let i = 0; i < step.heap.length; i += 1) {
        const pos = positions[i];
        const isRoot = i === 0;
        const fill = done ? "var(--viz-found)" : isRoot ? "var(--viz-pivot)" : "var(--viz-cell)";
        g.appendChild(
          circle({
            cx: pos.x,
            cy: pos.y,
            r: RADIUS,
            fill,
            stroke: isRoot ? "var(--viz-mid-label)" : "var(--viz-stroke)",
            "stroke-width": isRoot ? 2.5 : 1.5,
          })
        );
        g.appendChild(
          text(String(step.heap[i]), {
            x: pos.x,
            y: pos.y + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 14,
            "font-weight": 600,
          })
        );
      }

      if (step.evicted !== null) {
        g.appendChild(
          text(`evicted: ${step.evicted}`, {
            x: VIEW_W - GAP,
            y: HEAP_LABEL_Y,
            "text-anchor": "end",
            fill: "var(--viz-muted)",
            "font-size": 13,
            "font-weight": 600,
          })
        );
      }

      // Result strip — only meaningful once the scan is complete.
      sectionLabel("result — top k, largest first", resultLabelY);
      if (!done) {
        g.appendChild(
          text("(pending)", { x: GAP, y: resultY + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else if (result.length === 0) {
        g.appendChild(
          text("(empty)", { x: GAP, y: resultY + 22, fill: "var(--viz-muted)", "font-size": 13 })
        );
      } else {
        result.forEach((value, idx) => {
          const x = GAP + idx * (RESULT_CHIP_W + RESULT_GAP);
          g.appendChild(
            rect({
              x,
              y: resultY,
              width: RESULT_CHIP_W,
              height: RESULT_CHIP_W - 6,
              rx: 6,
              fill: "var(--viz-found)",
              stroke: "var(--viz-stroke)",
              "stroke-width": 1.5,
            })
          );
          g.appendChild(
            text(String(value), {
              x: x + RESULT_CHIP_W / 2,
              y: resultY + (RESULT_CHIP_W - 6) / 2 + 5,
              "text-anchor": "middle",
              fill: "var(--viz-text)",
              "font-size": 14,
              "font-weight": 600,
            })
          );
        });
      }

      svg.appendChild(g);
    },
  };
};
