/**
 * financialStressEngine.js
 * Financial Stress Testing & Contingency Scenario Simulator for AuraFinance.
 * Simulates adverse economic shocks: income payment delays, revenue cuts, emergency capital expenses, and combined crisis.
 * Zero-Knowledge local processing.
 */

import { parseCivilDate, formatCivilDate, addCivilInterval, calculateCivilDaysDiff } from './timezoneSafeScheduler';

export const STRESS_SCENARIOS = {
  INCOME_DELAY: 'INCOME_DELAY',
  INCOME_CUT: 'INCOME_CUT',
  EMERGENCY_EXPENSE: 'EMERGENCY_EXPENSE',
  INFLATION_SURGE: 'INFLATION_SURGE',
  COMBINED_CRISIS: 'COMBINED_CRISIS',
};

export const STRESS_TIERS = {
  FORTRESS: { tier: 'FORTRESS', label: 'Fortaleza Inmune', minScore: 85, color: '#10b981' },
  RESILIENT: { tier: 'RESILIENT', label: 'Resiliente', minScore: 65, color: '#34d399' },
  VULNERABLE: { tier: 'VULNERABLE', label: 'Vulnerable', minScore: 40, color: '#f59e0b' },
  CRITICAL: { tier: 'CRITICAL', label: 'Insolvencia Crítica', minScore: 0, color: '#ef4444' },
};

/**
 * Simulates cash flow impact under adverse financial stress conditions.
 * @param {Object} params
 * @param {number} params.baseLiquidBalance - Current liquid cash / checking balance
 * @param {Array<Object>} [params.recurringIncomes=[]] - [{ id, name, amount, frequency, nextDate }]
 * @param {Array<Object>} [params.recurringExpenses=[]] - [{ id, name, amount, frequency, nextDate, isEssential }]
 * @param {number} [params.dailyDiscretionaryBurn=0] - Discretionary spending rate per day
 * @param {string} [params.scenarioType='INCOME_DELAY'] - STRESS_SCENARIOS key
 * @param {Object} [params.scenarioParams={}] - Parameters for the specific shock
 * @param {number} [params.horizonDays=90] - Simulation duration (e.g. 90 days)
 * @param {string|Date} [params.startDate=new Date()]
 * @returns {Object} Comprehensive stress simulation report
 */
export function simulateFinancialStress({
  baseLiquidBalance = 0,
  recurringIncomes = [],
  recurringExpenses = [],
  dailyDiscretionaryBurn = 0,
  scenarioType = STRESS_SCENARIOS.INCOME_DELAY,
  scenarioParams = {},
  horizonDays = 90,
  startDate = new Date(),
} = {}) {
  const start = parseCivilDate(startDate);
  const liquid = Math.max(0, Number(baseLiquidBalance) || 0);

  // Scenario specific adjustments
  const delayDays = Number(scenarioParams.delayDays ?? 30);
  const incomeCutPct = Math.min(100, Math.max(0, Number(scenarioParams.incomeCutPct ?? 50))) / 100;
  const emergencyCost = Math.max(0, Number(scenarioParams.emergencyCost ?? 2000));
  const emergencyDayOffset = Math.max(0, Number(scenarioParams.emergencyDayOffset ?? 7));
  const inflationSurgePct = Math.max(0, Number(scenarioParams.inflationSurgePct ?? 20)) / 100;

  // Track daily simulated events
  const dailyIncomeEvents = new Map(); // dayIndex -> sum
  const dailyExpenseEvents = new Map(); // dayIndex -> sum
  const stressedIncomeEvents = new Map();
  const stressedExpenseEvents = new Map();

  // Helper to map recurring frequency to day offsets within horizon
  const mapRecurringToDays = (item, isIncome) => {
    const itemAmt = Number(item.amount) || 0;
    if (itemAmt <= 0) return;

    let itemDate = item.nextDate ? parseCivilDate(item.nextDate) : start;
    let dayOffset = calculateCivilDaysDiff(itemDate, start);

    const freq = (item.frequency || 'monthly').toLowerCase();
    const stepDays = freq === 'weekly' ? 7 : freq === 'biweekly' ? 14 : freq === 'annual' ? 365 : 30;

    // Fast-forward or step through horizon
    for (let d = dayOffset; d <= horizonDays; d += stepDays) {
      if (d >= 0 && d <= horizonDays) {
        const targetMap = isIncome ? dailyIncomeEvents : dailyExpenseEvents;
        targetMap.set(d, (targetMap.get(d) || 0) + itemAmt);

        // Compute Stressed variation
        let stressedAmt = itemAmt;

        if (isIncome) {
          if (scenarioType === STRESS_SCENARIOS.INCOME_CUT || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS) {
            stressedAmt = itemAmt * (1 - incomeCutPct);
          }

          let stressedDay = d;
          if (scenarioType === STRESS_SCENARIOS.INCOME_DELAY || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS) {
            stressedDay = d + delayDays;
          }

          if (stressedDay <= horizonDays) {
            stressedIncomeEvents.set(stressedDay, (stressedIncomeEvents.get(stressedDay) || 0) + stressedAmt);
          }
        } else {
          // Expense
          if (scenarioType === STRESS_SCENARIOS.INFLATION_SURGE || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS) {
            stressedAmt = itemAmt * (1 + inflationSurgePct);
          }
          stressedExpenseEvents.set(d, (stressedExpenseEvents.get(d) || 0) + stressedAmt);
        }
      }
    }
  };

  recurringIncomes.forEach((inc) => mapRecurringToDays(inc, true));
  recurringExpenses.forEach((exp) => mapRecurringToDays(exp, false));

  // Add Emergency expense if scenario requires
  if (
    (scenarioType === STRESS_SCENARIOS.EMERGENCY_EXPENSE || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS) &&
    emergencyCost > 0
  ) {
    const shockDay = Math.min(horizonDays, emergencyDayOffset);
    stressedExpenseEvents.set(
      shockDay,
      (stressedExpenseEvents.get(shockDay) || 0) + emergencyCost
    );
  }

  // Simulate day by day
  let baselineBal = liquid;
  let stressedBal = liquid;

  const baselineTrajectory = [];
  const stressedTrajectory = [];

  let minStressedBal = liquid;
  let minStressedDay = 0;
  let insolvencyDate = null;
  let daysInNegative = 0;
  let recoveryDate = null;

  for (let day = 0; day <= horizonDays; day++) {
    const dateObj = addCivilInterval(start, day, 'days');
    const dateStr = formatCivilDate(dateObj);

    // Baseline calculation
    const baseIn = dailyIncomeEvents.get(day) || 0;
    const baseOut = (dailyExpenseEvents.get(day) || 0) + dailyDiscretionaryBurn;
    baselineBal = baselineBal + baseIn - baseOut;

    baselineTrajectory.push({
      day,
      date: dateStr,
      balance: Math.round(baselineBal * 100) / 100,
    });

    // Stressed calculation
    const stressIn = stressedIncomeEvents.get(day) || 0;
    const discretionaryRate = (scenarioType === STRESS_SCENARIOS.INFLATION_SURGE || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS)
      ? dailyDiscretionaryBurn * (1 + inflationSurgePct)
      : dailyDiscretionaryBurn;
    const stressOut = (stressedExpenseEvents.get(day) || 0) + discretionaryRate;
    stressedBal = stressedBal + stressIn - stressOut;

    if (stressedBal < minStressedBal) {
      minStressedBal = stressedBal;
      minStressedDay = day;
    }

    if (stressedBal < 0) {
      daysInNegative++;
      if (!insolvencyDate) {
        insolvencyDate = dateStr;
      }
    } else if (insolvencyDate && !recoveryDate && stressedBal >= 0) {
      recoveryDate = dateStr;
    }

    stressedTrajectory.push({
      day,
      date: dateStr,
      balance: Math.round(stressedBal * 100) / 100,
      inflow: Math.round(stressIn * 100) / 100,
      outflow: Math.round(stressOut * 100) / 100,
      isNegative: stressedBal < 0,
    });
  }

  const maxDeficit = minStressedBal < 0 ? Math.abs(minStressedBal) : 0;

  // Calculate Stress Resilience Score (0 - 100)
  let score = 100;
  if (minStressedBal < 0) {
    const deficitRatio = maxDeficit / (liquid || 1);
    score = Math.max(0, Math.round(50 - Math.min(50, deficitRatio * 25) - daysInNegative * 0.5));
  } else {
    const lowestBufferRatio = minStressedBal / (liquid || 1);
    score = Math.min(100, Math.round(60 + lowestBufferRatio * 40));
  }

  let resilienceTier = STRESS_TIERS.FORTRESS;
  if (score < 40) {
    resilienceTier = STRESS_TIERS.CRITICAL;
  } else if (score < 65) {
    resilienceTier = STRESS_TIERS.VULNERABLE;
  } else if (score < 85) {
    resilienceTier = STRESS_TIERS.RESILIENT;
  }

  // Recommended mitigation actions
  const recommendedMitigations = [];
  if (maxDeficit > 0) {
    recommendedMitigations.push({
      type: 'EMERGENCY_BUFFER',
      title: 'Incrementar Reserva de Liquidez',
      detail: `Se requiere un colchón adicional de al menos $${Math.round(maxDeficit)} para absorber este shock sin incurrir en descubierto.`,
    });
    recommendedMitigations.push({
      type: 'DISCRETIONARY_FREEZE',
      title: 'Congelar Gastos Prescindibles',
      detail: 'Pausar temporalmente suscripciones no esenciales y partidas de ocio durante la fase de estrés.',
    });
    if (scenarioType === STRESS_SCENARIOS.INCOME_DELAY || scenarioType === STRESS_SCENARIOS.COMBINED_CRISIS) {
      recommendedMitigations.push({
        type: 'PAYMENT_TERMS',
        title: 'Negociar Facturación / Hitos Anticipados',
        detail: 'Implementar anticipos del 30-50% o plazos de cobro a 15 días para evitar brechas de tesorería.',
      });
    }
  } else {
    recommendedMitigations.push({
      type: 'HEALTHY_BUFFER',
      title: 'Posición Financiera Sólida',
      detail: 'Tu liquidez actual es suficiente para soportar este escenario de estrés sin caer en números rojos.',
    });
  }

  return {
    scenarioType,
    horizonDays,
    baseLiquidBalance: Math.round(liquid * 100) / 100,
    finalBaselineBalance: baselineTrajectory[baselineTrajectory.length - 1].balance,
    finalStressedBalance: stressedTrajectory[stressedTrajectory.length - 1].balance,
    minStressedBalance: Math.round(minStressedBal * 100) / 100,
    maxDeficit: Math.round(maxDeficit * 100) / 100,
    hasInsolvencyRisk: maxDeficit > 0,
    insolvencyDate,
    recoveryDate,
    daysInNegative,
    resilienceScore: score,
    resilienceTier: resilienceTier.tier,
    tierLabel: resilienceTier.label,
    tierColor: resilienceTier.color,
    recommendedMitigations,
    baselineTrajectory,
    stressedTrajectory,
  };
}
