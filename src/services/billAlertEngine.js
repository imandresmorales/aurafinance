/**
 * billAlertEngine.js
 * Proactive Bill Reminder & Liquidity Shortage Warning Engine for AuraFinance.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr } from './recurringEngine';

export const ALERT_URGENCY = {
  OVERDUE: 'overdue',
  DUE_TODAY: 'due_today',
  URGENT: 'urgent', // 1-3 days
  UPCOMING: 'upcoming', // 4-7 days
  FUTURE: 'future', // > 7 days
};

/**
 * Generates proactive alerts for upcoming bills with wallet liquidity checks.
 * @param {Object} params
 * @param {Array<Object>} params.bills - Recurring rules or pending invoices
 * @param {Array<Object>} [params.wallets=[]] - User wallets for liquidity sufficiency checks
 * @param {Date|string} [params.currentDate=new Date()]
 * @param {number} [params.warningHorizonDays=7] - Advance warning window in days
 * @returns {Array<Object>} Sorted list of actionable bill alerts
 */
export function generateBillAlerts({
  bills = [],
  wallets = [],
  currentDate = new Date(),
  warningHorizonDays = 7,
} = {}) {
  if (!Array.isArray(bills) || bills.length === 0) return [];

  const today = parseLocalDate(currentDate);
  const todayStr = formatToDateStr(today);

  const walletMap = {};
  wallets.forEach((w) => {
    walletMap[w.id] = w;
  });

  const alerts = [];

  bills.forEach((bill) => {
    if (!bill || bill.status === 'paused' || bill.status === 'cancelled' || bill.status === 'paid') {
      return;
    }

    const dueDateStr = bill.dueDate || bill.nextRenewal || bill.nextOccurrenceDate;
    if (!dueDateStr) return;

    const dueDate = parseLocalDate(dueDateStr);
    const diffTime = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Exclude bills far in the future
    if (daysRemaining > warningHorizonDays) return;

    let urgency = ALERT_URGENCY.FUTURE;
    if (daysRemaining < 0) {
      urgency = ALERT_URGENCY.OVERDUE;
    } else if (daysRemaining === 0) {
      urgency = ALERT_URGENCY.DUE_TODAY;
    } else if (daysRemaining <= 3) {
      urgency = ALERT_URGENCY.URGENT;
    } else if (daysRemaining <= warningHorizonDays) {
      urgency = ALERT_URGENCY.UPCOMING;
    }

    const billAmount = Number(bill.amount) || 0;
    const linkedWallet = bill.walletId ? walletMap[bill.walletId] : null;
    const walletBalance = linkedWallet ? Number(linkedWallet.balance) || 0 : null;

    const isLiquidityShortage = linkedWallet ? walletBalance < billAmount : false;
    const shortageAmount = isLiquidityShortage ? billAmount - walletBalance : 0;

    let message = '';
    if (urgency === ALERT_URGENCY.OVERDUE) {
      message = `Venció hace ${Math.abs(daysRemaining)} día(s).`;
    } else if (urgency === ALERT_URGENCY.DUE_TODAY) {
      message = 'Vence hoy.';
    } else {
      message = `Vence en ${daysRemaining} día(s) (${dueDateStr}).`;
    }

    alerts.push({
      id: `alert-${bill.id || Math.random().toString(36).substr(2, 9)}`,
      billId: bill.id,
      name: bill.name || bill.description || 'Factura Programada',
      amount: billAmount,
      currency: bill.currency || 'USD',
      category: bill.category || 'Servicios',
      dueDate: dueDateStr,
      daysRemaining,
      urgency,
      isOverdue: daysRemaining < 0,
      isDueToday: daysRemaining === 0,
      isLiquidityShortage,
      shortageAmount: Math.round(shortageAmount * 100) / 100,
      walletName: linkedWallet ? linkedWallet.name : 'No asignada',
      walletBalance: walletBalance !== null ? Math.round(walletBalance * 100) / 100 : null,
      message,
    });
  });

  // Sort by urgency priority (overdue first, then due today, then by days remaining ascending)
  const urgencyPriority = {
    [ALERT_URGENCY.OVERDUE]: 0,
    [ALERT_URGENCY.DUE_TODAY]: 1,
    [ALERT_URGENCY.URGENT]: 2,
    [ALERT_URGENCY.UPCOMING]: 3,
    [ALERT_URGENCY.FUTURE]: 4,
  };

  return alerts.sort((a, b) => {
    const pA = urgencyPriority[a.urgency];
    const pB = urgencyPriority[b.urgency];
    if (pA !== pB) return pA - pB;
    return a.daysRemaining - b.daysRemaining;
  });
}
