/**
 * @typedef {{ value: number, prev: DLLNode | null, next: DLLNode | null }} DLLNode
 */

/**
 * @param {number[]} arr
 * @returns {DLLNode | null} head of the deduplicated doubly linked list
 */
export function removeDuplicatesDLL(arr) {
  if (arr.length === 0) return null;

  let head = { value: arr[0], prev: null, next: null };
  let cur = head;
  for (let i = 1; i < arr.length; i++) {
    const node = { value: arr[i], prev: cur, next: null };
    cur.next = node;
    cur = node;
  }

  const seen = new Set([head.value]);
  let prev = head;
  let node = head.next;

  while (node !== null) {
    const next = node.next;
    if (seen.has(node.value)) {
      prev.next = next;
      if (next !== null) next.prev = prev;
    } else {
      seen.add(node.value);
      prev = node;
    }
    node = next;
  }

  return head;
}
