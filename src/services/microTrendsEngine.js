/**
 * microTrendsEngine.js
 * Statistical Micro-Trends Analytics Engine.
 * Analyzes rolling historical averages vs current month to detect subtle spending shifts.
 */

import { normalizeMoney } from '../utils';

/**
 * Calculates statistical micro-trends comparing current period against rolling historical baseline.
 * @param {Array} transactions - Ledger transactions
 * @param {string} [period] - Target period YYYY-MM
 * @returns {Object} Statistical micro-trends and KPIs
 */
export function calculateMicroTrends(transactions = [], period = null) {
  const currentMonth = period || new Date().toISOString().slice(0, 7);

  const activeExpenses = (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    return (tx.type || '').toUpperCase() === 'EXPENSE' && tx.date;
  });

  // Current month expenses
  const currentMonthExpenses = activeExpenses.filter((tx) =>
    String(tx.date).startsWith(currentMonth)
  );

  // Past 3 months expenses (baseline)
  const [cYear, cMonth] = currentMonth.split('-').map(Number);
  const baselineMonths = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(cYear, cMonth - 1 - i, 1);
    baselineMonths.push(d.toISOString().slice(0, 7));
  }

  const baselineExpenses = activeExpenses.filter((tx) =>
    baselineMonths.some((bm) => String(tx.date).startsWith(bm))
  );

  // 1. Total & Daily Average Spending
  const currentTotal = normalizeMoney(
    currentMonthExpenses.reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
  );
  const baselineTotal = normalizeMoney(
    baselineExpenses.reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
  );
  const baselineMonthlyAvg = baselineMonths.length > 0
    ? normalizeMoney(baselineTotal / baselineMonths.length)
    : currentTotal;

  // Days in current month elapsed or total
  const today = new Date();
  const isCurrentMonthNow = today.toISOString().slice(0, 7) === currentMonth;
  const daysInPeriod = isCurrentMonthNow ? Math.max(1, today.getDate()) : 30;

  const currentDailyAvg = normalizeMoney(currentTotal / daysInPeriod);
  const baselineDailyAvg = normalizeMoney(baselineMonthlyAvg / 30);

  const dailyDiffPercent = baselineDailyAvg > 0
    ? normalizeMoney(((currentDailyAvg - baselineDailyAvg) / baselineDailyAvg) * 100)
    : 0;

  // 2. Transaction Frequency (tx per day)
  const currentTxFreq = normalizeMoney(currentMonthExpenses.length / daysInPeriod);
  const baselineTxFreq = normalizeMoney(baselineExpenses.length / (baselineMonths.length * 30 || 1));
  const freqDiffPercent = baselineTxFreq > 0
    ? normalizeMoney(((currentTxFreq - baselineTxFreq) / baselineTxFreq) * 100)
    : 0;

  // 3. Average Ticket Size (amount per tx)
  const currentTicket = currentMonthExpenses.length > 0
    ? normalizeMoney(currentTotal / currentMonthExpenses.length)
    : 0;
  const baselineTicket = baselineExpenses.length > 0
    ? normalizeMoney(baselineTotal / baselineExpenses.length)
    : currentTicket;
  const ticketDiffPercent = baselineTicket > 0
    ? normalizeMoney(((currentTicket - baselineTicket) / baselineTicket) * 100)
    : 0;

  return {
    period: currentMonth,
    metrics: [
      {
        id: 'daily-burn',
        title: 'Gasto Diario Promedio',
        currentValue: currentDailyAvg,
        baselineValue: baselineDailyAvg,
        diffPercent: dailyDiffPercent,
        isIncrease: dailyDiffPercent > 0,
        isFavorable: dailyDiffPercent <= 0,
        unit: 'currency',
        icon: '🔥',
      },
      {
        id: 'tx-frequency',
        title: 'Frecuencia de Compra',
        currentValue: currentTxFreq,
        baselineValue: baselineTxFreq,
        diffPercent: freqDiffPercent,
        isIncrease: freqDiffPercent > 0,
        isFavorable: freqDiffPercent <= 0,
        unit: 'freq',
        icon: '⚡',
      },
      {
        id: 'avg-ticket',
        title: 'Ticket Medio por Compra',
        currentValue: currentTicket,
        baselineValue: baselineTicket,
        diffPercent: ticketDiffPercent,
        isIncrease: ticketDiffPercent > 0,
        isFavorable: ticketDiffPercent <= 0,
        unit: 'currency',
        icon: '🛒',
      },
    ],
  };
}
