// Linked List — a single pure function. Builds a singly linked list from the
// given values and returns its values reversed. Internal node helpers keep the
// reversal readable while exporting only the entry point.

/**
 * @param {number[]} values - list node values, in order
 * @returns {number[]} the values in reversed order
 */
export function reverseLinkedList(values) {
  // Build the singly linked list.
  let head = null;
  for (let i = values.length - 1; i >= 0; i -= 1) {
    head = { value: values[i], next: head };
  }

  // Reverse the pointers.
  let prev = null;
  let current = head;
  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  // Read the reversed list back into an array.
  const result = [];
  for (let node = prev; node !== null; node = node.next) {
    result.push(node.value);
  }
  return result;
}
