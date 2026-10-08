/**
 * fireCalculatorEngine.js
 * Financial Independence, Retire Early (FIRE) & 4% Rule Calculator for AuraFinance.
 * Computes LeanFIRE, StandardFIRE, FatFIRE, CoastFIRE, BaristaFIRE and exact years to financial freedom.
 * Zero-Knowledge local processing.
 */

export const FIRE_TYPES = {
  LEAN: 'LEAN',
  STANDARD: 'STANDARD',
  FAT: 'FAT',
  COAST: 'COAST',
  BARISTA: 'BARISTA',
};

/**
 * Calculates comprehensive FIRE metrics and timeline to financial independence.
 * @param {Object} params
 * @param {number} params.currentNetWorth - Current invested / liquid net worth
 * @param {number} params.annualExpenses - Current annual living expenses (or monthlyExpenses * 12)
 * @param {number} [params.annualFixedExpenses] - Essential fixed annual expenses for LeanFIRE
 * @param {number} [params.annualSavings=0] - Total annual savings invested
 * @param {number} [params.safeWithdrawalRate=0.04] - Safe withdrawal rate (default 4% / 0.04)
 * @param {number} [params.expectedAnnualReturn=0.08] - Nominal investment return (e.g. 8%)
 * @param {number} [params.annualInflation=0.03] - Expected annual inflation rate (e.g. 3%)
 * @param {number} [params.currentAge=30] - User current age
 * @param {number} [params.targetRetirementAge=60] - Traditional retirement target age for CoastFIRE
 * @returns {Object} Full FIRE report
 */
export function calculateFireMetrics({
  currentNetWorth = 0,
  annualExpenses = 36000,
  annualFixedExpenses = null,
  annualSavings = 12000,
  safeWithdrawalRate = 0.04,
  expectedAnnualReturn = 0.08,
  annualInflation = 0.03,
  currentAge = 30,
  targetRetirementAge = 60,
} = {}) {
  const netWorth = Math.max(0, Number(currentNetWorth) || 0);
  const totalExp = Math.max(1000, Number(annualExpenses) || 36000);
  const fixedExp = annualFixedExpenses !== null && annualFixedExpenses !== undefined
    ? Math.max(500, Number(annualFixedExpenses))
    : totalExp * 0.6;
  const savings = Math.max(0, Number(annualSavings) || 0);
  const swr = Math.max(0.02, Math.min(0.10, Number(safeWithdrawalRate) || 0.04));
  const nominalR = Math.max(0, Number(expectedAnnualReturn) || 0.08);
  const infl = Math.max(0, Number(annualInflation) || 0.03);
  const age = Math.max(18, Math.min(100, Number(currentAge) || 30));
  const retAge = Math.max(age + 1, Number(targetRetirementAge) || 60);

  // Real investment return (Fisher Equation: (1+r)/(1+i) - 1)
  const realReturnRate = nominalR > infl ? (1 + nominalR) / (1 + infl) - 1 : 0.02;

  // 1. FIRE Numbers for Different Flavors
  const standardFireNumber = Math.round(totalExp / swr);
  const leanFireNumber = Math.round(fixedExp / swr);
  const fatFireNumber = Math.round((totalExp * 1.5) / swr);
  const baristaFireNumber = Math.round((totalExp * 0.6) / swr); // 60% covered by portfolio, 40% side gig

  // CoastFIRE: Amount needed today to reach StandardFIRE at targetRetirementAge without saving another penny
  const yearsToTraditionalRetirement = Math.max(1, retAge - age);
  const coastFireNumber = Math.round(standardFireNumber / Math.pow(1 + realReturnRate, yearsToTraditionalRetirement));
  const isCoastFireAchieved = netWorth >= coastFireNumber;

  // 2. Calculate Years to Standard FIRE
  // FV = NetWorth*(1+r)^t + Savings*[((1+r)^t - 1)/r] = Target
  // We simulate year by year for maximum numerical stability
  let projectedWorth = netWorth;
  let yearsToFire = null;
  let crossoverYear = null;
  const trajectory = [];

  const maxSimulationYears = 60;
  for (let y = 0; y <= maxSimulationYears; y++) {
    const annualReturnEarned = projectedWorth * realReturnRate;

    // Check Crossover Point (When returns > annual expenses)
    if (crossoverYear === null && annualReturnEarned >= totalExp) {
      crossoverYear = y;
    }

    trajectory.push({
      year: y,
      age: age + y,
      projectedNetWorth: Math.round(projectedWorth),
      annualReturns: Math.round(annualReturnEarned),
      fireTargetStandard: standardFireNumber,
      isFireAchieved: projectedWorth >= standardFireNumber,
    });

    if (projectedWorth >= standardFireNumber && yearsToFire === null) {
      yearsToFire = y;
    }

    // Step forward
    projectedWorth = projectedWorth * (1 + realReturnRate) + savings;
  }

  if (yearsToFire === null) {
    yearsToFire = 60;
  }


  const fireAge = age + yearsToFire;
  const currentProgressPct = Math.min(100, Math.round((netWorth / standardFireNumber) * 1000) / 10);
  const leanProgressPct = Math.min(100, Math.round((netWorth / leanFireNumber) * 1000) / 10);

  // Monthly passive income generated at SWR right now
  const currentMonthlyPassiveIncome = Math.round((netWorth * swr) / 12);
  const targetMonthlyPassiveIncome = Math.round(totalExp / 12);

  return {
    currentNetWorth: netWorth,
    annualExpenses: totalExp,
    annualSavings: savings,
    safeWithdrawalRate: swr,
    realReturnRate: Math.round(realReturnRate * 1000) / 10,
    currentProgressPct,
    leanProgressPct,
    yearsToFire,
    fireAge,
    crossoverYear: crossoverYear !== null ? crossoverYear : yearsToFire,
    targets: {
      leanFire: {
        number: leanFireNumber,
        label: 'Lean FIRE',
        description: 'Cubre gastos esenciales básicos de supervivencia.',
        isAchieved: netWorth >= leanFireNumber,
      },
      standardFire: {
        number: standardFireNumber,
        label: 'Standard FIRE',
        description: 'Mantiene el 100% de tu estilo de vida y gastos actuales.',
        isAchieved: netWorth >= standardFireNumber,
      },
      fatFire: {
        number: fatFireNumber,
        label: 'Fat FIRE',
        description: 'Estilo de vida holgado con margen para lujos y viajes (+50%).',
        isAchieved: netWorth >= fatFireNumber,
      },
      coastFire: {
        number: coastFireNumber,
        label: 'Coast FIRE',
        description: `Inversión actual que llegará a Standard FIRE a los ${retAge} años sin más aportes.`,
        isAchieved: isCoastFireAchieved,
      },
      baristaFire: {
        number: baristaFireNumber,
        label: 'Barista FIRE',
        description: 'El portafolio cubre el 60% de tus gastos; un trabajo ligero cubre el resto.',
        isAchieved: netWorth >= baristaFireNumber,
      },
    },
    passiveIncome: {
      currentMonthly: currentMonthlyPassiveIncome,
      targetMonthly: targetMonthlyPassiveIncome,
      coveragePct: Math.min(100, Math.round((currentMonthlyPassiveIncome / targetMonthlyPassiveIncome) * 1000) / 10),
    },
    trajectory: trajectory.slice(0, Math.min(trajectory.length, yearsToFire + 6)),
  };
}
