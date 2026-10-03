/**
 * correlationEngine.js
 * Extraordinary Income & Post-Windfall Spending Correlation Engine.
 * Analyzes consumer elasticity and capital retention following major income events.
 */

import { normalizeMoney } from '../utils';

/**
 * Analyzes correlation between extraordinary income events and trailing expenditure surges.
 * @param {Array} transactions - Ledger transactions
 * @returns {Object} Windfall events, retention rate, elasticity index, and behavioral diagnosis
 */
export function analyzeWindfallCorrelations(transactions = []) {
  const activeTx = (transactions || []).filter((tx) => !tx.deleted && !tx.isDeleted && tx.date);

  const incomeTx = activeTx.filter((tx) => (tx.type || '').toUpperCase() === 'INCOME');
  const expenseTx = activeTx.filter((tx) => (tx.type || '').toUpperCase() === 'EXPENSE');

  if (incomeTx.length === 0) {
    return {
      windfallEvents: [],
      overallRetentionRate: 100,
      lifestyleInflationIndex: 0,
      diagnosis: 'Sin historial suficiente de ingresos extraordinarios para calcular correlación.',
    };
  }

  // Calculate median income amount to establish windfall baseline (>1.5x median)
  const incomeAmounts = incomeTx.map((tx) => Number(tx.amount) || 0).sort((a, b) => a - b);
  const medianIncome = incomeAmounts[Math.floor(incomeAmounts.length / 2)] || 1000;
  const windfallThreshold = medianIncome * 1.4;

  const windfallEvents = incomeTx
    .filter((tx) => Number(tx.amount) >= windfallThreshold)
    .map((event) => {
      const eventDate = new Date(event.date);
      const eventAmt = normalizeMoney(Number(event.amount) || 0);

      // Trailing 14 days post-windfall window
      const windowEndDate = new Date(eventDate);
      windowEndDate.setDate(eventDate.getDate() + 14);

      const trailingExpenses = expenseTx.filter((tx) => {
        const d = new Date(tx.date);
        return d >= eventDate && d <= windowEndDate;
      });

      const totalTrailingSpent = normalizeMoney(
        trailingExpenses.reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
      );

      const retainedAmount = normalizeMoney(Math.max(0, eventAmt - totalTrailingSpent));
      const retentionRate = eventAmt > 0
        ? normalizeMoney((retainedAmount / eventAmt) * 100)
        : 0;

      return {
        id: event.id,
        date: event.date,
        source: event.category || event.notes || 'Ingreso Extraordinario',
        amount: eventAmt,
        trailingSpent14d: totalTrailingSpent,
        retainedAmount,
        retentionRate,
      };
    });

  if (windfallEvents.length === 0) {
    return {
      windfallEvents: [],
      overallRetentionRate: 100,
      lifestyleInflationIndex: 0,
      diagnosis: 'Tus ingresos han sido estables y predecibles, sin picos extraordinarios atípicos.',
    };
  }

  // Aggregate stats across all windfall events
  const totalWindfalls = windfallEvents.reduce((s, e) => s + e.amount, 0);
  const totalRetained = windfallEvents.reduce((s, e) => s + e.retainedAmount, 0);
  const overallRetentionRate = totalWindfalls > 0
    ? normalizeMoney((totalRetained / totalWindfalls) * 100)
    : 0;

  const lifestyleInflationIndex = normalizeMoney(100 - overallRetentionRate);

  let diagnosis = '';
  if (overallRetentionRate >= 70) {
    diagnosis = `Excelente disciplina financiera: Retienes el ${overallRetentionRate.toFixed(0)}% de tus ingresos extraordinarios sin incurrir en inflación de estilo de vida.`;
  } else if (overallRetentionRate >= 40) {
    diagnosis = `Moderado: Consumes el ${lifestyleInflationIndex.toFixed(0)}% de tus ingresos extraordinarios en los 14 días posteriores. Considera transferir automáticamente el 50% a inversión.`;
  } else {
    diagnosis = `Alerta de aceleración de gasto: Consumes más del ${lifestyleInflationIndex.toFixed(0)}% de tus ingresos extraordinarios casi de inmediato.`;
  }

  return {
    windfallEvents,
    totalWindfalls: normalizeMoney(totalWindfalls),
    totalRetained: normalizeMoney(totalRetained),
    overallRetentionRate,
    lifestyleInflationIndex,
    diagnosis,
  };
}
