// Maximum Subarray — a single pure function. Receives an array of integers and
// returns the sum of the contiguous subarray with the largest sum, using
// Kadane's algorithm: a single pass that tracks the best sum ending at each
// index, extending or restarting the running sum as it goes, in O(n).

/**
 * @param {number[]} arr - array of integers
 * @returns {number} the largest sum of any contiguous subarray (0 for an empty array)
 */
export function maxSubArray(arr) {
  if (arr.length === 0) {
    return 0;
  }

  let currentSum = arr[0];
  let maxSum = arr[0];

  for (let i = 1; i < arr.length; i += 1) {
    currentSum = Math.max(arr[i], currentSum + arr[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}
