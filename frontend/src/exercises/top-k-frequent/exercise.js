// Most Frequent Elements — a single pure function. Receives an array of
// integers and a number k, and returns the k most frequent values ordered
// from highest to lowest frequency, using bucket sort to run in O(n): count
// each value's frequency, scatter values into buckets indexed by frequency,
// then read the buckets from the highest frequency down.

/**
 * @param {number[]} arr - array of integers
 * @param {number} k - how many of the most frequent values to return
 * @returns {number[]} the k most frequent values, most frequent first
 */
export function topKFrequent(arr, k) {
  const counts = new Map();
  for (const value of arr) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const buckets = Array.from({ length: arr.length + 1 }, () => []);
  for (const [value, count] of counts) {
    buckets[count].push(value);
  }

  const result = [];
  for (let freq = buckets.length - 1; freq >= 1; freq -= 1) {
    for (const value of buckets[freq]) {
      if (result.length >= k) {
        return result;
      }
      result.push(value);
    }
  }
  return result;
}
