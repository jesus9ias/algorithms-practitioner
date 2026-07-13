// Level-order Traversal (BFS) — a single pure function. Interprets the given
// values as a complete binary tree laid out level-order (index i's children
// live at 2i+1 and 2i+2), then walks it breadth-first with a queue of
// indices, grouping each depth's node values into its own array.

/**
 * @param {number[]} values - tree nodes in level-order (index i's children are at 2i+1 and 2i+2)
 * @returns {number[][]} node values grouped by depth level, shallowest first
 */
export function levelOrderTraversal(values) {
  if (values.length === 0) {
    return [];
  }

  const levels = [];
  let queue = [0];

  while (queue.length > 0) {
    const level = [];
    const nextQueue = [];
    for (const index of queue) {
      level.push(values[index]);
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < values.length) {
        nextQueue.push(left);
      }
      if (right < values.length) {
        nextQueue.push(right);
      }
    }
    levels.push(level);
    queue = nextQueue;
  }

  return levels;
}
