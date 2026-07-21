// Count Bits — a single pure function. Receives a non-negative integer n and
// returns the number of 1 bits (population count / Hamming weight) in its
// binary representation, computed via Brian Kernighan's trick: repeatedly AND
// the value with itself minus one, which clears its lowest set bit on every
// iteration, so the loop runs exactly once per set bit — O(popcount) time,
// O(1) space.

/**
 * @param {number} n - non-negative integer to count set bits for
 * @returns {number} the number of 1 bits in n's binary representation
 */
export function countBits(n) {
  if (n <= 0) return 0;

  let count = 0;
  let remaining = n;

  while (remaining !== 0) {
    remaining &= remaining - 1;
    count += 1;
  }

  return count;
}
