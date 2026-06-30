// Merge Sort — a single pure function. Receives an array of integers and
// returns a new array sorted in ascending order, using divide-and-conquer:
// it splits the array in half, recursively sorts each half, then merges them.

/**
 * @param {number[]} arr - array of integers to sort
 * @returns {number[]} a new array with the values in ascending order
 */
export function mergeSort(arr) {
  if (arr.length <= 1) return [...arr];
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i]);
      i += 1;
    } else {
      result.push(right[j]);
      j += 1;
    }
  }
  return result.concat(left.slice(i), right.slice(j));
}
