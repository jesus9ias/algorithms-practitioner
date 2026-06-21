/**
 * @typedef {{ value: number, next: SLLNode | null }} SLLNode
 */

/**
 * @param {number[]} arr
 * @returns {SLLNode | null} head of the deduplicated singly linked list
 */
export function removeDuplicatesSLL(arr) {
  if (arr.length === 0) return null;

  let head = { value: arr[0], next: null };
  let cur = head;
  for (let i = 1; i < arr.length; i++) {
    cur.next = { value: arr[i], next: null };
    cur = cur.next;
  }

  const seen = new Set([head.value]);
  let prev = head;
  let node = head.next;

  while (node !== null) {
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
