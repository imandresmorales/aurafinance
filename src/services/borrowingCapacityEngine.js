/**
 * borrowingCapacityEngine.js
 * Safe Borrowing Capacity & Debt-to-Income (DTI) Threshold Engine for AuraFinance.
 * Computes maximum safe monthly debt quotas (<30% standard), available borrowing margin,
 * and maximum loan principal capacity across personal, auto and mortgage financing.
 * Zero-Knowledge local processing.
 */

export const DTI_THRESHOLDS = {
  OPTIMAL: {
    key: 'OPTIMAL',
    label: 'Óptimo / Saludable',
    maxDTI: 15,
    color: '#10b981',
    description: 'Nivel de endeudamiento muy bajo (<15%). Amplio margen de seguridad financiera.',
  },
  SAFE: {
    key: 'SAFE',
    label: 'Seguro / Controlado',
    maxDTI: 30,
    color: '#3b82f6',
    description: 'Nivel de endeudamiento prudente (15% - 30%). Capacidad de absorción de imprevistos.',
  },
  CAUTION: {
    key: 'CAUTION',
    label: 'Precaución / Límite',
    maxDTI: 40,
    color: '#f59e0b',
    description: 'Nivel elevado (30% - 40%). Se desaconseja adquirir nuevas obligaciones financieras.',
  },
  DANGER: {
    key: 'DANGER',
    label: 'Riesgo Crítico / Sobreendeudamiento',
    maxDTI: 100,
    color: '#ef4444',
    description: 'Sobreendeudamiento severo (>40%). Riesgo inminente de impago o asfixia financiera.',
  },
};

/**
 * Evaluates the user's safe borrowing capacity and available monthly debt buffer.
 * @param {Object} params
 * @param {number} params.netMonthlyIncome - Net take-home monthly income
 * @param {number} [params.currentMonthlyDebtPayments=0] - Existing monthly debt servicing
 * @param {number} [params.monthlyLivingExpenses=0] - Fixed & variable living expenses
 * @param {number} [params.maxSafeDTIPct=30] - Recommended safe threshold percentage (default 30%)
 * @returns {Object} Full borrowing capacity diagnostic
 */
export function calculateBorrowingCapacity({
  netMonthlyIncome = 3000,
  currentMonthlyDebtPayments = 0,
  monthlyLivingExpenses = 1800,
  maxSafeDTIPct = 30,
} = {}) {
  const income = Math.max(1, Number(netMonthlyIncome) || 3000);
  const currentDebt = Math.max(0, Number(currentMonthlyDebtPayments) || 0);
  const livingExp = Math.max(0, Number(monthlyLivingExpenses) || 0);
  const targetThresholdPct = Math.max(10, Math.min(50, Number(maxSafeDTIPct) || 30));

  const currentDTI = Math.min(100, Math.round((currentDebt / income) * 1000) / 10);
  const maxSafeMonthlyPayment = Math.round((income * (targetThresholdPct / 100)) * 100) / 100;
  const availableSafeMonthlyMargin = Math.max(0, Math.round((maxSafeMonthlyPayment - currentDebt) * 100) / 100);

  // Cash flow uncommitted buffer
  const monthlyFreeCashFlow = Math.round((income - currentDebt - livingExp) * 100) / 100;

  // Determine DTI Tier
  let tier = DTI_THRESHOLDS.DANGER;
  if (currentDTI <= DTI_THRESHOLDS.OPTIMAL.maxDTI) {
    tier = DTI_THRESHOLDS.OPTIMAL;
  } else if (currentDTI <= DTI_THRESHOLDS.SAFE.maxDTI) {
    tier = DTI_THRESHOLDS.SAFE;
  } else if (currentDTI <= DTI_THRESHOLDS.CAUTION.maxDTI) {
    tier = DTI_THRESHOLDS.CAUTION;
  }

  const recommendations = [];
  if (currentDTI > 30) {
    recommendations.push('Evita adquirir nuevos créditos o compras a plazos hasta reducir el DTI por debajo del 30%.');
  }
  if (availableSafeMonthlyMargin > 0 && currentDTI <= 30) {
    recommendations.push(`Cuentas con un margen prudente de hasta $${availableSafeMonthlyMargin.toFixed(2)}/mes para financiamiento sin comprometer tu estabilidad.`);
  }
  if (monthlyFreeCashFlow < availableSafeMonthlyMargin) {
    recommendations.push('Tu flujo de caja libre real es menor que el límite teórico del 30%. Guíate por tu efectivo real no comprometido.');
  }

  return {
    netMonthlyIncome: income,
    currentMonthlyDebtPayments: currentDebt,
    monthlyLivingExpenses: livingExp,
    currentDTI,
    maxSafeDTIPct: targetThresholdPct,
    maxSafeMonthlyPayment,
    availableSafeMonthlyMargin,
    monthlyFreeCashFlow,
    isOverIndebted: currentDTI > targetThresholdPct,
    tier,
    recommendations,
  };
}

/**
 * Calculates the maximum loan principal the user can afford given an available monthly payment.
 * Formula: P = PMT * [((1 + i)^n - 1) / (i(1 + i)^n)]
 * @param {Object} params
 * @param {number} params.maxMonthlyPayment - Available monthly capacity ($PMT)
 * @param {number} [params.annualInterestRate=0.09] - Expected annual interest rate (e.g. 0.09 for 9%)
 * @param {number} [params.termMonths=36] - Duration in months
 * @returns {{ maxPrincipal: number, totalFinancingCost: number, totalInterestPaid: number }}
 */
export function calculateMaxLoanPrincipal({
  maxMonthlyPayment = 300,
  annualInterestRate = 0.09,
  termMonths = 36,
} = {}) {
  const pmt = Math.max(0, Number(maxMonthlyPayment) || 0);
  const r = Math.max(0, Number(annualInterestRate) || 0.09);
  const n = Math.max(1, Math.min(600, Number(termMonths) || 36));

  const monthlyRate = r / 12;
  let maxPrincipal = 0;

  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, n);
    maxPrincipal = pmt * ((factor - 1) / (monthlyRate * factor));
  } else {
    maxPrincipal = pmt * n;
  }

  const totalPaid = pmt * n;
  const totalInterest = Math.max(0, totalPaid - maxPrincipal);

  return {
    maxMonthlyPayment: pmt,
    annualInterestRate: r,
    termMonths: n,
    maxPrincipal: Math.round(maxPrincipal * 100) / 100,
    totalFinancingCost: Math.round(totalPaid * 100) / 100,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
  };
}

/**
 * Computes borrowing power across standard loan scenarios (Mortgage 20y, Auto 5y, Personal 3y).
 * @param {number} availableMonthlyPayment
 * @returns {Array<Object>} Scenario comparisons
 */
export function estimateBorrowingScenarios(availableMonthlyPayment = 400) {
  const scenarios = [
    {
      id: 'PERSONAL',
      label: 'Préstamo Personal (3 Años)',
      icon: '🤝',
      rate: 0.14,
      termMonths: 36,
    },
    {
      id: 'AUTO',
      label: 'Crédito Automotriz (5 Años)',
      icon: '🚗',
      rate: 0.09,
      termMonths: 60,
    },
    {
      id: 'MORTGAGE',
      label: 'Hipoteca Inmobiliaria (20 Años)',
      icon: '🏠',
      rate: 0.075,
      termMonths: 240,
    },
  ];

  return scenarios.map((s) => {
    const calc = calculateMaxLoanPrincipal({
      maxMonthlyPayment: availableMonthlyPayment,
      annualInterestRate: s.rate,
      termMonths: s.termMonths,
    });

    return {
      ...s,
      ...calc,
    };
  });
}
