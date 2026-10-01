/**
 * budgetVarianceEngine.js
 * Comprehensive analytical calculations for Budget Variance (Presupuestado vs. Real ejecutado).
 * Adheres strictly to Zero-Knowledge and pure functional architecture.
 */

/**
 * Calculates budget variances for all active envelopes in the current month or specified period.
 * @param {Array} budgets - List of envelope/budget objects
 * @param {Array} transactions - List of transaction objects
 * @param {string} [monthKey] - Optional YYYY-MM filter. Defaults to current month in YYYY-MM.
 * @returns {Object} Analytical variance breakdown and aggregate KPIs
 */
export function calculateBudgetVariances(budgets = [], transactions = [], monthKey = null) {
  const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

  // Filter transactions for the target month and active expenses
  const monthExpenses = (transactions || []).filter(t => {
    if (!t || t.isDeleted || (t.type || '').toLowerCase() !== 'expense') return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === targetMonth;
  });

  // Calculate actual spending per category
  const actualByCategory = {};
  monthExpenses.forEach(t => {
    const cat = t.category || 'Sin Categoría';
    const amt = Math.abs(Number(t.amount)) || 0;
    actualByCategory[cat] = Math.round(((actualByCategory[cat] || 0) + amt) * 100) / 100;
  });

  const activeBudgets = (budgets || []).filter(b => !b.isDeleted && b.isActive !== false);

  const items = activeBudgets.map(b => {
    const budgeted = Number(b.limit || b.allocated || b.amount) || 0;
    const category = b.category || b.name || 'General';
    const actual = actualByCategory[category] || 0;
    const variance = Math.round((budgeted - actual) * 100) / 100; // Positive: under budget (favorable), Negative: over budget (unfavorable)
    const percentSpent = budgeted > 0 ? (actual / budgeted) * 100 : (actual > 0 ? 100 : 0);

    let status = 'favorable';
    if (actual > budgeted) {
      status = 'unfavorable';
    } else if (percentSpent >= 80) {
      status = 'warning';
    }

    return {
      id: b.id,
      name: b.name || category,
      category,
      budgeted,
      actual,
      variance,
      percentSpent: Math.round(percentSpent * 10) / 10,
      status,
      color: b.color || '#10b981',
      icon: b.icon || '📁'
    };
  });

  // Aggregate calculations with IEEE-754 precision protection
  const totalBudgeted = Math.round(items.reduce((acc, i) => acc + i.budgeted, 0) * 100) / 100;
  const totalActual = Math.round(items.reduce((acc, i) => acc + i.actual, 0) * 100) / 100;
  const netVariance = Math.round((totalBudgeted - totalActual) * 100) / 100;
  
  const totalOverspend = Math.round(items
    .filter(i => i.variance < 0)
    .reduce((acc, i) => acc + Math.abs(i.variance), 0) * 100) / 100;
    
  const totalSavings = Math.round(items
    .filter(i => i.variance > 0)
    .reduce((acc, i) => acc + i.variance, 0) * 100) / 100;

  // Adherence score (100% minus penalty for overspending)
  let adherenceScore = 100;
  if (totalBudgeted > 0) {
    const overspendPenalty = (totalOverspend / totalBudgeted) * 100;
    adherenceScore = Math.max(0, Math.round(100 - overspendPenalty));
  } else if (totalActual > 0) {
    adherenceScore = 0;
  }

  const favorableCount = items.filter(i => i.status === 'favorable').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const unfavorableCount = items.filter(i => i.status === 'unfavorable').length;

  return {
    items,
    month: targetMonth,
    totalBudgeted,
    totalActual,
    netVariance,
    totalOverspend,
    totalSavings,
    adherenceScore,
    favorableCount,
    warningCount,
    unfavorableCount
  };
}

/**
 * Exports budget variance data to a standardized CSV string.
 * @param {Object} varianceData - Return object from calculateBudgetVariances
 * @returns {string} CSV formatted content
 */
export function generateVarianceCSV(varianceData) {
  if (!varianceData || !varianceData.items) return '';

  const headers = ['Sobre / Categoria', 'Presupuestado ($)', 'Real Ejecutado ($)', 'Desviacion ($)', '% Ejecutado', 'Estado'];
  const rows = varianceData.items.map(item => [
    `"${item.name.replace(/"/g, '""')}"`,
    item.budgeted.toFixed(2),
    item.actual.toFixed(2),
    item.variance.toFixed(2),
    `${item.percentSpent.toFixed(1)}%`,
    item.status === 'favorable' ? 'Favorable' : item.status === 'warning' ? 'Alerta' : 'Excedido'
  ]);

  // Append summary row
  rows.push([
    '"TOTAL / RESUMEN"',
    varianceData.totalBudgeted.toFixed(2),
    varianceData.totalActual.toFixed(2),
    varianceData.netVariance.toFixed(2),
    varianceData.totalBudgeted > 0 ? `${((varianceData.totalActual / varianceData.totalBudgeted) * 100).toFixed(1)}%` : '0%',
    varianceData.netVariance >= 0 ? 'Favorable Global' : 'Deficit Global'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
