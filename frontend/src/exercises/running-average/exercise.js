// Running Average — a single pure function. Receives an array of integers and a
// window size w, and returns the average of every consecutive window of size w,
// rounded to 2 decimals. It keeps a running sum and slides the window one step
// at a time (add the entering value, subtract the leaving one), so it runs in O(n).

/**
 * @param {number[]} arr - array of integers
 * @param {number} w - window size (elements per window)
 * @returns {number[]} average of every length-w window, rounded to 2 decimals
 */
export function runningAverage(arr, w) {
  const averages = [];
  if (w <= 0 || w > arr.length) {
    return averages;
  }

  let sum = 0;
  for (let i = 0; i < w; i += 1) {
    sum += arr[i];
  }
  averages.push(round2(sum / w));

  for (let i = w; i < arr.length; i += 1) {
    sum += arr[i] - arr[i - w];
    averages.push(round2(sum / w));
  }

  return averages;
}

/** Rounds a number to two decimals. */
function round2(value) {
  return Math.round(value * 100) / 100;
}
