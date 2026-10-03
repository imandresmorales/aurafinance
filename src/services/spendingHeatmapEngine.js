/**
 * spendingHeatmapEngine.js
 * Behavioral Spending Heatmap Analytics Engine.
 * Cross-references Day of Week (0..6) and Time Periods / Hours to surface consumption habits and peak spikes.
 */

import { normalizeMoney } from '../utils';

export const DAYS_OF_WEEK = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const TIME_SLOTS = [
  { id: 'morning', label: 'Mañana (06:00 - 12:00)', startHour: 6, endHour: 12 },
  { id: 'afternoon', label: 'Tarde (12:00 - 18:00)', startHour: 12, endHour: 18 },
  { id: 'evening', label: 'Noche (18:00 - 24:00)', startHour: 18, endHour: 24 },
  { id: 'night', label: 'Madrugada (00:00 - 06:00)', startHour: 0, endHour: 6 },
];

/**
 * Builds a Day-of-Week x Time Slot heatmap matrix of expense transactions.
 * @param {Array} transactions - Ledger transactions
 * @param {string} [period] - Optional YYYY-MM filter
 * @returns {Object} Matrix cells with intensity values and peak behavioral insights
 */
export function buildSpendingHeatmap(transactions = [], period = null) {
  // Filter active expenses
  const activeExpenses = (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    if ((tx.type || '').toUpperCase() !== 'EXPENSE') return false;
    if (period && tx.date) {
      return String(tx.date).startsWith(period);
    }
    return true;
  });

  // Initialize 7x4 matrix
  // matrix[dayIdx][slotIdx] = { count, totalAmount, transactions }
  const matrix = Array(7).fill(null).map(() =>
    Array(4).fill(null).map(() => ({
      count: 0,
      totalAmount: 0,
      txList: [],
    }))
  );

  let maxCellAmount = 0;
  let grandTotalSpent = 0;

  activeExpenses.forEach((tx) => {
    const amt = Math.abs(Number(tx.amount)) || 0;
    let dayIdx = 0;

    if (tx.date) {
      const dateStr = String(tx.date).slice(0, 10);
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const localDate = new Date(y, m - 1, d, 12, 0, 0);
        const jsDay = localDate.getDay();
        dayIdx = jsDay === 0 ? 6 : jsDay - 1;
      }
    }

    // Time slot calculation
    let hour = 12; // default if not timestamped
    if (tx.createdAt) {
      const created = new Date(tx.createdAt);
      if (!isNaN(created.getHours())) hour = created.getHours();
    } else if (tx.time) {
      const parsedHour = parseInt(String(tx.time).slice(0, 2), 10);
      if (!isNaN(parsedHour)) hour = parsedHour;
    }

    let slotIdx = 1; // default afternoon
    if (hour >= 6 && hour < 12) slotIdx = 0;
    else if (hour >= 12 && hour < 18) slotIdx = 1;
    else if (hour >= 18 && hour < 24) slotIdx = 2;
    else slotIdx = 3;

    const cell = matrix[dayIdx][slotIdx];
    cell.count += 1;
    cell.totalAmount += amt;
    cell.txList.push(tx);

    grandTotalSpent += amt;
    if (cell.totalAmount > maxCellAmount) {
      maxCellAmount = cell.totalAmount;
    }
  });

  grandTotalSpent = normalizeMoney(grandTotalSpent);
  maxCellAmount = normalizeMoney(maxCellAmount);

  // Normalize cell intensities from 0 to 1
  let peakCell = null;
  const processedMatrix = matrix.map((row, dayIdx) =>
    row.map((cell, slotIdx) => {
      const normTotal = normalizeMoney(cell.totalAmount);
      const intensity = maxCellAmount > 0 ? normalizeMoney(normTotal / maxCellAmount) : 0;

      const cellObj = {
        dayIndex: dayIdx,
        dayName: DAYS_OF_WEEK[dayIdx],
        slotIndex: slotIdx,
        slotName: TIME_SLOTS[slotIdx].label,
        count: cell.count,
        totalAmount: normTotal,
        intensity,
      };

      if (!peakCell || cellObj.totalAmount > peakCell.totalAmount) {
        if (cellObj.totalAmount > 0) {
          peakCell = cellObj;
        }
      }

      return cellObj;
    })
  );

  // Behavioral Insight Generator
  let insight = 'Tus gastos están distribuidos uniformemente a lo largo de la semana.';
  if (peakCell) {
    const peakPercent = grandTotalSpent > 0
      ? ((peakCell.totalAmount / grandTotalSpent) * 100).toFixed(0)
      : '0';
    insight = `Pico habitual detectado los ${peakCell.dayName} (${peakCell.slotName.split(' ')[0]}), concentrando el ${peakPercent}% de tu consumo total.`;
  }

  return {
    matrix: processedMatrix,
    maxCellAmount,
    grandTotalSpent,
    totalExpensesCount: activeExpenses.length,
    peakCell,
    insight,
  };
}
