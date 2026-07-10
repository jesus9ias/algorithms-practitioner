// In-order Traversal — a single pure function. Interprets the given values
// as a complete binary tree laid out level-order (index i's children live
// at 2i+1 and 2i+2), then walks it recursively in-order (left, node, right).

/**
 * @param {number[]} values - tree nodes in level-order (index i's children are at 2i+1 and 2i+2)
 * @returns {number[]} the values in in-order (left, node, right) order
 */
export function inorderTraversal(values) {
  const out = [];

  const walk = (index) => {
    if (index >= values.length) {
      return;
    }
    walk(2 * index + 1);
    out.push(values[index]);
    walk(2 * index + 2);
  };

  walk(0);
  return out;
}
