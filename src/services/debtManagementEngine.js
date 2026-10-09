/**
 * debtManagementEngine.js
 * Comprehensive Debt & Liabilities Management Engine for AuraFinance.
 * Models credit cards, personal loans, mortgages, auto loans, and revolving lines.
 * Computes portfolio weighted average interest rate (WACC), revolving utilization,
 * debt burden metrics, and financial bleeding per day/month.
 * Zero-Knowledge local processing.
 */

export const DEBT_TYPES = {
  CREDIT_CARD: { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito', icon: '💳', isRevolving: true, color: '#ef4444' },
  PERSONAL_LOAN: { id: 'PERSONAL_LOAN', label: 'Préstamo Personal', icon: '🤝', isRevolving: false, color: '#f59e0b' },
  MORTGAGE: { id: 'MORTGAGE', label: 'Hipoteca Inmobiliaria', icon: '🏠', isRevolving: false, color: '#3b82f6' },
  AUTO_LOAN: { id: 'AUTO_LOAN', label: 'Crédito Automotriz', icon: '🚗', isRevolving: false, color: '#8b5cf6' },
  STUDENT_LOAN: { id: 'STUDENT_LOAN', label: 'Préstamo Educativo', icon: '🎓', isRevolving: false, color: '#06b6d4' },
  REVOLVING_LINE: { id: 'REVOLVING_LINE', label: 'Línea de Crédito', icon: '🔄', isRevolving: true, color: '#ec4899' },
  OTHER: { id: 'OTHER', label: 'Otras Obligaciones', icon: '📄', isRevolving: false, color: '#64748b' },
};

/**
 * Evaluates the health and metrics for a single debt entity.
 * @param {Object} debt
 * @returns {Object} Enriched debt entity with health warnings
 */
export function evaluateDebtItem(debt = {}) {
  const balance = Math.max(0, Number(debt.principalBalance) || 0);
  const original = Math.max(balance, Number(debt.originalAmount) || balance);
  const rate = Math.max(0, Number(debt.interestRate) || 0);
  const minPayment = Math.max(0, Number(debt.minimumMonthlyPayment) || 0);
  const limit = Math.max(0, Number(debt.creditLimit) || 0);
  const typeMeta = DEBT_TYPES[debt.type] || DEBT_TYPES.OTHER;

  const monthlyInterest = balance * (rate / 12);
  const dailyInterest = balance * (rate / 365);

  let utilizationRate = null;
  if (typeMeta.isRevolving && limit > 0) {
    utilizationRate = Math.min(100, Math.round((balance / limit) * 1000) / 10);
  }

  const warnings = [];
  if (rate >= 0.25) {
    warnings.push({
      id: 'high-interest',
      severity: 'critical',
      message: `Tasa de interés muy alta (${(rate * 100).toFixed(1)}% anual). Priorizar liquidación urgente.`,
    });
  }

  if (utilizationRate !== null && utilizationRate > 50) {
    warnings.push({
      id: 'high-utilization',
      severity: 'warning',
      message: `Utilización de tarjeta al ${utilizationRate}% (recomendado < 30% para scoring crediticio óptimo).`,
    });
  }

  if (minPayment > 0 && minPayment <= monthlyInterest * 1.1) {
    warnings.push({
      id: 'minimum-trap',
      severity: 'critical',
      message: 'El pago mínimo apenas cubre los intereses generados. El capital no se reducirá significativamente.',
    });
  }

  return {
    ...debt,
    principalBalance: balance,
    originalAmount: original,
    interestRate: rate,
    interestRatePct: Math.round(rate * 1000) / 10,
    minimumMonthlyPayment: minPayment,
    creditLimit: limit,
    monthlyInterestCost: Math.round(monthlyInterest * 100) / 100,
    dailyInterestCost: Math.round(dailyInterest * 100) / 100,
    utilizationRate,
    typeMeta,
    warnings,
    isPaidOff: balance <= 0,
  };
}

/**
 * Computes consolidated summary metrics for an entire portfolio of debts.
 * @param {Array<Object>} debts
 * @param {Object} [options]
 * @param {number} [options.monthlyNetIncome=0] - Net monthly take-home income for DTI
 * @returns {Object} Comprehensive debt portfolio summary
 */
export function calculateTotalDebtSummary(debts = [], options = {}) {
  const evaluatedDebts = (debts || []).map((d) => evaluateDebtItem(d));
  const activeDebts = evaluatedDebts.filter((d) => !d.isPaidOff);

  let totalOutstanding = 0;
  let totalOriginal = 0;
  let totalMonthlyMinimum = 0;
  let totalMonthlyInterest = 0;
  let weightedRateNumerator = 0;

  let totalRevolvingBalance = 0;
  let totalCreditLimit = 0;

  const breakdownByType = {};

  activeDebts.forEach((d) => {
    totalOutstanding += d.principalBalance;
    totalOriginal += d.originalAmount;
    totalMonthlyMinimum += d.minimumMonthlyPayment;
    totalMonthlyInterest += d.monthlyInterestCost;
    weightedRateNumerator += d.principalBalance * d.interestRate;

    if (d.typeMeta.isRevolving) {
      totalRevolvingBalance += d.principalBalance;
      totalCreditLimit += d.creditLimit;
    }

    const typeKey = d.type || 'OTHER';
    if (!breakdownByType[typeKey]) {
      breakdownByType[typeKey] = {
        type: typeKey,
        label: d.typeMeta.label,
        icon: d.typeMeta.icon,
        color: d.typeMeta.color,
        count: 0,
        totalBalance: 0,
        monthlyPayment: 0,
      };
    }
    breakdownByType[typeKey].count += 1;
    breakdownByType[typeKey].totalBalance += d.principalBalance;
    breakdownByType[typeKey].monthlyPayment += d.minimumMonthlyPayment;
  });

  const weightedAverageRate = totalOutstanding > 0
    ? Math.round((weightedRateNumerator / totalOutstanding) * 10000) / 10000
    : 0;

  const totalRevolvingUtilization = totalCreditLimit > 0
    ? Math.min(100, Math.round((totalRevolvingBalance / totalCreditLimit) * 1000) / 10)
    : null;

  // Debt-to-Income (DTI) Ratio
  const income = Math.max(0, Number(options.monthlyNetIncome) || 0);
  const debtToIncomeRatio = income > 0
    ? Math.min(100, Math.round((totalMonthlyMinimum / income) * 1000) / 10)
    : null;

  // Find extremes
  const highestRateDebt = activeDebts.length > 0
    ? [...activeDebts].sort((a, b) => b.interestRate - a.interestRate)[0]
    : null;

  const lowestBalanceDebt = activeDebts.length > 0
    ? [...activeDebts].sort((a, b) => a.principalBalance - b.principalBalance)[0]
    : null;

  return {
    totalDebtsCount: evaluatedDebts.length,
    activeDebtsCount: activeDebts.length,
    paidOffDebtsCount: evaluatedDebts.length - activeDebts.length,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    totalOriginal: Math.round(totalOriginal * 100) / 100,
    totalMonthlyMinimum: Math.round(totalMonthlyMinimum * 100) / 100,
    totalMonthlyInterest: Math.round(totalMonthlyInterest * 100) / 100,
    totalDailyInterest: Math.round((totalMonthlyInterest / 30.4375) * 100) / 100,
    totalAnnualInterest: Math.round(totalMonthlyInterest * 12 * 100) / 100,
    weightedAverageRate,
    weightedAverageRatePct: Math.round(weightedAverageRate * 1000) / 10,
    totalRevolvingBalance: Math.round(totalRevolvingBalance * 100) / 100,
    totalCreditLimit: Math.round(totalCreditLimit * 100) / 100,
    totalRevolvingUtilization,
    debtToIncomeRatio,
    highestRateDebt,
    lowestBalanceDebt,
    breakdownByType: Object.values(breakdownByType),
    debts: evaluatedDebts,
  };
}
