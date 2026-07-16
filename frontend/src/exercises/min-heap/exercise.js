// Build a min-heap — a single pure function. Receives an array of integers
// and returns a new array holding the same values rearranged so the array
// (read as a complete binary tree, where index i's children sit at 2i + 1
// and 2i + 2) satisfies the min-heap property: every parent is less than or
// equal to both of its children. Uses Floyd's bottom-up build-heap: sift down
// from the last parent node to the root.

/**
 * @param {number[]} arr - array of integers to heapify
 * @returns {number[]} a new array satisfying the min-heap property
 */
export function buildMinHeap(arr) {
  const heap = [...arr];
  const n = heap.length;
  for (let start = Math.floor(n / 2) - 1; start >= 0; start -= 1) {
    siftDown(heap, start, n);
  }
  return heap;
}

function siftDown(heap, start, size) {
  let parent = start;
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

function swap(heap, a, b) {
  const temp = heap[a];
  heap[a] = heap[b];
  heap[b] = temp;
}
