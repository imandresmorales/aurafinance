/**
 * burnRateForecastEngine.js
 * Daily spending pace (Burn Rate) and Month-End Financial Forecast Engine.
 * Adheres strictly to Zero-Knowledge pure functional architecture.
 */

/**
 * Calculates current burn rate, daily allowances, and end-of-month projections.
 * @param {Array} transactions - Active transactions list
 * @param {Array} budgets - Active budget/envelope objects
 * @param {Date|string} [referenceDate] - Optional date anchor (defaults to current date)
 * @returns {Object} Comprehensive burn rate analysis and month-end forecast
 */
export function calculateBurnRateForecast(transactions = [], budgets = [], referenceDate = new Date()) {
  const ref = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate;
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-indexed
  const currentDay = Math.max(1, ref.getDate());

  // Calculate days in the target month (e.g. 30 in Sep, 31 in Oct)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = Math.max(0, daysInMonth - currentDay);
  const monthProgressPercent = Math.round((currentDay / daysInMonth) * 100);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Filter expenses and incomes for target month
  const monthTx = (transactions || []).filter(t => {
    if (!t || t.deleted || t.isDeleted) return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === monthKey;
  });

  let totalSpentSoFar = 0;
  let totalIncome = 0;

  monthTx.forEach(t => {
    const amt = Math.abs(Number(t.amount)) || 0;
    if (t.type === 'expense') {
      totalSpentSoFar += amt;
    } else if (t.type === 'income') {
      totalIncome += amt;
    }
  });

  // Calculate total budgeted amount across envelopes
  const activeBudgets = (budgets || []).filter(b => !b.isDeleted && b.isActive !== false);
  const totalBudget = activeBudgets.reduce((acc, b) => {
    return acc + (Number(b.allocated || b.limit || b.amount) || 0);
  }, 0);

  // Daily Burn Rate so far
  const currentDailyBurnRate = currentDay > 0 ? Math.round((totalSpentSoFar / currentDay) * 100) / 100 : 0;

  // Projection to end of month based on daily velocity
  const projectedMonthEndExpense = currentDay > 0
    ? Math.round((totalSpentSoFar / currentDay) * daysInMonth * 100) / 100
    : 0;

  // Remaining budget and safe daily spending allowance
  const budgetRemaining = Math.max(0, totalBudget - totalSpentSoFar);
  const recommendedDailyAllowance = remainingDays > 0
    ? Math.round((budgetRemaining / remainingDays) * 100) / 100
    : 0;

  // Comparison against budget
  const projectedVariance = totalBudget > 0 ? totalBudget - projectedMonthEndExpense : 0;
  const budgetConsumedPercent = totalBudget > 0 ? Math.round((totalSpentSoFar / totalBudget) * 100) : 0;
  const projectedBudgetPercent = totalBudget > 0 ? Math.round((projectedMonthEndExpense / totalBudget) * 100) : 0;

  let status = 'on_track'; // 'on_track' | 'caution' | 'overspending'
  let message = 'Tu ritmo de gasto actual es saludable y terminarás el mes dentro del presupuesto planificado.';

  if (totalBudget > 0) {
    if (projectedMonthEndExpense > totalBudget * 1.1) {
      status = 'overspending';
      message = `Alerta: A este ritmo (${currentDailyBurnRate.toFixed(2)}$/día), sobrepasarás el presupuesto por ${Math.abs(projectedVariance).toFixed(2)}$. Ajusta tu gasto a un máximo de ${recommendedDailyAllowance.toFixed(2)}$/día.`;
    } else if (projectedMonthEndExpense > totalBudget) {
      status = 'caution';
      message = `Precaución: Estás cerca del límite presupuestario (${projectedBudgetPercent}% proyectado). Mantén tu consumo diario por debajo de ${recommendedDailyAllowance.toFixed(2)}$/día.`;
    }
  }

  return {
    monthKey,
    currentDay,
    daysInMonth,
    remainingDays,
    monthProgressPercent,
    totalSpentSoFar,
    totalIncome,
    totalBudget,
    currentDailyBurnRate,
    projectedMonthEndExpense,
    budgetRemaining,
    recommendedDailyAllowance,
    projectedVariance,
    budgetConsumedPercent,
    projectedBudgetPercent,
    status,
    message,
  };
}
