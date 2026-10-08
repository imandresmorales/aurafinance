/**
 * spendingAnomalyEngine.js
 * Advanced Statistical Anomaly Detection Engine using Z-Scores & Standard Deviations for AuraFinance.
 * Detects spending spikes, unusual merchant charges, and macro budget deviations.
 * Zero-Knowledge local processing.
 */

export const ANOMALY_SEVERITY = {
  MODERATE: 'MODERATE', // 2.0 <= Z < 3.0
  HIGH: 'HIGH',         // 3.0 <= Z < 4.0
  CRITICAL: 'CRITICAL', // Z >= 4.0
};

/**
 * Computes arithmetic mean and sample standard deviation for an array of numbers.
 * @param {Array<number>} values
 * @returns {{ mean: number, stdDev: number, count: number, min: number, max: number, median: number }}
 */
export function computeStatisticalParameters(values = []) {
  const nums = values.map(Number).filter((n) => !isNaN(n) && Number.isFinite(n));
  const count = nums.length;

  if (count === 0) {
    return { mean: 0, stdDev: 0, count: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...nums].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[count - 1];
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  const sum = nums.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  if (count < 2) {
    return { mean: Math.round(mean * 100) / 100, stdDev: 0, count, min, max, median };
  }

  const varianceSum = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const sampleVariance = varianceSum / (count - 1);
  const stdDev = Math.sqrt(sampleVariance);

  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    count,
    min,
    max,
    median,
  };
}

/**
 * Calculates historical spending baselines per category.
 * @param {Array<Object>} transactions
 * @returns {Record<string, { category: string, mean: number, stdDev: number, count: number, threshold2Sigma: number, threshold3Sigma: number }>}
 */
export function calculateCategorySpendingBaselines(transactions = []) {
  const expenseTxs = (transactions || []).filter(
    (t) => !t.deleted && (t.type === 'EXPENSE' || t.type === 'expense')
  );

  const categoryBuckets = {};

  expenseTxs.forEach((tx) => {
    const cat = tx.category || 'General';
    if (!categoryBuckets[cat]) {
      categoryBuckets[cat] = [];
    }
    categoryBuckets[cat].push(Number(tx.amount) || 0);
  });

  const baselines = {};

  Object.entries(categoryBuckets).forEach(([cat, amounts]) => {
    const stats = computeStatisticalParameters(amounts);
    const threshold2Sigma = Math.round((stats.mean + 2.0 * stats.stdDev) * 100) / 100;
    const threshold3Sigma = Math.round((stats.mean + 3.0 * stats.stdDev) * 100) / 100;

    baselines[cat] = {
      category: cat,
      mean: stats.mean,
      stdDev: stats.stdDev,
      count: stats.count,
      median: stats.median,
      threshold2Sigma,
      threshold3Sigma,
    };
  });

  return baselines;
}

/**
 * Detects statistical anomalies and spikes using Z-Score standard deviations (Z >= 2.0).
 * @param {Array<Object>} transactions
 * @param {Object} [options]
 * @param {number} [options.minZScore=2.0] - Minimum Z-score threshold (default 2.0 standard deviations)
 * @param {number} [options.minAbsoluteAmount=30] - Minimum amount threshold to avoid noise on micro-expenses
 * @param {number} [options.minCategorySamples=4] - Minimum transactions in category to compute reliable sigma
 * @returns {Array<Object>} List of detected transaction anomalies
 */
export function detectStandardDeviationAnomalies(transactions = [], options = {}) {
  const minZ = Number(options.minZScore ?? 2.0);
  const minAmount = Number(options.minAbsoluteAmount ?? 30);
  const minSamples = Number(options.minCategorySamples ?? 4);

  const baselines = calculateCategorySpendingBaselines(transactions);
  const expenseTxs = (transactions || []).filter(
    (t) => !t.deleted && (t.type === 'EXPENSE' || t.type === 'expense')
  );

  const anomalies = [];

  expenseTxs.forEach((tx) => {
    const cat = tx.category || 'General';
    const base = baselines[cat];

    if (!base || base.count < minSamples || base.stdDev <= 0) return;

    const amount = Number(tx.amount) || 0;
    if (amount < minAmount) return;

    const zScore = (amount - base.mean) / base.stdDev;

    if (zScore >= minZ) {
      let severity = ANOMALY_SEVERITY.MODERATE;
      if (zScore >= 4.0) {
        severity = ANOMALY_SEVERITY.CRITICAL;
      } else if (zScore >= 3.0) {
        severity = ANOMALY_SEVERITY.HIGH;
      }

      const pctOverMean = Math.round(((amount - base.mean) / (base.mean || 1)) * 100);

      anomalies.push({
        transactionId: tx.id,
        concept: tx.concept || tx.description || 'Sin concepto',
        amount,
        date: tx.date,
        category: cat,
        categoryMean: base.mean,
        categoryStdDev: base.stdDev,
        zScore: Math.round(zScore * 10) / 10,
        severity,
        pctOverMean,
        explanation: `Gasto ${zScore.toFixed(1)} desviaciones estándar sobre la media histórica (+${pctOverMean}% sobre $${base.mean}).`,
      });
    }
  });

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

/**
 * Detects monthly aggregate spending anomalies across full monthly totals.
 * @param {Record<string, number>} monthlySpendMap - Map of 'YYYY-MM' -> total spend
 * @returns {Array<Object>} Macro monthly budget anomalies
 */
export function detectMonthlyMacroAnomalies(monthlySpendMap = {}) {
  const entries = Object.entries(monthlySpendMap);
  if (entries.length < 3) return [];

  const values = entries.map(([, total]) => Number(total) || 0);
  const stats = computeStatisticalParameters(values);

  if (stats.stdDev <= 0) return [];

  const macroAnomalies = [];

  entries.forEach(([monthStr, total]) => {
    const zScore = (total - stats.mean) / stats.stdDev;
    if (zScore >= 1.8) {
      macroAnomalies.push({
        month: monthStr,
        totalSpend: Math.round(total * 100) / 100,
        averageMonthlySpend: stats.mean,
        stdDev: stats.stdDev,
        zScore: Math.round(zScore * 10) / 10,
        pctOverAverage: Math.round(((total - stats.mean) / stats.mean) * 100),
      });
    }
  });

  return macroAnomalies;
}
