// Search in Rotated Sorted Array — a single pure function. Receives an
// ascending array that was rotated at an unknown pivot, and a target,
// returns the index of the target, or -1 if it is not present.

/**
 * @param {number[]} arr - ascending array rotated at an unknown pivot
 * @param {number} target - value to find
 * @returns {number} index of target, or -1 if absent
 */
export function searchRotated(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid;
    }

    if (arr[lo] <= arr[mid]) {
      if (arr[lo] <= target && target < arr[mid]) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    } else {
      if (arr[mid] < target && target <= arr[hi]) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
  }

  return -1;
}
