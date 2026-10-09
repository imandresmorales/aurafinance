/**
 * maxInstallmentAdvisorEngine.js
 * 
 * Motor de asesoramiento para cálculo de cuota mensual máxima recomendada
 * y capacidad de endeudamiento responsable antes de contraer créditos de largo plazo.
 * Implementa análisis basado en DTI (Debt-to-Income), flujo de caja libre,
 * simulador de valor presente de préstamo según plazo y tasa, y pruebas de estrés.
 */

export const DTI_THRESHOLDS = {
  CONSERVATIVE: 0.28, // 28% ratio tradicional conservador
  MODERATE: 0.35,     // 35% estándar bancario global
  MAXIMUM: 0.40       // 40% techo de riesgo máximo
};

/**
 * Calcula la cuota mensual máxima segura basada en ingresos, deudas y gastos fijos.
 * 
 * @param {Object} params
 * @param {number} params.monthlyIncome - Ingreso mensual neto demostrable
 * @param {number} [params.existingDebtPayments=0] - Pagos mensuales actuales de deudas
 * @param {number} [params.fixedExpenses=0] - Gastos fijos esenciales (alimentación, vivienda, servicios)
 * @param {number} [params.dtiTier='MODERATE'] - Nivel de agresividad DTI ('CONSERVATIVE' | 'MODERATE' | 'MAXIMUM')
 * @param {number} [params.safetyBufferRatio=0.20] - Porcentaje de flujo libre a reservar como colchón de seguridad (default 20%)
 * @returns {Object} Diagnóstico de capacidad y cuotas máximas
 */
export function calculateMaxSafeInstallment({
  monthlyIncome = 0,
  existingDebtPayments = 0,
  fixedExpenses = 0,
  dtiTier = 'MODERATE',
  safetyBufferRatio = 0.20
} = {}) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const currentDebt = Math.max(0, Number(existingDebtPayments) || 0);
  const expenses = Math.max(0, Number(fixedExpenses) || 0);
  const buffer = Math.min(0.9, Math.max(0, Number(safetyBufferRatio) || 0.20));

  if (income <= 0) {
    return {
      monthlyIncome: 0,
      currentDtiPercent: 0,
      status: 'CRITICAL_OVERBURDENED',
      maxInstallmentDti: 0,
      maxInstallmentCashFlow: 0,
      recommendedMaxInstallment: 0,
      disposableIncome: 0,
      safetyBufferAmount: 0,
      tiers: {
        conservative: 0,
        moderate: 0,
        maximum: 0
      },
      recommendations: ['Ingresa un nivel de ingresos netos positivo para calcular tu capacidad crediticia.']
    };
  }

  const currentDtiPercent = (currentDebt / income) * 100;
  const disposableIncome = Math.max(0, income - currentDebt - expenses);
  const safetyBufferAmount = disposableIncome * buffer;
  const cashFlowMaxInstallment = Math.max(0, disposableIncome - safetyBufferAmount);

  // Cuota máxima por cada nivel DTI
  const calcDtiCeiling = (ratio) => Math.max(0, (income * ratio) - currentDebt);

  const conservativeLimit = calcDtiCeiling(DTI_THRESHOLDS.CONSERVATIVE);
  const moderateLimit = calcDtiCeiling(DTI_THRESHOLDS.MODERATE);
  const maximumLimit = calcDtiCeiling(DTI_THRESHOLDS.MAXIMUM);

  const targetTierRatio = DTI_THRESHOLDS[dtiTier] || DTI_THRESHOLDS.MODERATE;
  const targetDtiLimit = calcDtiCeiling(targetTierRatio);

  // La cuota recomendada es el mínimo entre el límite regulatorio/DTI y el flujo de caja real
  const recommendedMaxInstallment = Math.min(targetDtiLimit, cashFlowMaxInstallment);

  // Evaluación de estado financiero
  let status = 'EXCELLENT_CAPACITY';
  if (currentDtiPercent >= 40 || disposableIncome <= 0) {
    status = 'CRITICAL_OVERBURDENED';
  } else if (currentDtiPercent >= 30 || recommendedMaxInstallment < income * 0.05) {
    status = 'TIGHT_CAPACITY';
  } else if (currentDtiPercent >= 15) {
    status = 'MODERATE_CAPACITY';
  }

  // Recomendaciones accionables
  const recommendations = [];
  if (currentDtiPercent > 35) {
    recommendations.push(`Tu endeudamiento actual (${currentDtiPercent.toFixed(1)}%) supera el 35%. Es prioritario amortizar pasivos antes de adquirir nuevos compromisos.`);
  } else if (currentDtiPercent > 20) {
    recommendations.push(`Tu nivel de endeudamiento es moderado (${currentDtiPercent.toFixed(1)}%). Mantén las nuevas cuotas dentro del límite conservador.`);
  } else {
    recommendations.push(`Excelente perfil de endeudamiento (${currentDtiPercent.toFixed(1)}%). Cuentas con holgura para financiamientos estructurados.`);
  }

  if (cashFlowMaxInstallment < targetDtiLimit) {
    recommendations.push(`Tus gastos fijos restringen tu flujo libre. La cuota recomendada se ajustó a $${recommendedMaxInstallment.toFixed(2)} para proteger tu colchón de seguridad.`);
  }

  return {
    monthlyIncome: income,
    currentDebtPayments: currentDebt,
    fixedExpenses: expenses,
    currentDtiPercent: Number(currentDtiPercent.toFixed(2)),
    status,
    maxInstallmentDti: Number(targetDtiLimit.toFixed(2)),
    maxInstallmentCashFlow: Number(cashFlowMaxInstallment.toFixed(2)),
    recommendedMaxInstallment: Number(recommendedMaxInstallment.toFixed(2)),
    disposableIncome: Number(disposableIncome.toFixed(2)),
    safetyBufferAmount: Number(safetyBufferAmount.toFixed(2)),
    tiers: {
      conservative: Number(Math.min(conservativeLimit, cashFlowMaxInstallment).toFixed(2)),
      moderate: Number(Math.min(moderateLimit, cashFlowMaxInstallment).toFixed(2)),
      maximum: Number(Math.min(maximumLimit, cashFlowMaxInstallment).toFixed(2))
    },
    recommendations
  };
}

/**
 * Simula la capacidad total de préstamo (Principal) alcanzable según la cuota recomendada.
 * 
 * @param {Object} params
 * @param {number} params.monthlyInstallment - Cuota mensual que se puede destinar
 * @param {number} params.annualInterestRate - Tasa de interés anual (APR ej: 12.5 para 12.5%)
 * @param {Array<number>} [params.termsInMonths=[12, 24, 36, 48, 60, 120, 240, 360]] - Plazos a simular
 * @returns {Array<Object>} Tabla de capacidad de préstamo por plazo
 */
export function simulateBorrowingCapacity({
  monthlyInstallment = 0,
  annualInterestRate = 12,
  termsInMonths = [12, 24, 36, 48, 60, 120, 240, 360]
} = {}) {
  const pmt = Math.max(0, Number(monthlyInstallment) || 0);
  const apr = Math.max(0, Number(annualInterestRate) || 0);
  const monthlyRate = (apr / 100) / 12;

  if (pmt <= 0) {
    return [];
  }

  return termsInMonths.map(months => {
    const n = Math.max(1, Math.round(months));
    let maxPrincipal = 0;
    let totalPaid = pmt * n;
    let totalInterest = 0;

    if (monthlyRate === 0) {
      maxPrincipal = totalPaid;
      totalInterest = 0;
    } else {
      // PV = PMT * (1 - (1 + r)^-n) / r
      maxPrincipal = pmt * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;
      totalInterest = totalPaid - maxPrincipal;
    }

    return {
      termMonths: n,
      termYears: Number((n / 12).toFixed(1)),
      maxPrincipal: Number(maxPrincipal.toFixed(2)),
      monthlyPayment: Number(pmt.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalInterest: Number(Math.max(0, totalInterest).toFixed(2)),
      interestRatioPercent: Number(((totalInterest / totalPaid) * 100).toFixed(1))
    };
  });
}

/**
 * Ejecuta una prueba de estrés sobre la cuota propuesta ante escenarios de pérdida de ingresos o alza de costos.
 * 
 * @param {Object} params
 * @param {number} params.monthlyIncome - Ingreso mensual base
 * @param {number} params.existingDebtPayments - Pagos de deuda actuales
 * @param {number} params.fixedExpenses - Gastos fijos
 * @param {number} params.proposedInstallment - Cuota del crédito proyectado
 * @returns {Object} Resultados de la prueba de estrés
 */
export function stressTestInstallment({
  monthlyIncome = 0,
  existingDebtPayments = 0,
  fixedExpenses = 0,
  proposedInstallment = 0
} = {}) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const debt = Math.max(0, Number(existingDebtPayments) || 0);
  const expenses = Math.max(0, Number(fixedExpenses) || 0);
  const proposed = Math.max(0, Number(proposedInstallment) || 0);

  const totalCommitted = debt + proposed;
  const baseDti = income > 0 ? (totalCommitted / income) * 100 : 0;
  const baseMargin = income - totalCommitted - expenses;

  // Escenarios
  // 1. Pérdida de 15% de ingresos
  const incomeShock15 = income * 0.85;
  const marginShock15 = incomeShock15 - totalCommitted - expenses;
  const dtiShock15 = incomeShock15 > 0 ? (totalCommitted / incomeShock15) * 100 : 0;

  // 2. Aumento de 10% en gastos esenciales por inflación
  const expenseShock10 = expenses * 1.10;
  const marginExpenseShock = income - totalCommitted - expenseShock10;

  // 3. Escenario combinado (10% menos ingresos + 10% más gastos)
  const incomeShock10 = income * 0.90;
  const marginSevere = incomeShock10 - totalCommitted - expenseShock10;

  let resilienceScore = 100;
  if (baseMargin < 0) resilienceScore -= 50;
  if (marginShock15 < 0) resilienceScore -= 25;
  if (marginExpenseShock < 0) resilienceScore -= 15;
  if (marginSevere < 0) resilienceScore -= 10;
  resilienceScore = Math.max(0, resilienceScore);

  let verdict = 'RESISTENTE';
  if (resilienceScore < 40) {
    verdict = 'ALTO_RIESGO';
  } else if (resilienceScore < 75) {
    verdict = 'VULNERABLE';
  }

  return {
    baseDti: Number(baseDti.toFixed(2)),
    baseMargin: Number(baseMargin.toFixed(2)),
    resilienceScore,
    verdict,
    scenarios: {
      incomeDrop15Percent: {
        surplus: Number(marginShock15.toFixed(2)),
        dti: Number(dtiShock15.toFixed(2)),
        isDeficit: marginShock15 < 0
      },
      inflationSurge10Percent: {
        surplus: Number(marginExpenseShock.toFixed(2)),
        isDeficit: marginExpenseShock < 0
      },
      severeCombined: {
        surplus: Number(marginSevere.toFixed(2)),
        isDeficit: marginSevere < 0
      }
    }
  };
}
