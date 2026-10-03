/**
 * dateRangeEngine.js
 * Unified Date Range & Preset Filtering Engine for AuraFinance.
 * Supports: 7D, 30D, CURRENT_MONTH, LAST_MONTH, QUARTER, YTD, 1Y, ALL, CUSTOM.
 */

export const DATE_PRESETS = [
  { key: '7D', label: '7 Días' },
  { key: '30D', label: '30 Días' },
  { key: 'CURRENT_MONTH', label: 'Mes Actual' },
  { key: 'LAST_MONTH', label: 'Mes Anterior' },
  { key: 'QUARTER', label: 'Trimestre' },
  { key: 'YTD', label: 'Año Corrido (YTD)' },
  { key: '1Y', label: '12 Meses' },
  { key: 'ALL', label: 'Todo' },
  { key: 'CUSTOM', label: 'Personalizado' },
];

/**
 * Calculates start and end ISO date strings (YYYY-MM-DD) for a given preset.
 * @param {string} presetKey - '7D' | '30D' | 'CURRENT_MONTH' | ...
 * @param {string} [customStart] - YYYY-MM-DD
 * @param {string} [customEnd] - YYYY-MM-DD
 * @param {Date} [referenceDate] - Base date (defaults to now)
 * @returns {Object} Bounds object with startDate, endDate, label, and filter helper
 */
export function getDateRangeBounds(presetKey = '30D', customStart = null, customEnd = null, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const nowStr = ref.toISOString().slice(0, 10);

  let startDate = '';
  let endDate = nowStr;
  let label = '30 Días';

  switch (presetKey) {
    case '7D': {
      const d = new Date(ref);
      d.setDate(d.getDate() - 6);
      startDate = d.toISOString().slice(0, 10);
      label = 'Últimos 7 Días';
      break;
    }
    case '30D': {
      const d = new Date(ref);
      d.setDate(d.getDate() - 29);
      startDate = d.toISOString().slice(0, 10);
      label = 'Últimos 30 Días';
      break;
    }
    case 'CURRENT_MONTH': {
      const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      startDate = startOfMonth.toISOString().slice(0, 10);
      endDate = endOfMonth.toISOString().slice(0, 10);
      label = 'Mes Actual';
      break;
    }
    case 'LAST_MONTH': {
      const startOfLast = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      const endOfLast = new Date(ref.getFullYear(), ref.getMonth(), 0);
      startDate = startOfLast.toISOString().slice(0, 10);
      endDate = endOfLast.toISOString().slice(0, 10);
      label = 'Mes Anterior';
      break;
    }
    case 'QUARTER': {
      const currentQuarter = Math.floor(ref.getMonth() / 3);
      const startQuarter = new Date(ref.getFullYear(), currentQuarter * 3, 1);
      const endQuarter = new Date(ref.getFullYear(), (currentQuarter + 1) * 3, 0);
      startDate = startQuarter.toISOString().slice(0, 10);
      endDate = endQuarter.toISOString().slice(0, 10);
      label = `Trimestre Q${currentQuarter + 1}`;
      break;
    }
    case 'YTD': {
      const startOfYear = new Date(ref.getFullYear(), 0, 1);
      startDate = startOfYear.toISOString().slice(0, 10);
      label = `Año ${ref.getFullYear()} (YTD)`;
      break;
    }
    case '1Y': {
      const d = new Date(ref);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().slice(0, 10);
      label = 'Últimos 12 Meses';
      break;
    }
    case 'CUSTOM': {
      startDate = customStart || nowStr;
      endDate = customEnd || nowStr;
      label = `${startDate} a ${endDate}`;
      break;
    }
    case 'ALL':
    default: {
      startDate = '1970-01-01';
      endDate = '2099-12-31';
      label = 'Histórico Completo';
      break;
    }
  }

  const isWithinRange = (dateStr) => {
    if (!dateStr) return false;
    const d = String(dateStr).slice(0, 10);
    return d >= startDate && d <= endDate;
  };

  return {
    preset: presetKey,
    startDate,
    endDate,
    label,
    isWithinRange,
  };
}

/**
 * Filters an array of transactions based on a date range bounds object.
 * @param {Array} transactions - Transactions list
 * @param {Object} bounds - Result from getDateRangeBounds
 * @returns {Array} Filtered active transactions
 */
export function filterTransactionsByDateRange(transactions = [], bounds = null) {
  if (!bounds || bounds.preset === 'ALL') {
    return transactions;
  }
  return (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    return bounds.isWithinRange(tx.date || tx.createdAt);
  });
}
