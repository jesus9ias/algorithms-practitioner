// Fibonacci — a single pure function. Receives a non-negative integer n and
// returns the n-th Fibonacci number (fib(0) = 0, fib(1) = 1), computed via
// recursive decomposition (fib(n) = fib(n-1) + fib(n-2)) with memoization so
// each sub-problem is solved only once, in O(n) time and space.

/**
 * @param {number} n - index into the Fibonacci sequence (0-based)
 * @returns {number} the n-th Fibonacci number
 */
export function fibonacci(n) {
  return n <= 0 ? 0 : fib(n, new Map());
}

function fib(k, memo) {
  if (k <= 1) return k;
  if (memo.has(k)) return memo.get(k);
  const value = fib(k - 1, memo) + fib(k - 2, memo);
  memo.set(k, value);
  return value;
}
