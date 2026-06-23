// Balanced Brackets validator — a single pure function. Scans a string once and
// matches every closing bracket against the most recent unmatched opening
// bracket using a stack; characters that are not brackets are ignored. Returns
// whether all (), [] and {} are correctly paired and nested. No side effects.

// Each closing bracket maps to the opening bracket it must match.
const PAIRS = { ")": "(", "]": "[", "}": "{" };

/**
 * @param {string} s - the string to validate, e.g. "a(b[c]d)e"
 * @returns {boolean} true if every bracket is balanced and properly nested
 */
export function isBalanced(s) {
  const stack = [];

  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.pop() !== PAIRS[ch]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}
