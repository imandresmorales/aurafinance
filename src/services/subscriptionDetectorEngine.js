/**
 * subscriptionDetectorEngine.js
 * Intelligent Subscription Detection & Price-Hike Analysis Engine for AuraFinance.
 * Zero-Knowledge local-first processing.
 */

import { parseLocalDate, formatToDateStr } from './recurringEngine';

/**
 * Known common digital subscription patterns and merchant keywords.
 */
export const SUBSCRIPTION_KEYWORDS = [
  'netflix',
  'spotify',
  'amazon prime',
  'disney',
  'hbo',
  'max',
  'apple',
  'icloud',
  'google one',
  'youtube',
  'github',
  'chatgpt',
  'openai',
  'adobe',
  'dropbox',
  'notion',
  'microsoft 365',
  'playstation',
  'xbox',
  'nintendo',
  'gym',
  'gimnasio',
  'smart fit',
  'fiber',
  'fibra',
  'internet',
  'hosting',
  'aws',
  'digitalocean',
  'vercel',
  'heroku',
  'audible',
  'crunchyroll',
  'deezer',
  'paramount',
  'patreon',
  'substack',
];

/**
 * Normalizes description for clustering (lowercase, removes special chars and numbers).
 * @param {string} desc
 * @returns {string}
 */
export function normalizeMerchantName(desc = '') {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects recurring subscriptions from an array of transaction history.
 * Analyzes transaction periodicity (27-35 days for monthly, 360-370 days for annual),
 * description similarity, and amount variance.
 * @param {Array<Object>} transactions
 * @returns {Array<Object>} Detected subscriptions with confidence score and renewal predictions
 */
export function detectSubscriptionsFromTransactions(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  // Filter only expenses
  const expenses = transactions.filter((t) => t.type === 'expense' && Number(t.amount) > 0);
  if (expenses.length === 0) return [];

  // Group transactions by normalized description cluster
  const clusters = {};

  expenses.forEach((tx) => {
    const rawName = tx.description || tx.name || tx.category || 'Gasto';
    const norm = normalizeMerchantName(rawName);
    if (!norm) return;

    // Check if matches an existing cluster prefix or keyword
    let matchedKey = null;
    for (const key of Object.keys(clusters)) {
      if (norm.includes(key) || key.includes(norm)) {
        matchedKey = key;
        break;
      }
    }

    const groupKey = matchedKey || norm;
    if (!clusters[groupKey]) {
      clusters[groupKey] = [];
    }
    clusters[groupKey].push(tx);
  });

  const detected = [];

  Object.entries(clusters).forEach(([groupName, txList]) => {
    if (txList.length < 2) {
      // Check if matches strong keyword directly for single occurrences
      const isKnownKeyword = SUBSCRIPTION_KEYWORDS.some((kw) => groupName.includes(kw));
      if (isKnownKeyword && txList.length === 1) {
        const tx = txList[0];
        detected.push({
          id: `det-kw-${tx.id || Math.random().toString(36).substr(2, 9)}`,
          name: tx.description || groupName,
          amount: Number(tx.amount),
          currency: tx.currency || 'USD',
          category: tx.category || 'Suscripciones',
          frequency: 'monthly',
          confidenceScore: 65,
          occurrenceCount: 1,
          lastPaymentDate: tx.date ? tx.date.split('T')[0] : '',
          isPriceHikeDetected: false,
          previousAmount: null,
          history: [tx],
        });
      }
      return;
    }

    // Sort chronologically
    const sortedTxs = [...txList].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // Calculate intervals between consecutive occurrences
    const intervalsInDays = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      const dPrev = parseLocalDate(sortedTxs[i - 1].date);
      const dCurr = parseLocalDate(sortedTxs[i].date);
      const diffDays = Math.round((dCurr - dPrev) / (1000 * 60 * 60 * 24));
      intervalsInDays.push(diffDays);
    }

    const avgInterval = intervalsInDays.reduce((a, b) => a + b, 0) / intervalsInDays.length;

    let frequency = 'monthly';
    let isPeriodValid = false;

    // Monthly: interval roughly between 25 and 35 days
    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'monthly';
      isPeriodValid = true;
    } else if (avgInterval >= 350 && avgInterval <= 380) {
      // Annual
      frequency = 'annual';
      isPeriodValid = true;
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      // Weekly
      frequency = 'weekly';
      isPeriodValid = true;
    }

    // Check keyword bonus
    const hasKeyword = SUBSCRIPTION_KEYWORDS.some((kw) => groupName.includes(kw));

    if (isPeriodValid || hasKeyword) {
      const latestTx = sortedTxs[sortedTxs.length - 1];
      const previousTx = sortedTxs[sortedTxs.length - 2];
      const latestAmount = Number(latestTx.amount);
      const previousAmount = Number(previousTx.amount);

      const isPriceHikeDetected = latestAmount > previousAmount;
      const priceHikeDiff = isPriceHikeDetected ? latestAmount - previousAmount : 0;

      // Base confidence calculation
      let score = 50;
      if (isPeriodValid) score += 30;
      if (hasKeyword) score += 20;
      if (sortedTxs.length >= 3) score += 10;
      if (latestAmount === previousAmount) score += 10;
      score = Math.min(100, score);

      detected.push({
        id: `det-${groupName.replace(/\s+/g, '-')}-${sortedTxs.length}`,
        name: latestTx.description || groupName,
        amount: latestAmount,
        currency: latestTx.currency || 'USD',
        category: latestTx.category || 'Suscripciones',
        frequency,
        confidenceScore: score,
        occurrenceCount: sortedTxs.length,
        lastPaymentDate: latestTx.date ? latestTx.date.split('T')[0] : '',
        isPriceHikeDetected,
        priceHikeDiff: Math.round(priceHikeDiff * 100) / 100,
        previousAmount: isPriceHikeDetected ? previousAmount : null,
        history: sortedTxs,
      });
    }
  });

  return detected.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Calculates aggregate stats for active and detected subscriptions.
 * @param {Array<Object>} subscriptions
 * @param {Array<Object>} detectedSubscriptions
 * @param {string} [baseCurrency='USD']
 * @returns {Object}
 */
export function calculateSubscriptionMetrics(subscriptions = [], detectedSubscriptions = [], baseCurrency = 'USD') {
  let monthlyTotal = 0;
  let annualTotal = 0;
  let activeCount = 0;
  let pausedCount = 0;
  let priceHikesCount = 0;

  subscriptions.forEach((sub) => {
    if (sub.status === 'paused') {
      pausedCount++;
      return;
    }
    if (sub.status === 'cancelled') return;

    activeCount++;
    const amt = Number(sub.amount) || 0;
    const isAnnual = sub.frequency === 'annual';

    const monthlyNorm = isAnnual ? amt / 12 : amt;
    const annualNorm = isAnnual ? amt : amt * 12;

    monthlyTotal += monthlyNorm;
    annualTotal += annualNorm;
  });

  detectedSubscriptions.forEach((det) => {
    if (det.isPriceHikeDetected) {
      priceHikesCount++;
    }
  });

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    annualTotal: Math.round(annualTotal * 100) / 100,
    activeCount,
    pausedCount,
    detectedCount: detectedSubscriptions.length,
    priceHikesCount,
    currency: baseCurrency,
  };
}
