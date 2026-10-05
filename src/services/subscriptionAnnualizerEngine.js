/**
 * subscriptionAnnualizerEngine.js
 * Consolidated Annualized Subscription Cost & Opportunity Cost Analyzer for AuraFinance.
 * Zero-Knowledge local processing.
 */

/**
 * Normalizes any frequency to an annual cost.
 * @param {number} amount
 * @param {string} frequency - 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'
 * @returns {number}
 */
export function normalizeToAnnualCost(amount, frequency = 'monthly') {
  const amt = Number(amount) || 0;
  switch (frequency) {
    case 'weekly':
      return amt * 52;
    case 'biweekly':
      return amt * 26;
    case 'monthly':
      return amt * 12;
    case 'quarterly':
      return amt * 4;
    case 'semiannual':
      return amt * 2;
    case 'annual':
      return amt;
    default:
      return amt * 12;
  }
}

/**
 * Analyzes consolidated annual subscription expenditure, category distribution,
 * 5-year projection, and investment opportunity cost.
 * @param {Array<Object>} subscriptions
 * @param {number} [annualReturnRate=0.07] - Expected market annual return rate (default 7%)
 * @param {string} [baseCurrency='USD']
 * @returns {Object} Comprehensive annual subscription analytics
 */
export function analyzeAnnualizedSubscriptions(subscriptions = [], annualReturnRate = 0.07, baseCurrency = 'USD') {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return {
      totalAnnualCost: 0,
      totalMonthlyEquivalent: 0,
      totalFiveYearCost: 0,
      opportunityCost10Years: 0,
      subscriptionsCount: 0,
      categories: [],
      topSubscription: null,
      currency: baseCurrency,
    };
  }

  const activeSubs = subscriptions.filter((s) => s.status !== 'paused' && s.status !== 'cancelled');

  let totalAnnual = 0;
  const catMap = {};
  let topSub = null;
  let topSubAnnual = 0;

  activeSubs.forEach((sub) => {
    const annualAmt = normalizeToAnnualCost(sub.amount, sub.frequency);
    totalAnnual += annualAmt;

    const cat = sub.category || 'General';
    if (!catMap[cat]) {
      catMap[cat] = { category: cat, annualAmount: 0, monthlyAmount: 0, count: 0 };
    }
    catMap[cat].annualAmount += annualAmt;
    catMap[cat].monthlyAmount += annualAmt / 12;
    catMap[cat].count += 1;

    if (annualAmt > topSubAnnual) {
      topSubAnnual = annualAmt;
      topSub = {
        name: sub.name,
        amount: Number(sub.amount),
        frequency: sub.frequency,
        annualCost: Math.round(annualAmt * 100) / 100,
      };
    }
  });

  const totalMonthly = totalAnnual / 12;
  const totalFiveYear = totalAnnual * 5;

  // Calculate Opportunity Cost of investing this monthly amount for 10 years at annualReturnRate
  // Future Value of monthly annuity: FV = P * [ ((1 + r/12)^(12*t) - 1) / (r/12) ]
  const rMonthly = annualReturnRate / 12;
  const totalMonths = 120; // 10 years
  let opportunityCost10Years = 0;
  if (rMonthly > 0 && totalMonthly > 0) {
    opportunityCost10Years = totalMonthly * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly);
  }

  // Format category breakdown with percentage shares
  const categories = Object.values(catMap).map((c) => ({
    category: c.category,
    annualAmount: Math.round(c.annualAmount * 100) / 100,
    monthlyAmount: Math.round(c.monthlyAmount * 100) / 100,
    count: c.count,
    sharePercentage: totalAnnual > 0 ? Math.round((c.annualAmount / totalAnnual) * 1000) / 10 : 0,
  })).sort((a, b) => b.annualAmount - a.annualAmount);

  return {
    totalAnnualCost: Math.round(totalAnnual * 100) / 100,
    totalMonthlyEquivalent: Math.round(totalMonthly * 100) / 100,
    totalFiveYearCost: Math.round(totalFiveYear * 100) / 100,
    opportunityCost10Years: Math.round(opportunityCost10Years * 100) / 100,
    subscriptionsCount: activeSubs.length,
    categories,
    topSubscription: topSub,
    currency: baseCurrency,
  };
}
