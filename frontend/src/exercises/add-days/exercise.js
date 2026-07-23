// Add Days — a single pure function. Adds (or subtracts, when negative) a
// number of days to a calendar date given as one comma-separated
// "YYYY-MM-DD,±N" string, by converting the date to its UTC epoch-millisecond
// instant, shifting by N days, and formatting the result back to ISO 8601. No
// side effects.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {string} input - an ISO 8601 date and a signed day count separated by a comma, e.g. "2024-01-15,10"
 * @returns {string} the resulting date in "YYYY-MM-DD" format
 */
export function addDays(input) {
  const [isoDate, offsetStr] = input.split(",");
  const startMs = parseIsoDate(isoDate);
  const offsetDays = Number(offsetStr);
  const shiftedMs = startMs + offsetDays * MS_PER_DAY;
  return formatIsoDate(shiftedMs);
}

/**
 * @param {string} isoDate - a date in "YYYY-MM-DD" format, e.g. "2024-03-01"
 * @returns {number} milliseconds since the Unix epoch (UTC midnight of isoDate)
 */
function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * @param {number} ms - milliseconds since the Unix epoch
 * @returns {string} the corresponding UTC date in "YYYY-MM-DD" format
 */
function formatIsoDate(ms) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
