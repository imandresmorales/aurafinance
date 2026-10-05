/**
 * priceHikeAlertsEngine.js
 * Stealth Subscription Price-Hike Detector & Inflation Creep Audit Engine for AuraFinance.
 * Zero-Knowledge local processing.
 */

import { normalizeToAnnualCost } from './subscriptionAnnualizerEngine';

/**
 * Scans a subscription and its historical transactions to identify price hikes and stealth increases.
 * @param {Object} subscription - Active subscription object
 * @param {Array<Object>} historicalTransactions - Transactions matching this subscription
 * @returns {Object|null} Price hike audit report or null if no price increase found
 */
export function auditSubscriptionPriceHike(subscription, historicalTransactions = []) {
  if (!subscription) return null;

  const currentAmount = Number(subscription.amount) || 0;
  if (currentAmount <= 0) return null;

  // Filter transactions matching this subscription
  const relevantTxs = historicalTransactions
    .filter((t) => {
      const matchRule = t.recurringRuleId === subscription.id;
      const matchDesc = (t.description || '').toLowerCase().includes((subscription.name || '').toLowerCase());
      return matchRule || matchDesc;
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (relevantTxs.length < 2 && !subscription.initialAmount) {
    return null;
  }

  const baselineAmount = subscription.initialAmount
    ? Number(subscription.initialAmount)
    : Number(relevantTxs[0].amount);

  const latestTransaction = relevantTxs[relevantTxs.length - 1];
  const latestAmount = latestTransaction ? Number(latestTransaction.amount) : currentAmount;

  if (latestAmount <= baselineAmount) {
    return null; // No price hike
  }

  const priceDiff = latestAmount - baselineAmount;
  const pctIncrease = ((latestAmount - baselineAmount) / baselineAmount) * 100;

  const currentAnnualCost = normalizeToAnnualCost(latestAmount, subscription.frequency);
  const baselineAnnualCost = normalizeToAnnualCost(baselineAmount, subscription.frequency);
  const annualExtraDrain = currentAnnualCost - baselineAnnualCost;
  const threeYearExtraDrain = annualExtraDrain * 3;

  return {
    subscriptionId: subscription.id,
    name: subscription.name,
    category: subscription.category || 'Streaming',
    frequency: subscription.frequency || 'monthly',
    baselineAmount: Math.round(baselineAmount * 100) / 100,
    currentAmount: Math.round(latestAmount * 100) / 100,
    priceDiff: Math.round(priceDiff * 100) / 100,
    pctIncrease: Math.round(pctIncrease * 10) / 10,
    annualExtraDrain: Math.round(annualExtraDrain * 100) / 100,
    threeYearExtraDrain: Math.round(threeYearExtraDrain * 100) / 100,
    isStealthIncrease: pctIncrease > 0 && pctIncrease <= 15, // Sneaky under-the-radar bumps
    detectionDate: latestTransaction ? latestTransaction.date : new Date().toISOString().split('T')[0],
  };
}

/**
 * Audits all active subscriptions against transaction history to generate an executive report of price creep.
 * @param {Array<Object>} subscriptions
 * @param {Array<Object>} transactions
 * @returns {{ hikes: Array<Object>, totalAnnualExtraDrain: number, affectedSubscriptionsCount: number }}
 */
export function generatePriceHikeReport(subscriptions = [], transactions = []) {
  const hikes = [];
  let totalAnnualExtraDrain = 0;

  subscriptions.forEach((sub) => {
    const audit = auditSubscriptionPriceHike(sub, transactions);
    if (audit) {
      hikes.push(audit);
      totalAnnualExtraDrain += audit.annualExtraDrain;
    }
  });

  return {
    hikes: hikes.sort((a, b) => b.annualExtraDrain - a.annualExtraDrain),
    totalAnnualExtraDrain: Math.round(totalAnnualExtraDrain * 100) / 100,
    affectedSubscriptionsCount: hikes.length,
  };
}
