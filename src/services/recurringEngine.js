/**
 * recurringEngine.js
 * Advanced Scheduling & Recurrence Engine for AuraFinance.
 * Adheres strictly to Zero-Knowledge local-first architecture.
 */

export const RECURRING_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMIANNUAL: 'semiannual',
  ANNUAL: 'annual',
};

/**
 * Parses YYYY-MM-DD string into a timezone-safe Date object set at local midday.
 * @param {string|Date} dateVal
 * @returns {Date}
 */
export function parseLocalDate(dateVal) {
  if (dateVal instanceof Date) {
    return new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 12, 0, 0);
  }
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  const fallback = new Date(dateVal);
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 12, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD.
 * @param {Date} d
 * @returns {string}
 */
export function formatToDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates a recurring rule structure.
 * @param {Object} rule
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateRecurringRule(rule) {
  const errors = [];
  if (!rule || typeof rule !== 'object') {
    return { isValid: false, errors: ['Regla de recurrencia inválida o nula.'] };
  }
  if (!rule.name || typeof rule.name !== 'string' || !rule.name.trim()) {
    errors.push('El nombre del concepto recurrente es requerido.');
  }
  const amount = Number(rule.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('El importe debe ser un número positivo mayor que cero.');
  }
  const validFrequencies = Object.values(RECURRING_FREQUENCIES);
  if (!rule.frequency || !validFrequencies.includes(rule.frequency)) {
    errors.push(`Frecuencia no válida. Valores permitidos: ${validFrequencies.join(', ')}.`);
  }
  if (!rule.startDate) {
    errors.push('La fecha de inicio es requerida.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates the next occurrence date after a given `fromDate` based on the rule.
 * @param {Object} rule
 * @param {string|Date} [fromDate]
 * @returns {string|null} YYYY-MM-DD or null if expired
 */
export function calculateNextOccurrence(rule, fromDate = new Date()) {
  const validation = validateRecurringRule(rule);
  if (!validation.isValid) return null;

  const start = parseLocalDate(rule.startDate);
  const from = parseLocalDate(fromDate);
  const end = rule.endDate ? parseLocalDate(rule.endDate) : null;

  if (end && from > end) return null;

  let current = new Date(start);

  // If start is in the future compared to fromDate, start is the next occurrence
  if (current >= from) {
    if (end && current > end) return null;
    return formatToDateStr(current);
  }

  const interval = Math.max(1, parseInt(rule.interval || 1, 10));
  let step = 0;

  // Advance current date until it is strictly >= fromDate
  while (current < from) {
    step++;
    switch (rule.frequency) {
      case RECURRING_FREQUENCIES.DAILY:
        current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + step * interval, 12, 0, 0);
        break;

      case RECURRING_FREQUENCIES.WEEKLY:
        current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + step * 7 * interval, 12, 0, 0);
        break;

      case RECURRING_FREQUENCIES.BIWEEKLY:
        current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + step * 14 * interval, 12, 0, 0);
        break;

      case RECURRING_FREQUENCIES.MONTHLY: {
        const targetYear = start.getFullYear();
        const targetMonth = start.getMonth() + step * interval;
        const targetDay = start.getDate();
        const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        current = new Date(targetYear, targetMonth, Math.min(targetDay, maxDay), 12, 0, 0);
        break;
      }

      case RECURRING_FREQUENCIES.QUARTERLY: {
        const targetYear = start.getFullYear();
        const targetMonth = start.getMonth() + step * 3 * interval;
        const targetDay = start.getDate();
        const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        current = new Date(targetYear, targetMonth, Math.min(targetDay, maxDay), 12, 0, 0);
        break;
      }

      case RECURRING_FREQUENCIES.SEMIANNUAL: {
        const targetYear = start.getFullYear();
        const targetMonth = start.getMonth() + step * 6 * interval;
        const targetDay = start.getDate();
        const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        current = new Date(targetYear, targetMonth, Math.min(targetDay, maxDay), 12, 0, 0);
        break;
      }

      case RECURRING_FREQUENCIES.ANNUAL: {
        const targetYear = start.getFullYear() + step * interval;
        const targetMonth = start.getMonth();
        const targetDay = start.getDate();
        const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        current = new Date(targetYear, targetMonth, Math.min(targetDay, maxDay), 12, 0, 0);
        break;
      }

      default:
        return null;
    }
  }

  if (end && current > end) return null;
  return formatToDateStr(current);
}

/**
 * Projects all occurrences of an array of recurring rules between startDate and endDate.
 * @param {Array<Object>} recurringRules
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {Array<Object>} Array of projected occurrence events sorted by date
 */
export function generateProjectedOccurrences(recurringRules = [], startDate, endDate) {
  if (!Array.isArray(recurringRules) || recurringRules.length === 0) return [];

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (start > end) return [];

  const projections = [];

  recurringRules.forEach((rule) => {
    if (!rule || rule.isActive === false) return;

    const validation = validateRecurringRule(rule);
    if (!validation.isValid) return;

    let nextDateStr = calculateNextOccurrence(rule, start);

    while (nextDateStr) {
      const nextDate = parseLocalDate(nextDateStr);
      if (nextDate > end) break;

      projections.push({
        id: `${rule.id || 'rule'}-${nextDateStr}`,
        ruleId: rule.id,
        name: rule.name,
        amount: Number(rule.amount) || 0,
        type: rule.type || 'expense',
        category: rule.category || 'General',
        walletId: rule.walletId,
        date: nextDateStr,
        frequency: rule.frequency,
        isSubscription: Boolean(rule.isSubscription),
        currency: rule.currency || 'USD',
        isAutomatic: Boolean(rule.isAutomatic),
      });

      // Advance by one step
      const advanceFrom = new Date(nextDate);
      advanceFrom.setDate(advanceFrom.getDate() + 1);
      nextDateStr = calculateNextOccurrence(rule, advanceFrom);
    }
  });

  // Sort projections chronologically
  return projections.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Detects recurring rules that are due on or before targetDate.
 * @param {Array<Object>} recurringRules
 * @param {string|Date} [targetDate]
 * @returns {Array<Object>}
 */
export function detectDueRecurringItems(recurringRules = [], targetDate = new Date()) {
  const target = parseLocalDate(targetDate);
  const targetStr = formatToDateStr(target);

  const dueItems = [];

  recurringRules.forEach((rule) => {
    if (!rule || rule.isActive === false) return;
    const nextDate = rule.nextOccurrenceDate || calculateNextOccurrence(rule, rule.startDate);
    if (nextDate && nextDate <= targetStr) {
      dueItems.push({
        ...rule,
        dueDate: nextDate,
        isOverdue: nextDate < targetStr,
      });
    }
  });

  return dueItems;
}

/**
 * Calculates monthly normalized metrics for recurring rules (expenses and incomes).
 * @param {Array<Object>} recurringRules
 * @param {string} [baseCurrency='USD']
 * @returns {Object} Monthly summary metrics
 */
export function calculateRecurringSummary(recurringRules = [], baseCurrency = 'USD') {
  let monthlyExpenses = 0;
  let monthlyIncomes = 0;
  let activeSubscriptionsCount = 0;
  let monthlySubscriptionsCost = 0;

  recurringRules.forEach((rule) => {
    if (!rule || rule.isActive === false) return;
    const amount = Number(rule.amount) || 0;
    const interval = Math.max(1, parseInt(rule.interval || 1, 10));

    let monthlyNormalized = 0;
    switch (rule.frequency) {
      case RECURRING_FREQUENCIES.DAILY:
        monthlyNormalized = (amount * 365) / (12 * interval);
        break;
      case RECURRING_FREQUENCIES.WEEKLY:
        monthlyNormalized = (amount * 52) / (12 * interval);
        break;
      case RECURRING_FREQUENCIES.BIWEEKLY:
        monthlyNormalized = (amount * 26) / (12 * interval);
        break;
      case RECURRING_FREQUENCIES.MONTHLY:
        monthlyNormalized = amount / interval;
        break;
      case RECURRING_FREQUENCIES.QUARTERLY:
        monthlyNormalized = amount / (3 * interval);
        break;
      case RECURRING_FREQUENCIES.SEMIANNUAL:
        monthlyNormalized = amount / (6 * interval);
        break;
      case RECURRING_FREQUENCIES.ANNUAL:
        monthlyNormalized = amount / (12 * interval);
        break;
      default:
        monthlyNormalized = amount;
    }

    if (rule.type === 'income') {
      monthlyIncomes += monthlyNormalized;
    } else {
      monthlyExpenses += monthlyNormalized;
      if (rule.isSubscription) {
        activeSubscriptionsCount++;
        monthlySubscriptionsCost += monthlyNormalized;
      }
    }
  });

  const netMonthlyRecurring = monthlyIncomes - monthlyExpenses;
  const annualNormalizedExpense = monthlyExpenses * 12;
  const annualNormalizedIncome = monthlyIncomes * 12;

  return {
    monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    monthlyIncomes: Math.round(monthlyIncomes * 100) / 100,
    netMonthlyRecurring: Math.round(netMonthlyRecurring * 100) / 100,
    annualNormalizedExpense: Math.round(annualNormalizedExpense * 100) / 100,
    annualNormalizedIncome: Math.round(annualNormalizedIncome * 100) / 100,
    activeSubscriptionsCount,
    monthlySubscriptionsCost: Math.round(monthlySubscriptionsCost * 100) / 100,
    currency: baseCurrency,
  };
}
