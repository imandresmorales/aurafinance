/**
 * microExpensesEngine.js
 * Comprehensive analysis of cumulative micro-expenses ("Efecto Hormiga / Lattee Effect").
 * Evaluates small daily expenses and calculates the 5, 10, and 20-year compound opportunity cost.
 * Adheres strictly to Zero-Knowledge and pure functional architecture.
 */

export const DEFAULT_MICRO_THRESHOLD = 15.0; // Expenses <= $15.00 are considered micro-expenses

/**
 * Calculates compound future value of a monthly recurring contribution.
 * Formula: FV = PMT * [ ((1 + r/n)^(n*t) - 1) / (r/n) ]
 * @param {number} monthlyContribution - Monthly savings amount (PMT)
 * @param {number} years - Time horizon in years (t)
 * @param {number} annualRate - Expected annual return rate (e.g. 0.08 for 8% S&P 500 average)
 * @returns {number} Future Value (FV)
 */
export function calculateCompoundOpportunityCost(monthlyContribution, years, annualRate = 0.08) {
  if (!monthlyContribution || monthlyContribution <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 12;
  const totalMonths = years * 12;
  const fv = monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

  return Math.round(fv * 100) / 100;
}

/**
 * Analyzes micro-expenses within a given month or dataset.
 * @param {Array} transactions - Active transactions list
 * @param {number} [threshold=15] - Maximum amount to qualify as a micro-expense
 * @param {string} [monthKey] - Optional YYYY-MM filter. Defaults to current month.
 * @param {number} [expectedAnnualReturn=0.08] - Expected annual investment return rate
 * @returns {Object} Analytical micro-expense breakdown and projections
 */
export function analyzeMicroExpenses(
  transactions = [],
  threshold = DEFAULT_MICRO_THRESHOLD,
  monthKey = null,
  expectedAnnualReturn = 0.08
) {
  const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

  const monthExpenses = (transactions || []).filter(t => {
    if (!t || t.deleted || t.isDeleted || t.type !== 'expense') return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === targetMonth;
  });

  let totalExpenses = 0;
  let totalMicroSpent = 0;
  const microItems = [];
  const categoryMap = {};
  const merchantMap = {};

  monthExpenses.forEach(t => {
    const amt = Math.abs(Number(t.amount)) || 0;
    totalExpenses += amt;

    if (amt <= threshold && amt > 0) {
      totalMicroSpent += amt;
      microItems.push({ ...t, amount: amt });

      const cat = t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;

      const merchant = (t.description || t.concept || 'Comercio Variado').trim();
      merchantMap[merchant] = (merchantMap[merchant] || 0) + amt;
    }
  });

  const microTxCount = microItems.length;
  const totalTxCount = monthExpenses.length;
  const microTxPercent = totalTxCount > 0 ? Math.round((microTxCount / totalTxCount) * 100) : 0;
  const percentOfTotalExpenses = totalExpenses > 0 ? Math.round((totalMicroSpent / totalExpenses) * 1000) / 10 : 0;

  // Annualized and Compound Opportunity Cost Projections
  const annualizedMicroCost = Math.round(totalMicroSpent * 12 * 100) / 100;
  const futureValue5Years = calculateCompoundOpportunityCost(totalMicroSpent, 5, expectedAnnualReturn);
  const futureValue10Years = calculateCompoundOpportunityCost(totalMicroSpent, 10, expectedAnnualReturn);
  const futureValue20Years = calculateCompoundOpportunityCost(totalMicroSpent, 20, expectedAnnualReturn);

  // Grouped Categories
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percent: totalMicroSpent > 0 ? Math.round((amount / totalMicroSpent) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top Merchants / Concepts
  const topMerchants = Object.entries(merchantMap)
    .map(([merchant, amount]) => ({
      merchant,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  let severity = 'low'; // 'low' | 'moderate' | 'high'
  let insight = 'Tus microgastos representan un porcentaje controlado de tu presupuesto.';

  if (percentOfTotalExpenses > 20 || totalMicroSpent > 300) {
    severity = 'high';
    insight = `¡Atención! Los microgastos consumen el ${percentOfTotalExpenses}% de tus gastos totales. Reasignar este flujo a inversión generaría ${Math.round(futureValue10Years).toLocaleString()}$ en 10 años.`;
  } else if (percentOfTotalExpenses > 10 || totalMicroSpent > 150) {
    severity = 'moderate';
    insight = `Los microgastos representan el ${percentOfTotalExpenses}% de tus egresos. Monitorear las compras de impulso puede liberar fondos valiosos para tus metas.`;
  }

  return {
    month: targetMonth,
    threshold,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalMicroSpent: Math.round(totalMicroSpent * 100) / 100,
    microTxCount,
    totalTxCount,
    microTxPercent,
    percentOfTotalExpenses,
    annualizedMicroCost,
    futureValue5Years,
    futureValue10Years,
    futureValue20Years,
    categoryBreakdown,
    topMerchants,
    severity,
    insight,
  };
}
