/**
 * cashFlowForecastEngine.js
 * High-Precision Cash Flow Forecasting Engine for 30, 60, and 90 days in AuraFinance.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr, generateProjectedOccurrences } from './recurringEngine';

/**
 * Calculates a multi-horizon cash flow projection (30, 60, 90 days).
 * @param {Object} params
 * @param {number} params.currentLiquidBalance - Initial cash/checking liquid funds
 * @param {Array<Object>} [params.recurringRules=[]] - Active recurring incomes and expenses
 * @param {Array<Object>} [params.recentTransactions=[]] - Past transactions to estimate baseline discretionary burn
 * @param {Date|string} [params.startDate=new Date()] - Forecast starting date
 * @param {number} [params.safetyThreshold=500] - Minimum balance buffer threshold before triggering risk alert
 * @param {number} [params.horizonDays=90] - Days to project (default 90)
 * @returns {Object} Complete cash flow forecast data with daily timeline and risk metrics
 */
export function calculateCashFlowForecast({
  currentLiquidBalance = 0,
  recurringRules = [],
  recentTransactions = [],
  startDate = new Date(),
  safetyThreshold = 500,
  horizonDays = 90,
} = {}) {
  const start = parseLocalDate(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + horizonDays);

  const initialBalance = Number(currentLiquidBalance) || 0;

  // 1. Calculate baseline daily discretionary spending from recent transactions (last 30-60 days)
  let dailyDiscretionaryBurn = 0;
  if (Array.isArray(recentTransactions) && recentTransactions.length > 0) {
    const expenses = recentTransactions.filter((t) => t.type === 'expense' && !t.isRecurring && Number(t.amount) > 0);
    const totalDiscretionary = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    // Find time span of transactions
    const dates = recentTransactions.map((t) => parseLocalDate(t.date).getTime()).filter((t) => !isNaN(t));
    if (dates.length > 1) {
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const spanDays = Math.max(7, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
      dailyDiscretionaryBurn = totalDiscretionary / spanDays;
    } else {
      dailyDiscretionaryBurn = totalDiscretionary / 30;
    }
  }

  // 2. Generate all scheduled/recurring events in the horizon window
  const scheduledEvents = generateProjectedOccurrences(recurringRules, start, end);

  // Group scheduled events by dateStr
  const eventsByDate = {};
  scheduledEvents.forEach((evt) => {
    if (!eventsByDate[evt.date]) {
      eventsByDate[evt.date] = [];
    }
    eventsByDate[evt.date].push(evt);
  });

  // 3. Construct daily timeline simulation
  const timeline = [];
  let runningBalance = initialBalance;
  let minBalance = initialBalance;
  let minBalanceDate = formatToDateStr(start);
  let deficitDate = null;
  let safetyBreachDate = null;

  let totalInflow = 0;
  let totalOutflow = 0;

  let balanceAt30 = initialBalance;
  let balanceAt60 = initialBalance;
  let balanceAt90 = initialBalance;

  for (let dayOffset = 0; dayOffset <= horizonDays; dayOffset++) {
    const currentSimDate = new Date(start);
    currentSimDate.setDate(currentSimDate.getDate() + dayOffset);
    const dateStr = formatToDateStr(currentSimDate);

    let dayInflow = 0;
    let dayOutflow = 0;

    const dayEvents = eventsByDate[dateStr] || [];
    dayEvents.forEach((evt) => {
      const amt = Number(evt.amount) || 0;
      if (evt.type === 'income') {
        dayInflow += amt;
      } else {
        dayOutflow += amt;
      }
    });

    // Add discretionary daily burn (if dayOffset > 0)
    if (dayOffset > 0) {
      dayOutflow += dailyDiscretionaryBurn;
    }

    runningBalance = runningBalance + dayInflow - dayOutflow;
    totalInflow += dayInflow;
    totalOutflow += dayOutflow;

    if (runningBalance < minBalance) {
      minBalance = runningBalance;
      minBalanceDate = dateStr;
    }

    if (runningBalance < 0 && !deficitDate) {
      deficitDate = dateStr;
    }

    if (runningBalance < safetyThreshold && !safetyBreachDate) {
      safetyBreachDate = dateStr;
    }

    if (dayOffset === 30) balanceAt30 = runningBalance;
    if (dayOffset === 60) balanceAt60 = runningBalance;
    if (dayOffset === 90) balanceAt90 = runningBalance;

    // Variance bands (+/- 10% daily variance accumulation)
    const uncertaintyFactor = Math.sqrt(dayOffset) * 15;
    const optimisticBalance = runningBalance + uncertaintyFactor;
    const conservativeBalance = runningBalance - uncertaintyFactor;

    timeline.push({
      dayOffset,
      date: dateStr,
      balance: Math.round(runningBalance * 100) / 100,
      optimisticBalance: Math.round(optimisticBalance * 100) / 100,
      conservativeBalance: Math.round(conservativeBalance * 100) / 100,
      inflow: Math.round(dayInflow * 100) / 100,
      outflow: Math.round(dayOutflow * 100) / 100,
      eventsCount: dayEvents.length,
      events: dayEvents,
    });
  }

  // Net trajectory
  const netVariance90 = balanceAt90 - initialBalance;
  const isHealthy = minBalance >= safetyThreshold;

  return {
    initialBalance: Math.round(initialBalance * 100) / 100,
    horizonDays,
    balanceAt30: Math.round(balanceAt30 * 100) / 100,
    balanceAt60: Math.round(balanceAt60 * 100) / 100,
    balanceAt90: Math.round(balanceAt90 * 100) / 100,
    minBalance: Math.round(minBalance * 100) / 100,
    minBalanceDate,
    deficitDate,
    safetyBreachDate,
    hasDeficitRisk: deficitDate !== null,
    hasSafetyRisk: safetyBreachDate !== null,
    isHealthy,
    totalInflow: Math.round(totalInflow * 100) / 100,
    totalOutflow: Math.round(totalOutflow * 100) / 100,
    netVariance90: Math.round(netVariance90 * 100) / 100,
    dailyDiscretionaryBurn: Math.round(dailyDiscretionaryBurn * 100) / 100,
    timeline,
  };
}
