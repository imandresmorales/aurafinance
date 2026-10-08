/**
 * roundUpSavingsSimulator.js
 * Automated Spare-Change & Round-Up Micro-Savings Simulator for AuraFinance.
 * Simulates rounding up transactions to nearest $1, $5, $10 with multipliers and compound investment projections.
 * Zero-Knowledge local processing.
 */

export const ROUND_UP_MODES = {
  NEAREST_1: 'NEAREST_1',
  NEAREST_5: 'NEAREST_5',
  NEAREST_10: 'NEAREST_10',
};

/**
 * Calculates the round-up spare change for a single transaction amount.
 * @param {number} amount - Original transaction amount
 * @param {Object} [options]
 * @param {string} [options.mode='NEAREST_1'] - ROUND_UP_MODES
 * @param {number} [options.multiplier=1] - 1x, 2x, 3x spare change multiplier
 * @param {number} [options.fixedBoost=0] - Additional fixed micro-deposit per transaction
 * @returns {{ originalAmount: number, roundedAmount: number, spareChange: number }}
 */
export function calculateTransactionRoundUp(amount = 0, options = {}) {
  const original = Math.max(0, Number(amount) || 0);
  const mode = options.mode || ROUND_UP_MODES.NEAREST_1;
  const multiplier = Math.max(1, Number(options.multiplier ?? 1));
  const boost = Math.max(0, Number(options.fixedBoost ?? 0));

  if (original <= 0) {
    return { originalAmount: 0, roundedAmount: 0, spareChange: 0 };
  }

  let rounded = original;

  if (mode === ROUND_UP_MODES.NEAREST_5) {
    rounded = Math.ceil(original / 5) * 5;
    if (rounded === original) rounded += 5;
  } else if (mode === ROUND_UP_MODES.NEAREST_10) {
    rounded = Math.ceil(original / 10) * 10;
    if (rounded === original) rounded += 10;
  } else {
    // Nearest $1
    rounded = Math.ceil(original);
    if (rounded === original) rounded += 1;
  }

  const baseSpareChange = rounded - original;
  const totalSpareChange = Math.round((baseSpareChange * multiplier + boost) * 100) / 100;

  return {
    originalAmount: original,
    roundedAmount: Math.round((original + totalSpareChange) * 100) / 100,
    spareChange: totalSpareChange,
  };
}

/**
 * Simulates micro-savings accumulated across a historical dataset of transactions.
 * @param {Array<Object>} transactions
 * @param {Object} [options]
 * @returns {Object} Micro-savings simulation report
 */
export function simulateRoundUpFromTransactions(transactions = [], options = {}) {
  const expenseTxs = (transactions || []).filter(
    (t) => !t.deleted && (t.type === 'EXPENSE' || t.type === 'expense')
  );

  let totalSpareChangeSaved = 0;
  const detailedRoundUps = [];

  expenseTxs.forEach((tx) => {
    const calc = calculateTransactionRoundUp(Number(tx.amount) || 0, options);
    if (calc.spareChange > 0) {
      totalSpareChangeSaved += calc.spareChange;
      detailedRoundUps.push({
        transactionId: tx.id,
        concept: tx.concept || tx.description || 'Gasto',
        date: tx.date,
        originalAmount: calc.originalAmount,
        spareChange: calc.spareChange,
      });
    }
  });

  const txCount = expenseTxs.length;
  const averagePerTx = txCount > 0 ? totalSpareChangeSaved / txCount : 0;

  // Extrapolate monthly and annual micro-savings (assuming ~45 transactions/month typical pace)
  const monthlyEstimated = txCount >= 10
    ? (totalSpareChangeSaved / Math.max(1, txCount / 40))
    : averagePerTx * 45;
  const annualEstimated = monthlyEstimated * 12;

  return {
    totalSpareChangeSaved: Math.round(totalSpareChangeSaved * 100) / 100,
    eligibleTransactionsCount: txCount,
    averageRoundUpPerTransaction: Math.round(averagePerTx * 100) / 100,
    monthlyEstimatedSpareChange: Math.round(monthlyEstimated * 100) / 100,
    annualEstimatedSpareChange: Math.round(annualEstimated * 100) / 100,
    detailedRoundUps: detailedRoundUps.slice(0, 50),
  };
}

/**
 * Projects the compound growth of micro-savings invested into an index fund across multiple horizons.
 * @param {number} monthlySavingsAmount - Monthly micro-savings generated
 * @param {Array<number>} [horizons=[1, 3, 5, 10, 20]] - Horizon years
 * @param {number} [annualReturnRate=0.08] - Expected annual compounding rate
 * @returns {Array<{ years: number, totalDeposited: number, futureValue: number, interestEarned: number }>}
 */
export function projectRoundUpCompoundGrowth(
  monthlySavingsAmount = 50,
  horizons = [1, 3, 5, 10, 20],
  annualReturnRate = 0.08
) {
  const pmt = Math.max(0, Number(monthlySavingsAmount) || 50);
  const r = Number(annualReturnRate) || 0.08;
  const i = r / 12;

  return horizons.map((years) => {
    const months = years * 12;
    const totalDeposited = pmt * months;
    const fv = i > 0
      ? pmt * ((Math.pow(1 + i, months) - 1) / i)
      : totalDeposited;

    return {
      years,
      totalDeposited: Math.round(totalDeposited * 100) / 100,
      futureValue: Math.round(fv * 100) / 100,
      interestEarned: Math.round((fv - totalDeposited) * 100) / 100,
    };
  });
}
