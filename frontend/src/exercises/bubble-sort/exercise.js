// Bubble sort — a single pure function. Receives an array of integers and
// returns a new array sorted in ascending order, making repeated adjacent-swap
// passes with an early-exit check: if a pass makes no swaps, the array is done.

/**
 * @param {number[]} arr - array of integers to sort
 * @returns {number[]} a new array with the values in ascending order
 */
export function bubbleSort(arr) {
  const result = [...arr];
  const n = result.length;
  for (let i = 0; i < n - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j += 1) {
      if (result[j] > result[j + 1]) {
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return result;
}
