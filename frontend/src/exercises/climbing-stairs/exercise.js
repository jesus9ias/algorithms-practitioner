// Climbing Stairs — a single pure function. Receives a non-negative integer n
// (the number of stairs) and returns the number of distinct ways to reach the
// top, taking either 1 or 2 steps at a time. Computed via bottom-up dynamic
// programming: ways(n) = ways(n-1) + ways(n-2), built iteratively from the
// base cases in O(n) time and O(1) extra space.

/**
 * @param {number} n - number of stairs to climb
 * @returns {number} the number of distinct ways to reach the top
 */
export function climbingStairs(n) {
  if (n <= 1) return 1;

  let prev = 1;
  let curr = 1;
  for (let step = 2; step <= n; step += 1) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}
