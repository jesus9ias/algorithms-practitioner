import { clear, circle, text, line, group } from "../../lib/viz/svg";
import type {
  CodeLines,
  ExerciseViz,
  StepDescriptor,
  VizFactory,
  VizInput,
} from "../../lib/viz/types";

/**
 * Source lines that "execute" during each kind of build-min-heap step, by code
 * mode. 1-based, kept in lockstep with exercise.js and exercise.pseudo. A step
 * marks every line involved in it (loop header + branch taken + pointer
 * updates), so the highlighted lines may be non-contiguous.
 */
const JS_LINE = {
  start: 15,
  callSiftDown: 16,
  initParent: 22,
  loopHeader: 23,
  initSmallest: 24,
  compareLeft: 27,
  assignLeft: 28,
  compareRight: 30,
  assignRight: 31,
  settleCheck: 33,
  settleReturn: 34,
  swapCall: 36,
  advanceParent: 37,
} as const;

const PSEUDO_LINE = {
  start: 4,
  callSiftDown: 5,
  initParent: 9,
  loopHeader: 10,
  initSmallest: 11,
  compareLeft: 14,
  assignLeft: 15,
  compareRight: 16,
  assignRight: 17,
  settleCheck: 18,
  settleReturn: 19,
  swapCall: 20,
  advanceParent: 21,
} as const;

const START_LINES: CodeLines = {
  js: [JS_LINE.start, JS_LINE.callSiftDown],
  pseudo: [PSEUDO_LINE.start, PSEUDO_LINE.callSiftDown],
};
const SWAP_LINES: CodeLines = {
  js: [
    JS_LINE.loopHeader,
    JS_LINE.compareLeft,
    JS_LINE.assignLeft,
    JS_LINE.compareRight,
    JS_LINE.assignRight,
    JS_LINE.swapCall,
    JS_LINE.advanceParent,
  ],
  pseudo: [
    PSEUDO_LINE.loopHeader,
    PSEUDO_LINE.compareLeft,
    PSEUDO_LINE.assignLeft,
    PSEUDO_LINE.compareRight,
    PSEUDO_LINE.assignRight,
    PSEUDO_LINE.swapCall,
    PSEUDO_LINE.advanceParent,
  ],
};
const SETTLE_LINES: CodeLines = {
  js: [
    JS_LINE.loopHeader,
    JS_LINE.initSmallest,
    JS_LINE.compareLeft,
    JS_LINE.compareRight,
    JS_LINE.settleCheck,
    JS_LINE.settleReturn,
  ],
  pseudo: [
    PSEUDO_LINE.loopHeader,
    PSEUDO_LINE.initSmallest,
    PSEUDO_LINE.compareLeft,
    PSEUDO_LINE.compareRight,
    PSEUDO_LINE.settleCheck,
    PSEUDO_LINE.settleReturn,
  ],
};

/** Role of each node at a given step, mapped to a `--viz-*` color in renderStep. */
const enum Role {
  Unprocessed,
  Active,
  Compare,
  Smallest,
  Settled,
}

type StepKind = "start" | "swap" | "settle" | "done";

export interface HeapStep {
  /** Snapshot of the array (heap, by index) at this step. */
  readonly array: readonly number[];
  /** Per-index role, one entry per array slot. */
  readonly roles: readonly Role[];
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, number>>;
}

const ROLE_FILL: Record<Role, string> = {
  [Role.Unprocessed]: "var(--viz-cell)",
  [Role.Active]: "var(--viz-mid)",
  [Role.Compare]: "var(--viz-compare)",
  [Role.Smallest]: "var(--viz-pivot)",
  [Role.Settled]: "var(--viz-sorted)",
};

const VIEW_W = 640;
const VIEW_H = 300;
const RADIUS = 20;
const LEVEL_H = 65;
const TOP_Y = 35;

interface NodePosition {
  x: number;
  y: number;
}

/**
 * Lays out array index `i` as node `i` of the complete binary tree implied by
 * the heap's array representation (children at `2i + 1` and `2i + 2`), using
 * an in-order visit to assign horizontal slots so sibling subtrees don't
 * overlap. Depends only on the array length, not its values.
 */
function layoutTree(n: number): NodePosition[] {
  const positions = new Array<NodePosition>(n);
  const order = new Array<number>(n);
  let counter = 0;
  const visit = (index: number, depth: number): void => {
    if (index >= n) {
      return;
    }
    visit(2 * index + 1, depth + 1);
    order[index] = counter;
    counter += 1;
    positions[index] = { x: 0, y: TOP_Y + depth * LEVEL_H };
    visit(2 * index + 2, depth + 1);
  };
  visit(0, 0);

  const colW = VIEW_W / (n + 1);
  for (let i = 0; i < n; i += 1) {
    positions[i].x = colW * (order[i] + 1);
  }
  return positions;
}

/**
 * Pure step model for building a min-heap. Independently simulates Floyd's
 * bottom-up sift-down build (it does not import the exercise function),
 * recording one step per subtree entered, per comparison outcome that swaps,
 * and per comparison outcome that settles, plus a terminal "done" step.
 * Returns the trace and the final heap array, so tests can assert this result
 * matches `buildMinHeap`.
 */
export function buildSteps(input: VizInput): { steps: HeapStep[]; result: number[] } {
  const arr = [...input.values];
  const n = arr.length;
  const steps: HeapStep[] = [];
  const settled = new Array<boolean>(n).fill(false);

  const pushStep = (
    kind: StepKind,
    params: Record<string, number>,
    decorate: (roles: Role[]) => void
  ): void => {
    const roles = settled.map((s) => (s ? Role.Settled : Role.Unprocessed));
    decorate(roles);
    steps.push({ array: [...arr], roles, kind, params });
  };

  const swap = (a: number, b: number): void => {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  };

  const siftDown = (start: number): void => {
    let parent = start;
    while (true) {
      const left = 2 * parent + 1;
      const right = 2 * parent + 2;
      let smallest = parent;
      if (left < n && arr[left] < arr[smallest]) {
        smallest = left;
      }
      if (right < n && arr[right] < arr[smallest]) {
        smallest = right;
      }

      if (smallest === parent) {
        pushStep("settle", { index: parent, value: arr[parent] }, (roles) => {
          roles[parent] = Role.Active;
          if (left < n) roles[left] = Role.Compare;
          if (right < n) roles[right] = Role.Compare;
        });
        return;
      }

      pushStep(
        "swap",
        {
          parentIndex: parent,
          childIndex: smallest,
          parentValue: arr[parent],
          childValue: arr[smallest],
        },
        (roles) => {
          roles[parent] = Role.Active;
          if (left < n) roles[left] = Role.Compare;
          if (right < n) roles[right] = Role.Compare;
          roles[smallest] = Role.Smallest;
        }
      );
      swap(parent, smallest);
      parent = smallest;
    }
  };

  for (let start = Math.floor(n / 2) - 1; start >= 0; start -= 1) {
    pushStep("start", { index: start, value: arr[start] }, (roles) => {
      roles[start] = Role.Active;
    });
    siftDown(start);
    settled[start] = true;
  }

  pushStep("done", {}, (roles) => {
    for (let i = 0; i < n; i += 1) roles[i] = Role.Settled;
  });

  return { steps, result: [...arr] };
}

const LINES_BY_KIND: Record<StepKind, CodeLines | null> = {
  start: START_LINES,
  swap: SWAP_LINES,
  settle: SETTLE_LINES,
  done: null,
};

/** Min-heap visualization: the array drawn as a complete binary tree, sifted into heap order. */
export const createViz: VizFactory = (input: VizInput): ExerciseViz => {
  const { steps, result } = buildSteps(input);
  const values = [...input.values];
  const n = values.length;
  const positions = layoutTree(n);

  // Step 0 is the initial, undecorated array (all unprocessed); the algorithm
  // steps follow.
  const initial: HeapStep = {
    array: values,
    roles: values.map(() => Role.Unprocessed),
    kind: "start",
    params: {},
  };
  const renderable: HeapStep[] = [initial, ...steps];

  return {
    totalSteps: renderable.length,
    result,
    describeStep(stepIndex: number): StepDescriptor | null {
      // Step 0 is the initial state and has no log row.
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
      svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
      clear(svg);
      const g = group();

      for (let i = 1; i < n; i += 1) {
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

      for (let i = 0; i < n; i += 1) {
        const pos = positions[i];
        const role = step.roles[i] ?? Role.Unprocessed;
        const isHighlighted = role === Role.Active || role === Role.Smallest;

        g.appendChild(
          circle({
            cx: pos.x,
            cy: pos.y,
            r: RADIUS,
            fill: ROLE_FILL[role],
            stroke: isHighlighted ? "var(--viz-mid-label)" : "var(--viz-stroke)",
            "stroke-width": isHighlighted ? 2.5 : 1.5,
          })
        );
        g.appendChild(
          text(String(step.array[i]), {
            x: pos.x,
            y: pos.y + 5,
            "text-anchor": "middle",
            fill: "var(--viz-text)",
            "font-size": 15,
            "font-weight": 600,
          })
        );
        g.appendChild(
          text(String(i), {
            x: pos.x,
            y: pos.y - RADIUS - 8,
            "text-anchor": "middle",
            fill: "var(--viz-muted)",
            "font-size": 11,
          })
        );
      }

      svg.appendChild(g);
    },
  };
};
