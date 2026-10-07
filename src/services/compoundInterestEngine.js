/**
 * compoundInterestEngine.js
 * High-Precision Compound Interest & Wealth Accumulation Engine for AuraFinance.
 * Formula: A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
 * Zero-Knowledge local processing.
 */

export const COMPOUND_FREQUENCIES = {
  ANNUALLY: 1,
  SEMI_ANNUALLY: 2,
  QUARTERLY: 4,
  MONTHLY: 12,
  DAILY: 365,
};

/**
 * Calculates compound interest growth schedule with periodic contributions, inflation discount, and tax impact.
 * @param {Object} params
 * @param {number} [params.principal=0] - Initial starting lump sum ($P)
 * @param {number} [params.annualRate=0.07] - Annual nominal interest rate (e.g. 0.07 for 7%)
 * @param {number} [params.years=10] - Investment horizon in years ($t)
 * @param {number} [params.monthlyContribution=0] - Periodic monthly contribution ($PMT)
 * @param {number} [params.compoundFrequency=12] - Compounding periods per year ($n, default 12 for monthly)
 * @param {'end'|'beginning'} [params.contributionTiming='end'] - Made at end or beginning of period
 * @param {number} [params.annualInflationRate=0.0] - Annual inflation rate for real purchasing power calculation
 * @param {number} [params.taxRate=0.0] - Capital gains tax rate on earned interest (0.0 to 0.5)
 * @returns {Object} Full compound interest report with yearly breakdown
 */
export function calculateCompoundGrowth({
  principal = 0,
  annualRate = 0.07,
  years = 10,
  monthlyContribution = 0,
  compoundFrequency = COMPOUND_FREQUENCIES.MONTHLY,
  contributionTiming = 'end',
  annualInflationRate = 0.0,
  taxRate = 0.0,
} = {}) {
  const P = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(annualRate) || 0);
  const t = Math.max(1, Math.min(100, Number(years) || 10));
  const PMT = Math.max(0, Number(monthlyContribution) || 0);
  const n = Number(compoundFrequency) || 12;
  const inflation = Math.max(0, Number(annualInflationRate) || 0);
  const tax = Math.max(0, Math.min(0.9, Number(taxRate) || 0));

  const schedule = [];
  let currentBalance = P;
  let totalCumulativeDeposits = P;
  let totalCumulativeInterest = 0;
  let totalCumulativeTaxPaid = 0;

  // Monthly stepping for precision
  const totalMonths = t * 12;
  const monthlyRate = r / 12;

  // Track year-by-year accumulation
  let yearStartBalance = P;
  let yearContributions = 0;
  let yearInterest = 0;

  for (let m = 1; m <= totalMonths; m++) {
    // If beginning of month contribution
    if (contributionTiming === 'beginning') {
      currentBalance += PMT;
      totalCumulativeDeposits += PMT;
      yearContributions += PMT;
    }

    // Monthly interest on current balance
    const grossInterest = currentBalance * monthlyRate;
    const taxOnInterest = grossInterest * tax;
    const netInterest = grossInterest - taxOnInterest;

    currentBalance += netInterest;
    totalCumulativeInterest += netInterest;
    totalCumulativeTaxPaid += taxOnInterest;
    yearInterest += netInterest;

    // If end of month contribution
    if (contributionTiming === 'end') {
      currentBalance += PMT;
      totalCumulativeDeposits += PMT;
      yearContributions += PMT;
    }

    // Year boundary snapshot
    if (m % 12 === 0) {
      const yearIndex = m / 12;
      const inflationDiscountFactor = Math.pow(1 + inflation, yearIndex);
      const realPurchasingPower = currentBalance / inflationDiscountFactor;

      schedule.push({
        year: yearIndex,
        startingBalance: Math.round(yearStartBalance * 100) / 100,
        contributionsThisYear: Math.round(yearContributions * 100) / 100,
        totalDeposited: Math.round(totalCumulativeDeposits * 100) / 100,
        interestEarnedThisYear: Math.round(yearInterest * 100) / 100,
        cumulativeInterest: Math.round(totalCumulativeInterest * 100) / 100,
        endingBalance: Math.round(currentBalance * 100) / 100,
        realPurchasingPower: Math.round(realPurchasingPower * 100) / 100,
      });

      yearStartBalance = currentBalance;
      yearContributions = 0;
      yearInterest = 0;
    }
  }

  const futureValueNominal = Math.round(currentBalance * 100) / 100;
  const totalDeposited = Math.round(totalCumulativeDeposits * 100) / 100;
  const totalInterestEarned = Math.round(totalCumulativeInterest * 100) / 100;
  const inflationDiscount = Math.pow(1 + inflation, t);
  const futureValueReal = Math.round((currentBalance / inflationDiscount) * 100) / 100;

  const totalContributions = Math.round((totalDeposited - P) * 100) / 100;
  const interestMultiplier = totalDeposited > 0
    ? Math.round((futureValueNominal / totalDeposited) * 100) / 100
    : 1;

  const ruleOf72Years = r > 0 ? Math.round((72 / (r * 100)) * 10) / 10 : Infinity;

  return {
    principal: P,
    annualRate: r,
    years: t,
    monthlyContribution: PMT,
    compoundFrequency: n,
    contributionTiming,
    futureValueNominal,
    futureValueReal,
    totalDeposited,
    totalPrincipal: P,
    totalContributions,
    totalInterestEarned,
    interestMultiplier,
    totalTaxPaid: Math.round(totalCumulativeTaxPaid * 100) / 100,
    ruleOf72Years,
    schedule,
  };
}

/**
 * Compares growth outcomes across multiple annual interest rate benchmarks (e.g. 0%, 2%, 5%, 8%, 10%).
 * @param {Object} params
 * @param {number} params.principal
 * @param {number} params.monthlyContribution
 * @param {number} params.years
 * @param {Array<number>} [params.rates=[0.0, 0.02, 0.05, 0.08, 0.10]]
 * @returns {Array<{ ratePct: number, label: string, futureValue: number, interestEarned: number }>}
 */
export function compareGrowthRates({
  principal = 0,
  monthlyContribution = 0,
  years = 10,
  rates = [0.0, 0.02, 0.05, 0.08, 0.10],
} = {}) {
  const labels = {
    0.0: 'Ahorro Pasivo (0%)',
    0.02: 'Depósito Tradicional (2%)',
    0.05: 'Cuenta de Alto Rendimiento HYSA (5%)',
    0.08: 'Fondo Indexado Global / S&P500 (8%)',
    0.10: 'Renta Variable Diversificada (10%)',
  };

  return rates.map((rate) => {
    const growth = calculateCompoundGrowth({
      principal,
      annualRate: rate,
      years,
      monthlyContribution,
    });

    return {
      rate,
      ratePct: Math.round(rate * 100),
      label: labels[rate] || `Rendimiento del ${Math.round(rate * 100)}%`,
      futureValue: growth.futureValueNominal,
      totalDeposited: growth.totalDeposited,
      interestEarned: growth.totalInterestEarned,
      multiplier: growth.interestMultiplier,
    };
  });
}
