// Two Sum — a single pure function. Receives an array of integers and a
// target value, and returns the indices of the two numbers that add up to
// the target, using a hash map (value -> index) to find the complement of
// each number in a single pass, in O(n).

/**
 * @param {number[]} arr - array of integers
 * @param {number} target - the target sum
 * @returns {number[]} the two indices whose values add up to target, or [] if no such pair exists
 */
export function twoSum(arr, target) {
  const seen = new Map();
  for (let i = 0; i < arr.length; i += 1) {
    const complement = target - arr[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(arr[i], i);
  }
  return [];
}
