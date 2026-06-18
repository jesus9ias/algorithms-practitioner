// Binary Search Tree — a single pure function. Builds a BST from the given
// values (duplicates ignored) and returns them via in-order traversal, i.e.
// ascending order. Internal helpers keep insertion and traversal readable.

/**
 * @param {number[]} values - values to insert, in order
 * @returns {number[]} the values in ascending (in-order) order
 */
export function binarySearchTreeInorder(values) {
  const insert = (node, value) => {
    if (node === null) {
      return { value, left: null, right: null };
    }
    if (value < node.value) {
      node.left = insert(node.left, value);
    } else if (value > node.value) {
      node.right = insert(node.right, value);
    }
    return node;
  };

  let root = null;
  for (const value of values) {
    root = insert(root, value);
  }

  const out = [];
  const walk = (node) => {
    if (node === null) {
      return;
    }
    walk(node.left);
    out.push(node.value);
    walk(node.right);
  };
  walk(root);
  return out;
}
