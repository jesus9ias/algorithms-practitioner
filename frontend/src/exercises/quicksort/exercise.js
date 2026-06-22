// Quicksort — a single pure function. Receives an array of integers and
// returns a new array sorted in ascending order, using divide-and-conquer
// quicksort with Lomuto partitioning (the last element of each range is the
// pivot).

/**
 * @param {number[]} arr - array of integers to sort
 * @returns {number[]} a new array with the values in ascending order
 */
export function quickSort(arr) {
  const result = [...arr];
  sort(result, 0, result.length - 1);
  return result;
}

function sort(arr, lo, hi) {
  if (lo >= hi) {
    return;
  }
  const pivotIndex = partition(arr, lo, hi);
  sort(arr, lo, pivotIndex - 1);
  sort(arr, pivotIndex + 1, hi);
}

function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let boundary = lo;
  for (let j = lo; j < hi; j += 1) {
    if (arr[j] < pivot) {
      swap(arr, boundary, j);
      boundary += 1;
    }
  }
  swap(arr, boundary, hi);
  return boundary;
}

function swap(arr, a, b) {
  const temp = arr[a];
  arr[a] = arr[b];
  arr[b] = temp;
}
