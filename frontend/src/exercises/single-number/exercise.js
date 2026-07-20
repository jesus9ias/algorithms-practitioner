// Single Number — a single pure function. Receives an array of integers where
// every value appears exactly twice except one, and returns that unpaired
// value. It XORs every element together: XOR is commutative and associative,
// and a value XORed with itself is 0, so every duplicate pair cancels out,
// leaving only the single element — O(n) time, O(1) extra space.

/**
 * @param {number[]} arr - integers where every value appears twice except one
 * @returns {number} the value that appears only once
 */
export function singleNumber(arr) {
  let result = 0;

  for (const value of arr) {
    result ^= value;
  }

  return result;
}
