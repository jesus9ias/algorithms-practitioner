// Reverse String — a single pure function. Reverses the character order of a
// string using the classic two-pointer swap: pointers start at both ends and
// walk inward, swapping the characters at each position until they meet or
// cross. No side effects.

/**
 * @param {string} s - the string to reverse, e.g. "hello"
 * @returns {string} the characters of s in reverse order, e.g. "olleh"
 */
export function reverseString(s) {
  const chars = [...s];
  let left = 0;
  let right = chars.length - 1;

  while (left < right) {
    const temp = chars[left];
    chars[left] = chars[right];
    chars[right] = temp;
    left += 1;
    right -= 1;
  }

  return chars.join("");
}
