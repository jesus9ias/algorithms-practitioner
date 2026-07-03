// Palindrome Check — a single pure function. Checks whether a string reads
// the same forwards and backwards using the classic two-pointer scan: one
// pointer starts at the beginning, the other at the end, and on each step
// they compare the characters they point to. As soon as a pair does not
// match the string cannot be a palindrome and the function returns early;
// otherwise the pointers move one step toward each other until they meet or
// cross. No side effects.

/**
 * @param {string} s - the string to check, e.g. "racecar"
 * @returns {boolean} true if s reads the same forwards and backwards
 */
export function isPalindrome(s) {
  const chars = [...s];
  let left = 0;
  let right = chars.length - 1;

  while (left < right) {
    if (chars[left] !== chars[right]) {
      return false;
    }
    left += 1;
    right -= 1;
  }

  return true;
}
