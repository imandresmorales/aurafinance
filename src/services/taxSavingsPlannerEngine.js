/**
 * taxSavingsPlannerEngine.js
 * Tax Savings & Personal Deduction Optimization Planner for AuraFinance.
 * Computes progressive tax liabilities, marginal vs effective tax rates,
 * standard vs itemized deduction comparison, and net fiscal savings.
 * Zero-Knowledge local processing.
 */

export const DEFAULT_TAX_BRACKETS = [
  { upTo: 11600, rate: 0.10 },
  { upTo: 47150, rate: 0.12 },
  { upTo: 100525, rate: 0.22 },
  { upTo: 191950, rate: 0.24 },
  { upTo: 243725, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

/**
 * Calculates progressive tax liability on a given taxable income.
 * @param {number} taxableIncome
 * @param {Array<{ upTo: number, rate: number }>} [brackets=DEFAULT_TAX_BRACKETS]
 * @returns {{ totalTax: number, marginalRate: number, effectiveRate: number, breakdown: Array<Object> }}
 */
export function calculateProgressiveTax(taxableIncome = 0, brackets = DEFAULT_TAX_BRACKETS) {
  const income = Math.max(0, Number(taxableIncome) || 0);
  if (income === 0) {
    return {
      taxableIncome: 0,
      totalTax: 0,
      marginalRate: 0,
      effectiveRate: 0,
      breakdown: [],
    };
  }

  let remainingIncome = income;
  let prevLimit = 0;
  let totalTax = 0;
  let highestMarginalRate = 0;
  const breakdown = [];

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const bracketSpan = bracket.upTo - prevLimit;
    const taxableInBracket = Math.min(remainingIncome, bracketSpan);
    const taxInBracket = taxableInBracket * bracket.rate;

    totalTax += taxInBracket;
    highestMarginalRate = bracket.rate;

    breakdown.push({
      rangeLabel: bracket.upTo === Infinity ? `>${prevLimit}` : `${prevLimit} - ${bracket.upTo}`,
      ratePct: Math.round(bracket.rate * 100),
      taxableAmount: Math.round(taxableInBracket * 100) / 100,
      taxAmount: Math.round(taxInBracket * 100) / 100,
    });

    remainingIncome -= taxableInBracket;
    prevLimit = bracket.upTo;
  }

  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return {
    taxableIncome: Math.round(income * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    marginalRate: highestMarginalRate,
    marginalRatePct: Math.round(highestMarginalRate * 100),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}

/**
 * Evaluates total personal deductions, compares Standard vs Itemized deduction, and computes net tax savings.
 * @param {Object} params
 * @param {number} params.grossAnnualIncome - Total gross pre-tax income
 * @param {number} [params.deductibleExpenses=0] - Sum of itemized deductions (health, education, retirement, etc.)
 * @param {Object} [options]
 * @param {number} [options.standardDeduction=14600] - Baseline standard deduction
 * @param {number} [options.maxDeductionCapPct=0.15] - Maximum statutory percentage cap of gross income (e.g. 15%)
 * @param {Array<Object>} [options.customBrackets]
 * @returns {Object} Comprehensive tax savings report
 */
export function planTaxSavings({
  grossAnnualIncome = 50000,
  deductibleExpenses = 0,
} = {}, options = {}) {
  const gross = Math.max(0, Number(grossAnnualIncome) || 0);
  const rawItemized = Math.max(0, Number(deductibleExpenses) || 0);
  const standardDeduction = Math.max(0, Number(options.standardDeduction ?? 14600));
  const capPct = Math.max(0.01, Math.min(1.0, Number(options.maxDeductionCapPct ?? 0.15)));
  const brackets = options.customBrackets || DEFAULT_TAX_BRACKETS;

  // Statutory maximum itemized deduction cap
  const maxAllowableItemized = Math.round((gross * capPct) * 100) / 100;
  const applicableItemized = Math.min(rawItemized, maxAllowableItemized);
  const isCapped = rawItemized > maxAllowableItemized;

  // 1. Tax with Zero Deductions (Gross base)
  const baseTaxReport = calculateProgressiveTax(gross, brackets);

  // 2. Tax with Standard Deduction
  const taxableWithStandard = Math.max(0, gross - standardDeduction);
  const standardTaxReport = calculateProgressiveTax(taxableWithStandard, brackets);

  // 3. Tax with Itemized Deductions
  const taxableWithItemized = Math.max(0, gross - applicableItemized);
  const itemizedTaxReport = calculateProgressiveTax(taxableWithItemized, brackets);

  // Optimal Deduction Strategy
  const isItemizedBetter = applicableItemized > standardDeduction;
  const optimalDeductionAmount = isItemizedBetter ? applicableItemized : standardDeduction;
  const optimalTaxReport = isItemizedBetter ? itemizedTaxReport : standardTaxReport;
  const optimalStrategy = isItemizedBetter ? 'ITEMIZED' : 'STANDARD';

  // Net Savings compared to zero deductions
  const netTaxSavings = Math.round((baseTaxReport.totalTax - optimalTaxReport.totalTax) * 100) / 100;
  const effectiveRateReduction = Math.round((baseTaxReport.effectiveRate - optimalTaxReport.effectiveRate) * 100) / 100;

  // Marginal Tax Savings from $1,000 additional deductible contribution
  const marginalTaxRate = optimalTaxReport.marginalRate;
  const marginalSavingsPerThousand = Math.round(1000 * marginalTaxRate * 100) / 100;

  const recommendations = [];
  if (!isItemizedBetter && rawItemized > 0) {
    recommendations.push(`La deducción estándar ($${standardDeduction.toLocaleString()}) supera tus deducciones personales ($${rawItemized.toLocaleString()}). Conviene aplicar la deducción estándar.`);
  } else if (isItemizedBetter) {
    recommendations.push(`Tus deducciones personales ($${applicableItemized.toLocaleString()}) superan la deducción estándar, generándote un ahorro adicional de $${(standardTaxReport.totalTax - itemizedTaxReport.totalTax).toFixed(2)}.`);
  }

  if (isCapped) {
    recommendations.push(`Tus deducciones excedieron el tope de ley del ${(capPct * 100).toFixed(0)}% del ingreso ($${maxAllowableItemized.toLocaleString()}).`);
  }

  recommendations.push(`Por cada $1,000 adicionales que aportes a cuentas deducibles (retiro/salud), ahorras $${marginalSavingsPerThousand.toFixed(2)} en impuestos directos.`);

  return {
    grossAnnualIncome: gross,
    rawItemizedDeductions: rawItemized,
    maxAllowableItemized,
    applicableItemizedDeductions: applicableItemized,
    isCapped,
    standardDeduction,
    optimalStrategy,
    optimalDeductionAmount,
    baseTaxLiability: baseTaxReport.totalTax,
    finalTaxLiability: optimalTaxReport.totalTax,
    netTaxSavings,
    effectiveRateBefore: baseTaxReport.effectiveRate,
    effectiveRateAfter: optimalTaxReport.effectiveRate,
    effectiveRateReduction,
    marginalRatePct: optimalTaxReport.marginalRatePct,
    marginalSavingsPerThousand,
    standardTaxReport,
    itemizedTaxReport,
    recommendations,
  };
}
