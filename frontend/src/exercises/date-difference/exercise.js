// Date Difference — a single pure function. Computes the number of whole days
// between two calendar dates given as one comma-separated ISO 8601
// ("YYYY-MM-DD") string, by converting each date to its UTC epoch-millisecond
// instant and taking the rounded absolute difference. No side effects.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {string} input - two ISO 8601 dates separated by a comma, e.g. "2024-01-15,2024-03-22"
 * @returns {number} the number of whole days between the two dates (always non-negative)
 */
export function dateDifference(input) {
  const [firstDate, secondDate] = input.split(",");
  const firstMs = parseIsoDate(firstDate);
  const secondMs = parseIsoDate(secondDate);
  return Math.round(Math.abs(secondMs - firstMs) / MS_PER_DAY);
}

/**
 * @param {string} isoDate - a date in "YYYY-MM-DD" format, e.g. "2024-03-01"
 * @returns {number} milliseconds since the Unix epoch (UTC midnight of isoDate)
 */
function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
