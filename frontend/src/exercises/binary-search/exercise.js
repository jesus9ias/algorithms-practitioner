// Binary Search — a single pure function. Receives a sorted array and a target,
// returns the index of the target, or -1 if it is not present.

/**
 * @param {number[]} arr - sorted array of integers
 * @param {number} target - value to find
 * @returns {number} index of target, or -1 if absent
 */
export function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid;
    }
    if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return -1;
}
