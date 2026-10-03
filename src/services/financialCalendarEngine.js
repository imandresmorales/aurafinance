/**
 * financialCalendarEngine.js
 * Interactive Financial Calendar Engine for AuraFinance.
 * Unifies historical transactions with projected recurring commitments.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr } from './recurringEngine';

/**
 * Generates the calendar grid (array of day objects) for a given year and month (0-indexed).
 * Always includes preceding days from previous month and trailing days from next month to complete weeks.
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} month - 0-indexed month (0 = Jan, 11 = Dec)
 * @returns {Array<Object>} Array of day cells
 */
export function generateCalendarGrid(year, month) {
  const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
  const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0);

  // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
  // Let's use Monday as start of week (0 = Mon, 6 = Sun)
  let startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  const totalDaysInMonth = lastDayOfMonth.getDate();
  const cells = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0, 12, 0, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const dateObj = new Date(year, month - 1, dayNum, 12, 0, 0);
    cells.push({
      dateStr: formatToDateStr(dateObj),
      dayNumber: dayNum,
      isCurrentMonth: false,
      isPreviousMonth: true,
      isNextMonth: false,
      dayOfWeek: (dateObj.getDay() + 6) % 7,
      events: [],
      actualIncome: 0,
      actualExpense: 0,
      projectedIncome: 0,
      projectedExpense: 0,
      netFlow: 0,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(year, month, d, 12, 0, 0);
    cells.push({
      dateStr: formatToDateStr(dateObj),
      dayNumber: d,
      isCurrentMonth: true,
      isPreviousMonth: false,
      isNextMonth: false,
      dayOfWeek: (dateObj.getDay() + 6) % 7,
      events: [],
      actualIncome: 0,
      actualExpense: 0,
      projectedIncome: 0,
      projectedExpense: 0,
      netFlow: 0,
    });
  }

  // Next month leading days to complete grid (up to multiple of 7, usually 35 or 42 cells)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const dateObj = new Date(year, month + 1, n, 12, 0, 0);
    cells.push({
      dateStr: formatToDateStr(dateObj),
      dayNumber: n,
      isCurrentMonth: false,
      isPreviousMonth: false,
      isNextMonth: true,
      dayOfWeek: (dateObj.getDay() + 6) % 7,
      events: [],
      actualIncome: 0,
      actualExpense: 0,
      projectedIncome: 0,
      projectedExpense: 0,
      netFlow: 0,
    });
  }

  return cells;
}

/**
 * Maps actual transactions and future projected occurrences onto the calendar grid.
 * @param {Array<Object>} calendarGrid
 * @param {Array<Object>} [transactions=[]]
 * @param {Array<Object>} [projectedOccurrences=[]]
 * @returns {Array<Object>} Enriched calendar cells
 */
export function mapEventsToCalendarGrid(calendarGrid = [], transactions = [], projectedOccurrences = []) {
  if (!Array.isArray(calendarGrid) || calendarGrid.length === 0) return [];

  // Index cells by dateStr
  const cellMap = {};
  const enrichedGrid = calendarGrid.map((c) => {
    const cell = {
      ...c,
      events: [],
      actualIncome: 0,
      actualExpense: 0,
      projectedIncome: 0,
      projectedExpense: 0,
      netFlow: 0,
      pressureType: 'neutral', // 'payday' | 'heavy_expense' | 'moderate_expense' | 'neutral'
    };
    cellMap[cell.dateStr] = cell;
    return cell;
  });

  // Map actual transactions
  transactions.forEach((tx) => {
    if (!tx || !tx.date) return;
    const dateStr = tx.date.split('T')[0];
    const targetCell = cellMap[dateStr];
    if (targetCell) {
      const amt = Number(tx.amount) || 0;
      const isIncome = tx.type === 'income';

      targetCell.events.push({
        id: tx.id || `tx-${Math.random()}`,
        name: tx.description || tx.name || (isIncome ? 'Ingreso' : 'Gasto'),
        amount: amt,
        type: isIncome ? 'income' : 'expense',
        isProjected: false,
        category: tx.category || 'General',
        walletId: tx.walletId,
      });

      if (isIncome) {
        targetCell.actualIncome += amt;
      } else {
        targetCell.actualExpense += amt;
      }
    }
  });

  // Map projected occurrences
  projectedOccurrences.forEach((proj) => {
    if (!proj || !proj.date) return;
    const dateStr = proj.date.split('T')[0];
    const targetCell = cellMap[dateStr];
    if (targetCell) {
      const amt = Number(proj.amount) || 0;
      const isIncome = proj.type === 'income';

      targetCell.events.push({
        id: proj.id || `proj-${Math.random()}`,
        name: proj.name || (isIncome ? 'Ingreso Programado' : 'Compromiso'),
        amount: amt,
        type: isIncome ? 'income' : 'expense',
        isProjected: true,
        isSubscription: Boolean(proj.isSubscription),
        category: proj.category || 'Recurrente',
        walletId: proj.walletId,
      });

      if (isIncome) {
        targetCell.projectedIncome += amt;
      } else {
        targetCell.projectedExpense += amt;
      }
    }
  });

  // Calculate net flows and pressure levels
  enrichedGrid.forEach((cell) => {
    const totalInc = cell.actualIncome + cell.projectedIncome;
    const totalExp = cell.actualExpense + cell.projectedExpense;
    cell.netFlow = totalInc - totalExp;

    if (totalInc > 0 && totalInc >= totalExp * 1.5) {
      cell.pressureType = 'payday';
    } else if (totalExp >= 500) {
      cell.pressureType = 'heavy_expense';
    } else if (totalExp > 0) {
      cell.pressureType = 'moderate_expense';
    } else {
      cell.pressureType = 'neutral';
    }
  });

  return enrichedGrid;
}

/**
 * Calculates aggregate summary metrics for the active month's calendar cells.
 * @param {Array<Object>} calendarCells
 * @param {string} [baseCurrency='USD']
 * @returns {Object}
 */
export function calculateMonthCalendarSummary(calendarCells = [], baseCurrency = 'USD') {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalProjectedIncome = 0;
  let totalProjectedExpense = 0;
  let peakExpenseDay = null;
  let maxDayExpense = 0;

  calendarCells.forEach((cell) => {
    if (!cell.isCurrentMonth) return;

    totalIncome += cell.actualIncome;
    totalExpense += cell.actualExpense;
    totalProjectedIncome += cell.projectedIncome;
    totalProjectedExpense += cell.projectedExpense;

    const dayTotalExp = cell.actualExpense + cell.projectedExpense;
    if (dayTotalExp > maxDayExpense) {
      maxDayExpense = dayTotalExp;
      peakExpenseDay = {
        date: cell.dateStr,
        dayNumber: cell.dayNumber,
        amount: Math.round(dayTotalExp * 100) / 100,
      };
    }
  });

  const grandTotalIncome = totalIncome + totalProjectedIncome;
  const grandTotalExpense = totalExpense + totalProjectedExpense;
  const projectedMonthEndBalance = grandTotalIncome - grandTotalExpense;

  return {
    actualIncome: Math.round(totalIncome * 100) / 100,
    actualExpense: Math.round(totalExpense * 100) / 100,
    projectedIncome: Math.round(totalProjectedIncome * 100) / 100,
    projectedExpense: Math.round(totalProjectedExpense * 100) / 100,
    grandTotalIncome: Math.round(grandTotalIncome * 100) / 100,
    grandTotalExpense: Math.round(grandTotalExpense * 100) / 100,
    projectedMonthEndBalance: Math.round(projectedMonthEndBalance * 100) / 100,
    peakExpenseDay,
    currency: baseCurrency,
  };
}
