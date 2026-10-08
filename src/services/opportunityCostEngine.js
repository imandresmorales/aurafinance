/**
 * opportunityCostEngine.js
 * Opportunity Cost & Compound Wealth Foregone Engine for AuraFinance.
 * Evaluates the true long-term financial impact of discretionary purchases versus investing in broad market index funds.
 * Zero-Knowledge local processing.
 */

export const DEFAULT_OPPORTUNITY_CONFIG = {
  annualReturnRate: 0.08, // 8.0% expected nominal annual market return
  inflationRate: 0.025,   // 2.5% expected inflation
  safeWithdrawalRate: 0.04, // 4.0% safe withdrawal rate for perpetual passive income
  defaultHorizonsYears: [1, 5, 10, 20, 30],
  coolingOffThresholdAmount: 100, // Suggest 72-hour delay rule for purchases above $100
};

/**
 * Evaluates the opportunity cost of a single purchase or recurring expense against compound market returns.
 * @param {Object} params
 * @param {number} params.amount - Purchase cost or monthly recurring amount
 * @param {string} [params.name='Gasto'] - Name or description of purchase
 * @param {'ONE_OFF'|'MONTHLY'|'ANNUAL'} [params.frequency='ONE_OFF'] - Frequency of expense
 * @param {string} [params.category='OTHER'] - Category of expense
 * @param {Object} [options]
 * @param {number} [options.annualReturnRate=0.08]
 * @param {number} [options.inflationRate=0.025]
 * @param {Array<number>} [options.horizonsYears=[1, 5, 10, 20, 30]]
 * @param {number} [options.hourlyWage=0] - Optional hourly wage to calculate work-hours
 * @param {number} [options.dailyRetirementExpense=50] - Estimated daily expense in retirement
 * @returns {Object} Comprehensive opportunity cost report
 */
export function evaluateOpportunityCost({
  amount = 0,
  name = 'Gasto',
  frequency = 'ONE_OFF',
  category = 'OTHER',
} = {}, options = {}) {
  const principal = Math.max(0, Number(amount) || 0);
  const nominalRate = Number(options.annualReturnRate ?? DEFAULT_OPPORTUNITY_CONFIG.annualReturnRate);
  const inflation = Number(options.inflationRate ?? DEFAULT_OPPORTUNITY_CONFIG.inflationRate);
  const swr = Number(options.safeWithdrawalRate ?? DEFAULT_OPPORTUNITY_CONFIG.safeWithdrawalRate);
  const horizons = Array.isArray(options.horizonsYears) && options.horizonsYears.length > 0
    ? options.horizonsYears
    : DEFAULT_OPPORTUNITY_CONFIG.defaultHorizonsYears;
  const hourlyWage = Number(options.hourlyWage) || 0;
  const dailyRetirementExpense = Math.max(1, Number(options.dailyRetirementExpense) || 50);

  // Real interest rate: (1 + r) / (1 + i) - 1
  const realRate = ((1 + nominalRate) / (1 + inflation)) - 1;

  const isRecurringMonthly = frequency === 'MONTHLY';
  const isRecurringAnnual = frequency === 'ANNUAL';
  const isOneOff = frequency === 'ONE_OFF';

  // Calculate future values at specified horizons
  const projections = horizons.map((years) => {
    let nominalFV = 0;
    let realFV = 0;
    let totalInvestedPrincipal = principal;

    if (isOneOff) {
      nominalFV = principal * Math.pow(1 + nominalRate, years);
      realFV = principal * Math.pow(1 + realRate, years);
      totalInvestedPrincipal = principal;
    } else if (isRecurringMonthly) {
      const monthlyRate = nominalRate / 12;
      const realMonthlyRate = realRate / 12;
      const totalMonths = years * 12;

      nominalFV = monthlyRate > 0
        ? principal * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
        : principal * totalMonths;

      realFV = realMonthlyRate > 0
        ? principal * ((Math.pow(1 + realMonthlyRate, totalMonths) - 1) / realMonthlyRate)
        : principal * totalMonths;

      totalInvestedPrincipal = principal * totalMonths;
    } else if (isRecurringAnnual) {
      nominalFV = nominalRate > 0
        ? principal * ((Math.pow(1 + nominalRate, years) - 1) / nominalRate)
        : principal * years;

      realFV = realRate > 0
        ? principal * ((Math.pow(1 + realRate, years) - 1) / realRate)
        : principal * years;

      totalInvestedPrincipal = principal * years;
    }

    const compoundGainsNominal = Math.max(0, nominalFV - totalInvestedPrincipal);
    const compoundGainsReal = Math.max(0, realFV - totalInvestedPrincipal);
    const multiplier = totalInvestedPrincipal > 0 ? nominalFV / totalInvestedPrincipal : 1;

    // Passive income generated per year & per month from this wealth
    const annualPassiveIncome = nominalFV * swr;
    const monthlyPassiveIncome = annualPassiveIncome / 12;

    return {
      years,
      totalInvestedPrincipal: Math.round(totalInvestedPrincipal * 100) / 100,
      nominalFutureValue: Math.round(nominalFV * 100) / 100,
      realFutureValue: Math.round(realFV * 100) / 100,
      compoundGainsNominal: Math.round(compoundGainsNominal * 100) / 100,
      compoundGainsReal: Math.round(compoundGainsReal * 100) / 100,
      multiplier: Math.round(multiplier * 100) / 100,
      annualPassiveIncome: Math.round(annualPassiveIncome * 100) / 100,
      monthlyPassiveIncome: Math.round(monthlyPassiveIncome * 100) / 100,
    };
  });

  // Highlighted 10-year and 30-year figures
  const proj10 = projections.find((p) => p.years === 10) || projections[Math.min(2, projections.length - 1)];
  const proj30 = projections.find((p) => p.years === 30) || projections[projections.length - 1];

  // Work life hours equivalent
  const workHoursRequired = hourlyWage > 0 ? Math.round((principal / hourlyWage) * 10) / 10 : null;

  // Days of retirement freedom consumed
  const retirementDaysConsumed = Math.round((principal / dailyRetirementExpense) * 10) / 10;

  // Impact Rating & Friction advice
  let impactRating = 'LOW';
  let badgeColor = '#10b981';
  let badgeLabel = 'Impacto Bajo';

  const annualizedCost = isRecurringMonthly ? principal * 12 : isRecurringAnnual ? principal : principal;

  if (annualizedCost >= 2000 || (proj10 && proj10.nominalFutureValue >= 5000)) {
    impactRating = 'HIGH';
    badgeColor = '#ef4444';
    badgeLabel = 'Alto Impacto Patrimonial';
  } else if (annualizedCost >= 400 || (proj10 && proj10.nominalFutureValue >= 1000)) {
    impactRating = 'MEDIUM';
    badgeColor = '#f59e0b';
    badgeLabel = 'Impacto Moderado';
  }

  const recommendations = [];
  if (principal >= DEFAULT_OPPORTUNITY_CONFIG.coolingOffThresholdAmount && isOneOff) {
    recommendations.push('Aplica la Regla de las 72 Horas: Espera 3 días antes de comprar para filtrar impulsos emocionales.');
  }
  if (proj10) {
    recommendations.push(`En 10 años, este dinero invertido al 8% se convertiría en $${proj10.nominalFutureValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
  }
  if (proj30) {
    recommendations.push(`A 30 años (jubilación), representaría un patrimonio de $${proj30.nominalFutureValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} y $${proj30.monthlyPassiveIncome.toFixed(2)}/mes de renta pasiva.`);
  }
  if (workHoursRequired && workHoursRequired > 0) {
    recommendations.push(`Equivale a ${workHoursRequired} horas de trabajo a tu tarifa horaria neta.`);
  }

  return {
    name,
    amount: principal,
    frequency,
    category,
    annualizedCost: Math.round(annualizedCost * 100) / 100,
    assumptions: {
      annualReturnRate: nominalRate,
      inflationRate: inflation,
      realReturnRate: Math.round(realRate * 10000) / 10000,
      safeWithdrawalRate: swr,
    },
    projections,
    summary10Years: proj10,
    summary30Years: proj30,
    workHoursRequired,
    retirementDaysConsumed,
    impactRating,
    badgeColor,
    badgeLabel,
    recommendations,
  };
}

/**
 * Compares an immediate purchase vs several alternative wealth-building allocations.
 * @param {number} amount - Amount to allocate
 * @param {Object} [options]
 * @returns {Object} Comparative analysis across strategies
 */
export function compareOpportunityVsAlternative(amount = 0, options = {}) {
  const principal = Math.max(0, Number(amount) || 0);

  const strategies = [
    {
      id: 'EXPENSE',
      name: 'Gasto / Consumo Inmediato',
      description: 'El capital se deprecia o consume al 100%.',
      returnRate: 0,
      fv10Years: 0,
      fv30Years: 0,
    },
    {
      id: 'INDEX_FUND',
      name: 'Fondo Indexado Global (S&P 500 / MSCI World)',
      description: 'Crecimiento compuesto promedio histórico a largo plazo (~8% anual).',
      returnRate: 0.08,
      fv10Years: Math.round(principal * Math.pow(1.08, 10) * 100) / 100,
      fv30Years: Math.round(principal * Math.pow(1.08, 30) * 100) / 100,
    },
    {
      id: 'HYSA_BONDS',
      name: 'Cuenta de Alto Rendimiento / Bonos Seguros',
      description: 'Rendimiento conservador y seguro contra volatilidad (~4.5% anual).',
      returnRate: 0.045,
      fv10Years: Math.round(principal * Math.pow(1.045, 10) * 100) / 100,
      fv30Years: Math.round(principal * Math.pow(1.045, 30) * 100) / 100,
    },
    {
      id: 'DEBT_PAYOFF',
      name: 'Amortización de Deuda (Tarjeta / Préstamo)',
      description: 'Rendimiento financiero garantizado libre de impuestos equivalente al interés evitado (~20% anual).',
      returnRate: 0.20,
      fv10Years: Math.round(principal * Math.pow(1.20, 10) * 100) / 100,
      fv30Years: Math.round(principal * Math.pow(1.20, 30) * 100) / 100,
    },
  ];

  return {
    amount: principal,
    strategies,
    topRecommendedAlternative: strategies[1],
    bestGuaranteedAlternative: strategies[3],
  };
}

/**
 * Scans a list of discretionary transactions and calculates the collective opportunity cost.
 * @param {Array<Object>} transactions
 * @param {Object} [options]
 * @returns {Object} Collective opportunity cost analysis
 */
export function scanTransactionOpportunityCosts(transactions = [], options = {}) {
  const discretionaryTx = transactions.filter((t) => {
    const isExpense = t.type === 'EXPENSE' || (Number(t.amount) < 0 && !t.type);
    const isDiscretionary = t.isDiscretionary !== false && t.category !== 'INCOME' && t.category !== 'TRANSFER';
    return isExpense && isDiscretionary;
  });

  const totalSpent = discretionaryTx.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const evaluation = evaluateOpportunityCost({
    amount: totalSpent,
    name: 'Total Gastos Discrecionales Evaluados',
    frequency: 'ONE_OFF',
  }, options);

  return {
    transactionCount: discretionaryTx.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    opportunityReport: evaluation,
  };
}
