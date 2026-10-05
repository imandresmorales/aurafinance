/**
 * variableRecurringEngine.js
 * Variable Bill Estimation & Inflation-Indexed Recurrence Engine for AuraFinance.
 * Zero-Knowledge local processing.
 */

/**
 * Estimates the next occurrence amount for variable recurring bills (electricity, water, gas)
 * using weighted recent moving averages, seasonal variance, and optional inflation.
 * @param {Object} params
 * @param {Array<number|Object>} [params.history=[]] - Past payment amounts or transaction objects
 * @param {number} [params.seasonalMultiplier=1.0] - Seasonal factor (e.g. 1.25 for winter heating)
 * @param {number} [params.annualInflationRate=0.0] - Annual expected inflation rate (e.g. 0.035 for 3.5%)
 * @param {number} [params.fallbackAmount=50] - Fallback baseline if no history exists
 * @returns {{ estimatedAmount: number, confidence: number, minHistorical: number, maxHistorical: number, averageHistorical: number }}
 */
export function estimateVariableBillAmount({
  history = [],
  seasonalMultiplier = 1.0,
  annualInflationRate = 0.0,
  fallbackAmount = 50,
} = {}) {
  // Extract pure numbers from history
  const amounts = history
    .map((h) => (typeof h === 'object' && h !== null ? Number(h.amount) : Number(h)))
    .filter((a) => !isNaN(a) && a > 0);

  if (amounts.length === 0) {
    const base = Number(fallbackAmount) || 50;
    const adjusted = base * Math.max(0.1, Number(seasonalMultiplier) || 1.0) * (1 + (Number(annualInflationRate) || 0));
    return {
      estimatedAmount: Math.round(adjusted * 100) / 100,
      confidence: 30,
      minHistorical: base,
      maxHistorical: base,
      averageHistorical: base,
    };
  }

  const minHistorical = Math.min(...amounts);
  const maxHistorical = Math.max(...amounts);
  const sum = amounts.reduce((a, b) => a + b, 0);
  const averageHistorical = sum / amounts.length;

  // Weighted moving average: give higher weight to most recent 3 entries
  let weightedSum = 0;
  let totalWeights = 0;

  amounts.forEach((amt, index) => {
    // 1-based weight increasing towards latest index
    const weight = index + 1;
    weightedSum += amt * weight;
    totalWeights += weight;
  });

  const weightedBase = totalWeights > 0 ? weightedSum / totalWeights : averageHistorical;
  const inflationFactor = 1 + (Number(annualInflationRate) || 0);
  const seasonalFactor = Math.max(0.1, Number(seasonalMultiplier) || 1.0);

  const estimatedAmount = weightedBase * seasonalFactor * inflationFactor;
  const confidence = Math.min(95, 40 + amounts.length * 15);

  return {
    estimatedAmount: Math.round(estimatedAmount * 100) / 100,
    confidence,
    minHistorical: Math.round(minHistorical * 100) / 100,
    maxHistorical: Math.round(maxHistorical * 100) / 100,
    averageHistorical: Math.round(averageHistorical * 100) / 100,
  };
}

/**
 * Projects inflation-adjusted recurring cost across multiple future years.
 * @param {Object} rule - Base recurring rule { amount, frequency, name }
 * @param {number} [horizonYears=5] - Number of future years to project
 * @param {number} [annualInflationRate=0.03] - Expected annual inflation rate (e.g. 0.03 = 3%)
 * @returns {Array<{ year: number, estimatedAmount: number, cumulativeInflation: number, annualTotalCost: number }>}
 */
export function generateInflationAdjustedProjections(rule, horizonYears = 5, annualInflationRate = 0.03) {
  if (!rule || typeof rule !== 'object') return [];

  const baseAmount = Number(rule.amount) || 0;
  const isAnnual = rule.frequency === 'annual';
  const multiplierPerYear = isAnnual ? 1 : 12;

  const projections = [];
  const currentYear = new Date().getFullYear();

  for (let y = 1; y <= horizonYears; y++) {
    const compoundingFactor = Math.pow(1 + annualInflationRate, y);
    const escalatedAmount = baseAmount * compoundingFactor;
    const annualTotalCost = escalatedAmount * multiplierPerYear;

    projections.push({
      year: currentYear + y,
      yearOffset: y,
      estimatedAmount: Math.round(escalatedAmount * 100) / 100,
      cumulativeInflationPct: Math.round((compoundingFactor - 1) * 1000) / 10,
      annualTotalCost: Math.round(annualTotalCost * 100) / 100,
    });
  }

  return projections;
}
