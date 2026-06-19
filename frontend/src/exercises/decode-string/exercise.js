// String Decoder — a single pure function. Expands a string encoded in the
// run-length format `n[substring]` (groups may be nested) by scanning it once
// with two parallel stacks: one for pending repeat counts, one for the text
// built before each group. Internal state only; no side effects.

/**
 * @param {string} s - the encoded string, e.g. "3[a2[c]]"
 * @returns {string} the fully expanded string, e.g. "accaccacc"
 */
export function decodeString(s) {
  const countStack = [];
  const textStack = [];
  let current = "";
  let count = 0;

  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      count = count * 10 + Number(ch);
    } else if (ch === "[") {
      countStack.push(count);
      textStack.push(current);
      count = 0;
      current = "";
    } else if (ch === "]") {
      const repeat = countStack.pop();
      const previous = textStack.pop();
      current = previous + current.repeat(repeat);
    } else {
      current += ch;
    }
  }

  return current;
}
