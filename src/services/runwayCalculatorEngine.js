/**
 * runwayCalculatorEngine.js
 * Financial Runway & Survival Duration Calculator for AuraFinance.
 * Computes exact months and days of financial independence without new income.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr } from './recurringEngine';

export const RUNWAY_TIERS = {
  CRITICAL: 'critical', // < 1 month
  VULNERABLE: 'vulnerable', // 1 - 3 months
  MODERATE: 'moderate', // 3 - 6 months
  SECURE: 'secure', // 6 - 12 months
  FORTRESS: 'fortress', // > 12 months
};

/**
 * Calculates financial runway based on liquid reserves and monthly burn rates.
 * @param {Object} params
 * @param {number} params.liquidBalance - Total available liquid cash & checking funds
 * @param {number} [params.monthlyFixedBurn=0] - Essential fixed monthly expenses (rent, utilities, debt, food)
 * @param {number} [params.monthlyDiscretionaryBurn=0] - Non-essential discretionary monthly expenses
 * @param {Array<Object>} [params.subscriptions=[]] - Active subscriptions list
 * @param {Date|string} [params.asOfDate=new Date()]
 * @returns {Object} Runway metrics and extension insights
 */
export function calculateFinancialRunway({
  liquidBalance = 0,
  monthlyFixedBurn = 0,
  monthlyDiscretionaryBurn = 0,
  subscriptions = [],
  asOfDate = new Date(),
} = {}) {
  const liquid = Math.max(0, Number(liquidBalance) || 0);
  const fixed = Math.max(0, Number(monthlyFixedBurn) || 0);
  const discretionary = Math.max(0, Number(monthlyDiscretionaryBurn) || 0);

  // Calculate monthly subscriptions cost
  const subscriptionCost = subscriptions
    .filter((s) => s.status === 'active' || s.status === undefined)
    .reduce((sum, s) => {
      const amt = Number(s.amount) || 0;
      return sum + (s.frequency === 'annual' ? amt / 12 : amt);
    }, 0);

  const totalStandardBurn = fixed + discretionary + subscriptionCost;
  const totalSurvivalBurn = fixed; // stripped down to absolute essentials only

  // Standard Runway in months
  const standardRunwayMonths = totalStandardBurn > 0 ? liquid / totalStandardBurn : (liquid > 0 ? 999 : 0);
  const standardRunwayDays = Math.round(standardRunwayMonths * 30.4375);

  // Survival Runway in months (cutting all subscriptions and discretionary expenses)
  const survivalRunwayMonths = totalSurvivalBurn > 0 ? liquid / totalSurvivalBurn : (liquid > 0 ? 999 : 0);
  const survivalRunwayDays = Math.round(survivalRunwayMonths * 30.4375);

  // Calculate zero-cash dates
  const startDate = parseLocalDate(asOfDate);
  const zeroCashDateStandard = new Date(startDate);
  zeroCashDateStandard.setDate(zeroCashDateStandard.getDate() + standardRunwayDays);

  const zeroCashDateSurvival = new Date(startDate);
  zeroCashDateSurvival.setDate(zeroCashDateSurvival.getDate() + survivalRunwayDays);

  // Determine Tier
  let tier = RUNWAY_TIERS.FORTRESS;
  let statusMessage = 'Posición de máxima seguridad financiera.';

  if (standardRunwayMonths < 1) {
    tier = RUNWAY_TIERS.CRITICAL;
    statusMessage = '¡Alerta Crítica! Menos de 30 días de cobertura de liquidez.';
  } else if (standardRunwayMonths < 3) {
    tier = RUNWAY_TIERS.VULNERABLE;
    statusMessage = 'Zona Vulnerable. Se recomienda aumentar el fondo de liquidez de emergencia a un mínimo de 3 meses.';
  } else if (standardRunwayMonths < 6) {
    tier = RUNWAY_TIERS.MODERATE;
    statusMessage = 'Colchón Moderado. Cumple con la base de seguridad estándar recomendada.';
  } else if (standardRunwayMonths < 12) {
    tier = RUNWAY_TIERS.SECURE;
    statusMessage = 'Excelente Solvencia. Cobertura sólida para imprevistos prolongados.';
  }

  // Runway extension potential by pausing subscriptions & discretionary spending
  const extraMonthsFromDiscretionary = survivalRunwayMonths - standardRunwayMonths;

  return {
    liquidBalance: Math.round(liquid * 100) / 100,
    totalStandardBurn: Math.round(totalStandardBurn * 100) / 100,
    totalSurvivalBurn: Math.round(totalSurvivalBurn * 100) / 100,
    fixedBurn: Math.round(fixed * 100) / 100,
    discretionaryBurn: Math.round(discretionary * 100) / 100,
    subscriptionCost: Math.round(subscriptionCost * 100) / 100,
    standardRunwayMonths: Math.round(standardRunwayMonths * 10) / 10,
    standardRunwayDays,
    survivalRunwayMonths: Math.round(survivalRunwayMonths * 10) / 10,
    survivalRunwayDays,
    zeroCashDateStandard: formatToDateStr(zeroCashDateStandard),
    zeroCashDateSurvival: formatToDateStr(zeroCashDateSurvival),
    tier,
    statusMessage,
    extraMonthsFromDiscretionary: Math.max(0, Math.round(extraMonthsFromDiscretionary * 10) / 10),
  };
}
