/**
 * subscriptionOptimizerEngine.js
 * Subscription Optimization & Savings Capacity Simulator for AuraFinance.
 * Zero-Knowledge local processing.
 */

import { normalizeToAnnualCost } from './subscriptionAnnualizerEngine';

/**
 * Simulates the impact of customized cancellation, downgrade, or annual plan conversion.
 * @param {Object} params
 * @param {Array<Object>} params.currentSubscriptions - List of current subscriptions
 * @param {Array<string>} [params.cancelledSubIds=[]] - IDs of subscriptions targeted for cancellation
 * @param {Array<string>} [params.annualConvertedSubIds=[]] - IDs of subscriptions converting from monthly to annual (avg 16.6% discount / 2 months free)
 * @param {number} [params.monthlyIncome=3000] - Baseline monthly income to compute savings rate delta
 * @param {number} [params.currentMonthlySavings=500] - Baseline monthly savings
 * @param {number} [params.annualDiscountRate=0.166] - Discount rate for annual billing conversion (default ~16.6%)
 * @returns {Object} Simulation results with monthly/annual savings, savings rate jump, and 5-year investment impact
 */
export function simulateSubscriptionOptimization({
  currentSubscriptions = [],
  cancelledSubIds = [],
  annualConvertedSubIds = [],
  monthlyIncome = 3000,
  currentMonthlySavings = 500,
  annualDiscountRate = 0.166,
} = {}) {
  const income = Math.max(1, Number(monthlyIncome) || 3000);
  const baselineSavings = Math.max(0, Number(currentMonthlySavings) || 0);

  let baselineMonthlyCost = 0;
  let optimizedMonthlyCost = 0;
  let cancelledCount = 0;
  let convertedToAnnualCount = 0;

  currentSubscriptions.forEach((sub) => {
    if (sub.status === 'paused' || sub.status === 'cancelled') return;

    const currentAnnual = normalizeToAnnualCost(sub.amount, sub.frequency);
    const currentMonthly = currentAnnual / 12;
    baselineMonthlyCost += currentMonthly;

    // Check if cancelled in simulation
    if (cancelledSubIds.includes(sub.id)) {
      cancelledCount++;
      return; // 0 cost
    }

    // Check if converted to annual billing
    if (annualConvertedSubIds.includes(sub.id) && sub.frequency === 'monthly') {
      convertedToAnnualCount++;
      const discountedAnnual = currentAnnual * (1 - annualDiscountRate);
      optimizedMonthlyCost += discountedAnnual / 12;
      return;
    }

    optimizedMonthlyCost += currentMonthly;
  });

  const monthlySavingsFreed = Math.max(0, baselineMonthlyCost - optimizedMonthlyCost);
  const annualSavingsFreed = monthlySavingsFreed * 12;
  const newMonthlySavings = baselineSavings + monthlySavingsFreed;

  const baselineSavingsRate = (baselineSavings / income) * 100;
  const newSavingsRate = (newMonthlySavings / income) * 100;
  const savingsRateDelta = newSavingsRate - baselineSavingsRate;

  // 5-Year compound value if reinvested at 7% annual return
  const rMonthly = 0.07 / 12;
  const totalMonths = 60;
  let fiveYearInvestmentGrowth = 0;
  if (monthlySavingsFreed > 0) {
    fiveYearInvestmentGrowth = monthlySavingsFreed * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly);
  }

  return {
    baselineMonthlyCost: Math.round(baselineMonthlyCost * 100) / 100,
    optimizedMonthlyCost: Math.round(optimizedMonthlyCost * 100) / 100,
    monthlySavingsFreed: Math.round(monthlySavingsFreed * 100) / 100,
    annualSavingsFreed: Math.round(annualSavingsFreed * 100) / 100,
    newMonthlySavings: Math.round(newMonthlySavings * 100) / 100,
    baselineSavingsRate: Math.round(baselineSavingsRate * 10) / 10,
    newSavingsRate: Math.round(newSavingsRate * 10) / 10,
    savingsRateDelta: Math.round(savingsRateDelta * 10) / 10,
    fiveYearInvestmentGrowth: Math.round(fiveYearInvestmentGrowth * 100) / 100,
    cancelledCount,
    convertedToAnnualCount,
  };
}

/**
 * Generates automated heuristic optimization presets (Conservative, Moderate, Aggressive).
 * @param {Array<Object>} subscriptions
 * @param {number} [monthlyIncome=3000]
 * @returns {Object} Presets comparisons
 */
export function generateOptimizationPresets(subscriptions = [], monthlyIncome = 3000) {
  // Preset 1: Annual Switch - converts all monthly subs to annual billing to save 16.6%
  const allMonthlyIds = subscriptions
    .filter((s) => s.frequency === 'monthly' && s.status !== 'paused')
    .map((s) => s.id);

  const annualSwitchPreset = simulateSubscriptionOptimization({
    currentSubscriptions: subscriptions,
    annualConvertedSubIds: allMonthlyIds,
    monthlyIncome,
  });

  // Preset 2: Trim Streaming/Entertainment (keep only highest value 1)
  const streamingSubs = subscriptions.filter((s) => (s.category || '').toLowerCase().includes('streaming'));
  const sortedStreaming = [...streamingSubs].sort((a, b) => Number(b.amount) - Number(a.amount));
  const streamingToCancel = sortedStreaming.slice(1).map((s) => s.id);

  const trimEntertainmentPreset = simulateSubscriptionOptimization({
    currentSubscriptions: subscriptions,
    cancelledSubIds: streamingToCancel,
    monthlyIncome,
  });

  return {
    annualSwitch: {
      name: 'Pase a Facturación Anual',
      description: 'Convierte suscripciones mensuales a planes anuales con ~2 meses gratis de ahorro.',
      results: annualSwitchPreset,
    },
    trimEntertainment: {
      name: 'Rotación Inteligente de Streaming',
      description: 'Mantiene solo 1 servicio de streaming activo y pausa el resto.',
      results: trimEntertainmentPreset,
    },
  };
}
