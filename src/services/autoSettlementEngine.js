/**
 * autoSettlementEngine.js
 * Automatic Bill Settlement & Ledger Auto-Debit Engine for AuraFinance.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr, calculateNextOccurrence } from './recurringEngine';

/**
 * Checks if a recurring rule is eligible for automatic settlement on or before currentDate.
 * @param {Object} rule
 * @param {Date|string} [currentDate=new Date()]
 * @returns {boolean}
 */
export function isEligibleForAutoSettlement(rule, currentDate = new Date()) {
  if (!rule || rule.isActive === false || rule.isAutomatic !== true) return false;
  if (!rule.walletId && !rule.accountId) return false;

  const todayStr = formatToDateStr(parseLocalDate(currentDate));
  const dueDateStr = rule.nextOccurrenceDate || rule.dueDate || rule.startDate;
  if (!dueDateStr || dueDateStr > todayStr) return false;

  // Check if already settled on or after this due date
  if (rule.lastSettledDate && rule.lastSettledDate >= dueDateStr) return false;

  return true;
}

/**
 * Executes automatic liquidation for a single eligible recurring bill.
 * @param {Object} rule
 * @param {Date|string} [currentDate=new Date()]
 * @param {Object} [walletOrAccount=null]
 * @returns {{ transaction: Object, updatedRule: Object }|null}
 */
export function settleRecurringBill(rule, currentDate = new Date(), walletOrAccount = null) {
  if (!isEligibleForAutoSettlement(rule, currentDate)) return null;

  const todayStr = formatToDateStr(parseLocalDate(currentDate));
  const dueDateStr = rule.nextOccurrenceDate || rule.dueDate || rule.startDate;
  const amount = Number(rule.amount) || 0;
  const isIncome = rule.type === 'income';

  // Check wallet funds if expense
  let isInsufficientFunds = false;
  if (!isIncome && walletOrAccount && Number(walletOrAccount.balance) < amount) {
    isInsufficientFunds = true;
  }

  // Create transaction payload
  const transaction = {
    id: `tx-auto-${rule.id}-${dueDateStr}`,
    description: `[Auto-Débito] ${rule.name}`,
    amount,
    type: isIncome ? 'income' : 'expense',
    category: rule.category || (isIncome ? 'Ingreso Recurrente' : 'Servicios'),
    walletId: rule.walletId || rule.accountId,
    date: dueDateStr,
    isRecurring: true,
    recurringRuleId: rule.id,
    createdAt: Date.now(),
    isAutoSettled: true,
  };

  // Advance rule to next occurrence
  const advanceFrom = new Date(parseLocalDate(dueDateStr));
  advanceFrom.setDate(advanceFrom.getDate() + 1);
  const nextOccurrenceDate = calculateNextOccurrence(rule, advanceFrom);

  const updatedRule = {
    ...rule,
    lastSettledDate: dueDateStr,
    nextOccurrenceDate: nextOccurrenceDate || null,
    isActive: nextOccurrenceDate !== null, // auto-deactivate if expired
  };

  return {
    transaction,
    updatedRule,
    isInsufficientFunds,
  };
}

/**
 * Processes batch auto-settlement across all recurring rules in the system.
 * @param {Array<Object>} recurringRules
 * @param {Array<Object>} [wallets=[]]
 * @param {Date|string} [currentDate=new Date()]
 * @returns {{ settledTransactions: Array<Object>, updatedRules: Array<Object>, skippedCount: number, warnings: Array<Object> }}
 */
export function processBatchAutoSettlement(recurringRules = [], wallets = [], currentDate = new Date()) {
  const walletMap = {};
  wallets.forEach((w) => {
    walletMap[w.id] = w;
  });

  const settledTransactions = [];
  const updatedRules = [];
  const warnings = [];
  let skippedCount = 0;

  recurringRules.forEach((rule) => {
    if (!isEligibleForAutoSettlement(rule, currentDate)) {
      skippedCount++;
      return;
    }

    const wallet = rule.walletId ? walletMap[rule.walletId] : null;
    const result = settleRecurringBill(rule, currentDate, wallet);

    if (result) {
      settledTransactions.push(result.transaction);
      updatedRules.push(result.updatedRule);

      if (result.isInsufficientFunds) {
        warnings.push({
          ruleId: rule.id,
          name: rule.name,
          amount: rule.amount,
          walletName: wallet ? wallet.name : 'Billetera',
          message: `Saldo insuficiente para cubrir el pago automático de ${rule.name}.`,
        });
      }
    } else {
      skippedCount++;
    }
  });

  return {
    settledTransactions,
    updatedRules,
    skippedCount,
    warnings,
  };
}
