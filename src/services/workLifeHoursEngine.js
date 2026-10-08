/**
 * workLifeHoursEngine.js
 * Life Energy & Work Hours Conversion Engine for AuraFinance.
 * Translates prices and expenses into the exact hours and days of your life spent working to pay for them.
 * Inspired by Vicki Robin's "Your Money or Your Life".
 * Zero-Knowledge local processing.
 */

/**
 * Computes the user's true effective hourly wage after deducting work-related expenses and adding commute time.
 * @param {Object} params
 * @param {number} params.netMonthlyIncome - Net monthly take-home salary/earnings
 * @param {number} [params.contractedMonthlyHours=160] - Official contracted work hours per month (40h/wk * 4)
 * @param {number} [params.monthlyCommuteHours=0] - Commuting hours per month
 * @param {number} [params.monthlyWorkExpenses=0] - Direct work costs (fuel, transit, parking, meals, clothes)
 * @returns {{ effectiveHourlyWage: number, nominalHourlyWage: number, totalCommittedHours: number, netRealMonthlyIncome: number }}
 */
export function calculateEffectiveHourlyWage({
  netMonthlyIncome = 3000,
  contractedMonthlyHours = 160,
  monthlyCommuteHours = 20,
  monthlyWorkExpenses = 200,
} = {}) {
  const netIncome = Math.max(100, Number(netMonthlyIncome) || 3000);
  const contractedHours = Math.max(10, Number(contractedMonthlyHours) || 160);
  const commuteHours = Math.max(0, Number(monthlyCommuteHours) || 0);
  const workExpenses = Math.max(0, Number(monthlyWorkExpenses) || 0);

  const nominalHourlyWage = Math.round((netIncome / contractedHours) * 100) / 100;
  const totalCommittedHours = contractedHours + commuteHours;
  const netRealIncome = Math.max(0, netIncome - workExpenses);

  const effectiveHourlyWage = totalCommittedHours > 0
    ? Math.round((netRealIncome / totalCommittedHours) * 100) / 100
    : nominalHourlyWage;

  return {
    effectiveHourlyWage: Math.max(1, effectiveHourlyWage),
    nominalHourlyWage,
    totalCommittedHours,
    netRealMonthlyIncome: netRealIncome,
  };
}

/**
 * Converts a monetary price or purchase into exact labor hours, days and human reflection text.
 * @param {number} price - Cost in currency units
 * @param {number} effectiveHourlyWage - True wage earned per committed hour of life
 * @param {number} [hoursPerWorkDay=8] - Standard daily work hours
 * @returns {Object} Life energy conversion metadata
 */
export function convertPriceToWorkHours(price = 0, effectiveHourlyWage = 20, hoursPerWorkDay = 8) {
  const cost = Math.max(0, Number(price) || 0);
  const wage = Math.max(0.1, Number(effectiveHourlyWage) || 20);
  const dayLength = Math.max(1, Number(hoursPerWorkDay) || 8);

  const totalHours = Math.round((cost / wage) * 10) / 10;
  const workDays = Math.round((totalHours / dayLength) * 10) / 10;
  const workWeeks = Math.round((totalHours / (dayLength * 5)) * 10) / 10;

  let formattedDuration = '';
  if (totalHours < 1) {
    const mins = Math.round(totalHours * 60);
    formattedDuration = `${mins} minutos de trabajo`;
  } else if (totalHours < dayLength) {
    formattedDuration = `${totalHours} horas de trabajo`;
  } else if (workDays < 5) {
    const wholeDays = Math.floor(workDays);
    const remHours = Math.round((workDays - wholeDays) * dayLength * 10) / 10;
    formattedDuration = remHours > 0
      ? `${wholeDays} día${wholeDays > 1 ? 's' : ''} y ${remHours}h de trabajo`
      : `${wholeDays} día${wholeDays > 1 ? 's' : ''} de trabajo`;
  } else {
    formattedDuration = `${workWeeks} semanas laborales`;
  }

  const reflectionText = cost > 0
    ? `Para pagar este gasto de $${cost.toFixed(2)}, debes dedicar ${formattedDuration} de tu energía vital.`
    : 'Gasto sin costo de tiempo laboral.';

  return {
    price: cost,
    effectiveHourlyWage: wage,
    totalHours,
    workDays,
    workWeeks,
    formattedDuration,
    reflectionText,
  };
}

/**
 * Enriches a list of transaction records with their life energy equivalent in work hours.
 * @param {Array<Object>} transactions
 * @param {number} effectiveHourlyWage
 * @returns {Array<Object>} Enriched transactions
 */
export function enrichTransactionsWithLaborHours(transactions = [], effectiveHourlyWage = 20) {
  return (transactions || []).map((tx) => {
    const amt = Number(tx.amount) || 0;
    const isExpense = tx.type === 'EXPENSE' || tx.type === 'expense';
    const conversion = isExpense ? convertPriceToWorkHours(amt, effectiveHourlyWage) : null;

    return {
      ...tx,
      laborEnergy: conversion
        ? {
            hours: conversion.totalHours,
            days: conversion.workDays,
            formatted: conversion.formattedDuration,
          }
        : null,
    };
  });
}
