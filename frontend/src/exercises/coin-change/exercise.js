// Coin Change — a single pure function. Receives an array of coin
// denominations and a target amount, and returns the minimum number of coins
// needed to make that amount, or -1 if it cannot be made. Computed via
// bottom-up dynamic programming: dp[i] holds the minimum coins needed for
// amount i, built from the base case dp[0] = 0 by trying every coin at every
// amount from 1 up to the target.

/**
 * @param {number[]} coins - available coin denominations
 * @param {number} amount - target amount to make
 * @returns {number} minimum number of coins to make amount, or -1 if impossible
 */
export function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i += 1) {
    for (const coin of coins) {
      if (coin > i) continue;
      const candidate = dp[i - coin] + 1;
      if (candidate < dp[i]) {
        dp[i] = candidate;
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
