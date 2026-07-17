// Top-K Elements — a single pure function. Receives an array of integers and
// a number k, and returns the k largest values in descending order, using a
// min-heap bounded to size k: each value is pushed onto the heap, and once
// the heap holds more than k elements the smallest is popped off, so by the
// end the heap holds exactly the k largest values seen — O(n log k).

/**
 * @param {number[]} arr - array of integers
 * @param {number} k - how many of the largest values to return
 * @returns {number[]} the k largest values, largest first
 */
export function topKElements(arr, k) {
  const heap = [];
  for (const value of arr) {
    heapPush(heap, value);
    if (heap.length > k) {
      heapPop(heap);
    }
  }
  const result = [];
  while (heap.length > 0) {
    result.push(heapPop(heap));
  }
  return result.reverse();
}

function heapPush(heap, value) {
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

function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}

function siftDown(heap, start) {
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

function swap(heap, a, b) {
  const temp = heap[a];
  heap[a] = heap[b];
  heap[b] = temp;
}
