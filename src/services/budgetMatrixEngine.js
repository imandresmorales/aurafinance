/**
 * budgetMatrixEngine.js
 * Multi-period & Interannual Budget Comparison Matrix Engine.
 * Generates structured 12-month category matrices, YoY comparisons, and seasonality metrics.
 * Pure Zero-Knowledge client-side analytical calculations.
 */

import { normalizeMoney } from '../utils';

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Builds a 12-month budget execution matrix for a given year.
 * @param {Array} budgets - List of envelope / budget objects
 * @param {Array} transactions - List of ledger transactions
 * @param {number|string} [targetYear] - The calendar year (e.g. 2026)
 * @returns {Object} Structured matrix data with row breakdown and column totals
 */
export function buildBudgetMatrix(budgets = [], transactions = [], targetYear = null) {
  const year = targetYear ? String(targetYear) : new Date().getFullYear().toString();

  // Filter transactions for the given year, excluding deleted ones and non-expenses
  const yearExpenses = (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    if ((tx.type || '').toUpperCase() !== 'EXPENSE') return false;
    if (!tx.date) return false;
    return String(tx.date).startsWith(`${year}-`);
  });

  // Group active budgets
  const activeBudgets = (budgets || []).filter((b) => !b.deleted && !b.isDeleted && b.isActive !== false);

  // Map category spent per month [0..11]
  // { [categoryLower]: [m0, m1, ..., m11] }
  const categoryMonthlySpent = {};

  yearExpenses.forEach((tx) => {
    const cat = (tx.category || tx.categoryName || 'Sin Categoría').trim();
    const catKey = cat.toLowerCase();
    const monthIndex = parseInt(String(tx.date).slice(5, 7), 10) - 1;

    if (monthIndex >= 0 && monthIndex < 12) {
      if (!categoryMonthlySpent[catKey]) {
        categoryMonthlySpent[catKey] = Array(12).fill(0);
      }
      categoryMonthlySpent[catKey][monthIndex] += Number(tx.amount) || 0;
    }
  });

  // Build rows for each envelope
  const rows = activeBudgets.map((b) => {
    const name = b.name || b.category || 'General';
    const catKey = (b.category || b.name || '').trim().toLowerCase();
    const monthlyLimit = normalizeMoney(b.allocated || b.limit || b.amount || 0);
    const spentArray = categoryMonthlySpent[catKey] || Array(12).fill(0);

    const months = spentArray.map((spent, idx) => {
      const normSpent = normalizeMoney(spent);
      const variance = normalizeMoney(monthlyLimit - normSpent);
      const percent = monthlyLimit > 0 ? normalizeMoney((normSpent / monthlyLimit) * 100) : (normSpent > 0 ? 100 : 0);
      const isOver = normSpent > monthlyLimit;

      return {
        monthIndex: idx,
        monthName: MONTH_NAMES_SHORT[idx],
        budgeted: monthlyLimit,
        actual: normSpent,
        variance,
        percent,
        isOver,
      };
    });

    const totalBudgetedYear = normalizeMoney(monthlyLimit * 12);
    const totalActualYear = normalizeMoney(months.reduce((sum, m) => sum + m.actual, 0));
    const annualVariance = normalizeMoney(totalBudgetedYear - totalActualYear);
    const annualExecutionPercent = totalBudgetedYear > 0 
      ? normalizeMoney((totalActualYear / totalBudgetedYear) * 100) 
      : 0;

    // Calculate monthly average and peak month
    const nonZeroMonths = months.filter((m) => m.actual > 0);
    const averageSpent = nonZeroMonths.length > 0 
      ? normalizeMoney(totalActualYear / nonZeroMonths.length) 
      : 0;
    
    let peakMonth = months[0];
    months.forEach((m) => {
      if (m.actual > (peakMonth?.actual || 0)) {
        peakMonth = m;
      }
    });

    return {
      id: b.id,
      name,
      category: b.category || name,
      icon: b.icon || '📁',
      color: b.color || '#10b981',
      monthlyLimit,
      months,
      totalBudgetedYear,
      totalActualYear,
      annualVariance,
      annualExecutionPercent,
      averageSpent,
      peakMonth: peakMonth.actual > 0 ? peakMonth : null,
    };
  });

  // Calculate monthly column totals (Totals across all categories for month 0..11)
  const monthlyTotals = Array(12).fill(null).map((_, idx) => {
    let budgeted = 0;
    let actual = 0;

    rows.forEach((r) => {
      budgeted += r.months[idx].budgeted;
      actual += r.months[idx].actual;
    });

    budgeted = normalizeMoney(budgeted);
    actual = normalizeMoney(actual);
    const variance = normalizeMoney(budgeted - actual);
    const percent = budgeted > 0 ? normalizeMoney((actual / budgeted) * 100) : 0;

    return {
      monthIndex: idx,
      monthName: MONTH_NAMES_SHORT[idx],
      budgeted,
      actual,
      variance,
      percent,
      isOver: actual > budgeted,
    };
  });

  // Consolidated grand totals
  const grandTotalBudgeted = normalizeMoney(monthlyTotals.reduce((s, m) => s + m.budgeted, 0));
  const grandTotalActual = normalizeMoney(monthlyTotals.reduce((s, m) => s + m.actual, 0));
  const grandTotalVariance = normalizeMoney(grandTotalBudgeted - grandTotalActual);
  const grandExecutionPercent = grandTotalBudgeted > 0 
    ? normalizeMoney((grandTotalActual / grandTotalBudgeted) * 100) 
    : 0;

  return {
    year,
    rows,
    monthlyTotals,
    summary: {
      grandTotalBudgeted,
      grandTotalActual,
      grandTotalVariance,
      grandExecutionPercent,
      activeEnvelopesCount: rows.length,
      overbudgetMonthsCount: monthlyTotals.filter((m) => m.isOver).length,
    },
  };
}

/**
 * Compares budget execution between two calendar years (Year-over-Year).
 * @param {Array} budgets - List of envelope objects
 * @param {Array} transactions - List of transactions
 * @param {number|string} yearA - Base year
 * @param {number|string} yearB - Comparison year
 * @returns {Object} YoY comparative analysis
 */
export function compareInterannualBudgets(budgets = [], transactions = [], yearA, yearB) {
  const matrixA = buildBudgetMatrix(budgets, transactions, yearA);
  const matrixB = buildBudgetMatrix(budgets, transactions, yearB);

  const spentDiff = normalizeMoney(matrixB.summary.grandTotalActual - matrixA.summary.grandTotalActual);
  const percentChange = matrixA.summary.grandTotalActual > 0
    ? normalizeMoney(((matrixB.summary.grandTotalActual - matrixA.summary.grandTotalActual) / matrixA.summary.grandTotalActual) * 100)
    : (matrixB.summary.grandTotalActual > 0 ? 100 : 0);

  // Category by category comparison
  const categoryComparisons = matrixA.rows.map((rowA) => {
    const rowB = matrixB.rows.find((r) => r.name.toLowerCase() === rowA.name.toLowerCase()) || {
      totalActualYear: 0,
      totalBudgetedYear: 0,
    };

    const diff = normalizeMoney(rowB.totalActualYear - rowA.totalActualYear);
    const catPercentChange = rowA.totalActualYear > 0
      ? normalizeMoney(((rowB.totalActualYear - rowA.totalActualYear) / rowA.totalActualYear) * 100)
      : (rowB.totalActualYear > 0 ? 100 : 0);

    return {
      name: rowA.name,
      icon: rowA.icon,
      color: rowA.color,
      actualYearA: rowA.totalActualYear,
      actualYearB: rowB.totalActualYear,
      diff,
      percentChange: catPercentChange,
      isIncrease: diff > 0,
    };
  });

  return {
    yearA: String(yearA),
    yearB: String(yearB),
    totalActualYearA: matrixA.summary.grandTotalActual,
    totalActualYearB: matrixB.summary.grandTotalActual,
    spentDiff,
    percentChange,
    isIncrease: spentDiff > 0,
    categoryComparisons,
  };
}

/**
 * Generates CSV string for export of the 12-month matrix.
 * @param {Object} matrixData - Result from buildBudgetMatrix
 * @returns {string} CSV formatted content
 */
export function generateMatrixCSV(matrixData) {
  if (!matrixData || !matrixData.rows) return '';

  const headers = ['Sobre / Categoria', ...MONTH_NAMES_SHORT.map((m) => `${m} ($)`), 'Total Presupuestado ($)', 'Total Ejecutado ($)', 'Desviacion Anual ($)', '% Ejecutado'];
  
  const rows = matrixData.rows.map((r) => {
    const monthCols = r.months.map((m) => m.actual.toFixed(2));
    return [
      `"${r.name.replace(/"/g, '""')}"`,
      ...monthCols,
      r.totalBudgetedYear.toFixed(2),
      r.totalActualYear.toFixed(2),
      r.annualVariance.toFixed(2),
      `${r.annualExecutionPercent.toFixed(1)}%`,
    ].join(',');
  });

  // Summary row
  const summaryCols = matrixData.monthlyTotals.map((m) => m.actual.toFixed(2));
  const summaryRow = [
    `"TOTAL EJECUTADO (${matrixData.year})"`,
    ...summaryCols,
    matrixData.summary.grandTotalBudgeted.toFixed(2),
    matrixData.summary.grandTotalActual.toFixed(2),
    matrixData.summary.grandTotalVariance.toFixed(2),
    `${matrixData.summary.grandExecutionPercent.toFixed(1)}%`,
  ].join(',');

  return [headers.join(','), ...rows, summaryRow].join('\n');
}
