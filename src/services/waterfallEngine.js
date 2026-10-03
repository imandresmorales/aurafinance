/**
 * waterfallEngine.js
 * Financial Waterfall (Bridge / Cascade) Decomposition Engine.
 * Visualizes the stepwise transition from Initial Period Balance ➔ Incomes ➔ Expense Envelopes ➔ Final Balance.
 */

import { normalizeMoney } from '../utils';

/**
 * Calculates waterfall cascade blocks with baseline offsets and dimensions.
 * @param {number} initialBalance - Balance at start of period
 * @param {Array} transactions - Active transactions in the period
 * @param {string} [period] - YYYY-MM
 * @returns {Object} Calculated waterfall steps and global metrics
 */
export function calculateWaterfallBreakdown(initialBalance = 0, transactions = [], period = null) {
  const currentMonth = period || new Date().toISOString().slice(0, 7);

  const periodTx = (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    if (!tx.date) return false;
    return String(tx.date).startsWith(currentMonth);
  });

  const incomeTx = periodTx.filter((tx) => (tx.type || '').toUpperCase() === 'INCOME');
  const expenseTx = periodTx.filter((tx) => (tx.type || '').toUpperCase() === 'EXPENSE');

  // Group incomes by source
  const incomeGroups = {};
  incomeTx.forEach((tx) => {
    const src = (tx.category || tx.notes || 'Ingreso').trim();
    incomeGroups[src] = (incomeGroups[src] || 0) + (Number(tx.amount) || 0);
  });

  // Group expenses by category
  const expenseGroups = {};
  expenseTx.forEach((tx) => {
    const cat = (tx.category || 'Gasto General').trim();
    expenseGroups[cat] = (expenseGroups[cat] || 0) + (Number(tx.amount) || 0);
  });

  let runningBalance = normalizeMoney(initialBalance);
  const steps = [];

  // Step 0: Starting Balance Pillar
  steps.push({
    id: 'step-start',
    label: 'Saldo Inicial',
    type: 'TOTAL',
    amount: runningBalance,
    startValue: 0,
    endValue: runningBalance,
    color: '#3b82f6',
  });

  // Steps: Positive Incomes (Green blocks)
  Object.entries(incomeGroups).forEach(([source, amt], i) => {
    const normAmt = normalizeMoney(amt);
    const startVal = runningBalance;
    runningBalance = normalizeMoney(runningBalance + normAmt);

    steps.push({
      id: `step-inc-${i}`,
      label: source,
      type: 'INCOME',
      amount: normAmt,
      startValue: startVal,
      endValue: runningBalance,
      color: '#10b981',
    });
  });

  // Steps: Negative Expenses (Red blocks)
  Object.entries(expenseGroups).forEach(([cat, amt], i) => {
    const normAmt = normalizeMoney(amt);
    const startVal = runningBalance;
    runningBalance = normalizeMoney(runningBalance - normAmt);

    steps.push({
      id: `step-exp-${i}`,
      label: cat,
      type: 'EXPENSE',
      amount: -normAmt,
      startValue: startVal,
      endValue: runningBalance,
      color: '#ef4444',
    });
  });

  // Final Step: Closing Balance Pillar
  steps.push({
    id: 'step-final',
    label: 'Saldo Final',
    type: 'TOTAL',
    amount: runningBalance,
    startValue: 0,
    endValue: runningBalance,
    color: '#e2c275',
  });

  // Find scale range
  const allValues = steps.flatMap((s) => [s.startValue, s.endValue]);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(100, ...allValues) * 1.15;

  return {
    period: currentMonth,
    initialBalance: normalizeMoney(initialBalance),
    finalBalance: runningBalance,
    netChange: normalizeMoney(runningBalance - initialBalance),
    steps,
    minVal,
    maxVal,
  };
}
