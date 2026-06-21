/**
 * @typedef {{ value: number, next: CLLNode }} CLLNode
 */

/**
 * @param {number[]} arr
 * @returns {CLLNode | null} head of the deduplicated circular linked list
 */
export function removeDuplicatesCLL(arr) {
  if (arr.length === 0) return null;

  let head = { value: arr[0], next: null };
  let cur = head;
  for (let i = 1; i < arr.length; i++) {
    cur.next = { value: arr[i], next: null };
    cur = cur.next;
  }
  cur.next = head;

  const seen = new Set([head.value]);
  let prev = head;
  let node = head.next;

  while (node !== head) {
    const next = node.next;
    if (seen.has(node.value)) {
      prev.next = next;
    } else {
      seen.add(node.value);
      prev = node;
    }
    node = next;
  }

  return head;
}
