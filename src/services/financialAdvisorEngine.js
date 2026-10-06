/**
 * financialAdvisorEngine.js
 * Rule-Based Heuristic Financial Advisory & Health Diagnostic Engine for AuraFinance.
 * Applies time-tested personal finance heuristics (50/30/20, liquidity reserves, savings rate benchmarks,
 * subscription drag, cash-flow stability) completely on-device without cloud dependencies.
 * Zero-Knowledge local processing.
 */

export const ADVICE_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
};

export const PILLAR_STATUS = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

/**
 * Evaluates the user's financial profile and generates comprehensive heuristic advice.
 * @param {Object} params
 * @param {Array<Object>} [params.wallets=[]] - User wallets / accounts
 * @param {Array<Object>} [params.transactions=[]] - User transactions
 * @param {Array<Object>} [params.subscriptions=[]] - Recurring subscriptions
 * @param {number} [params.monthlyIncome=0] - Estimated monthly net income
 * @param {number} [params.monthlyExpenses=0] - Estimated monthly total expenses
 * @param {number} [params.monthlyFixedExpenses=0] - Essential fixed expenses (rent, utilities, food)
 * @param {number} [params.monthlyDiscretionaryExpenses=0] - Non-essential discretionary expenses
 * @returns {Object} Comprehensive advisory report
 */
export function generateFinancialAdvice({
  wallets = [],
  transactions = [],
  subscriptions = [],
  monthlyIncome = 0,
  monthlyExpenses = 0,
  monthlyFixedExpenses = 0,
  monthlyDiscretionaryExpenses = 0,
} = {}) {
  const liquid = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const income = Number(monthlyIncome) || 0;
  const expense = Number(monthlyExpenses) || 0;
  const fixed = Number(monthlyFixedExpenses) || (expense > 0 ? expense * 0.55 : 0);
  const discretionary = Number(monthlyDiscretionaryExpenses) || (expense > 0 ? expense * 0.45 : 0);

  // Calculate Subscription Cost
  const subscriptionMonthlyCost = subscriptions
    .filter((s) => s.status !== 'paused' && s.status !== 'cancelled')
    .reduce((sum, s) => {
      const amt = Number(s.amount) || 0;
      return sum + (s.frequency === 'annual' ? amt / 12 : amt);
    }, 0);

  // 1. Savings Rate (%)
  const netSavings = income - expense;
  const savingsRatePct = income > 0 ? Math.round((netSavings / income) * 100) : 0;

  // 2. Emergency Fund Runway (Months of fixed expenses)
  const monthlyBurn = fixed > 0 ? fixed : (expense > 0 ? expense : 1000);
  const emergencyMonths = liquid > 0 ? Math.round((liquid / monthlyBurn) * 10) / 10 : 0;

  // 3. Fixed Commitment Ratio (%)
  const fixedRatioPct = income > 0 ? Math.round((fixed / income) * 100) : 0;

  // 4. Subscription Burden Ratio (%)
  const subscriptionBurdenPct = income > 0 ? Math.round((subscriptionMonthlyCost / income) * 100 * 10) / 10 : 0;

  // 5. Build Pillars
  const pillars = {
    savingsRate: {
      key: 'savingsRate',
      label: 'Tasa de Ahorro Mensual',
      value: `${savingsRatePct}%`,
      numericValue: savingsRatePct,
      benchmark: '≥ 20%',
      status: savingsRatePct >= 20 ? PILLAR_STATUS.EXCELLENT : savingsRatePct >= 10 ? PILLAR_STATUS.GOOD : savingsRatePct >= 0 ? PILLAR_STATUS.WARNING : PILLAR_STATUS.CRITICAL,
      score: Math.min(100, Math.max(0, (savingsRatePct + 10) * 3.3)),
    },
    emergencyFund: {
      key: 'emergencyFund',
      label: 'Colchón de Emergencia (Meses)',
      value: `${emergencyMonths} meses`,
      numericValue: emergencyMonths,
      benchmark: '3 - 6 meses',
      status: emergencyMonths >= 6 ? PILLAR_STATUS.EXCELLENT : emergencyMonths >= 3 ? PILLAR_STATUS.GOOD : emergencyMonths >= 1 ? PILLAR_STATUS.WARNING : PILLAR_STATUS.CRITICAL,
      score: Math.min(100, Math.max(0, emergencyMonths * 16.6)),
    },
    fixedExpenses: {
      key: 'fixedExpenses',
      label: 'Compromisos Fijos / Ingresos',
      value: `${fixedRatioPct}%`,
      numericValue: fixedRatioPct,
      benchmark: '≤ 50%',
      status: fixedRatioPct <= 45 ? PILLAR_STATUS.EXCELLENT : fixedRatioPct <= 55 ? PILLAR_STATUS.GOOD : fixedRatioPct <= 70 ? PILLAR_STATUS.WARNING : PILLAR_STATUS.CRITICAL,
      score: Math.min(100, Math.max(0, (100 - fixedRatioPct) * 1.5)),
    },
    subscriptionLoad: {
      key: 'subscriptionLoad',
      label: 'Carga de Suscripciones',
      value: `${subscriptionBurdenPct}%`,
      numericValue: subscriptionBurdenPct,
      benchmark: '≤ 5%',
      status: subscriptionBurdenPct <= 3 ? PILLAR_STATUS.EXCELLENT : subscriptionBurdenPct <= 6 ? PILLAR_STATUS.GOOD : subscriptionBurdenPct <= 10 ? PILLAR_STATUS.WARNING : PILLAR_STATUS.CRITICAL,
      score: Math.min(100, Math.max(0, (10 - subscriptionBurdenPct) * 10)),
    },
  };

  // Overall Financial Health Score (Weighted average 0 - 100)
  const healthScore = Math.round(
    pillars.savingsRate.score * 0.35 +
    pillars.emergencyFund.score * 0.35 +
    pillars.fixedExpenses.score * 0.20 +
    pillars.subscriptionLoad.score * 0.10
  );

  // Heuristic Rule Evaluation & Advice Generation
  const actionableAdvice = [];
  const keyStrengths = [];
  const topOpportunities = [];

  // Rule 1: Cash Flow Deficit
  if (netSavings < 0) {
    actionableAdvice.push({
      id: 'ADV-DEFICIT-01',
      priority: ADVICE_PRIORITIES.CRITICAL,
      category: 'Flujo de Caja',
      title: 'Déficit mensual activo: Frenar gastos discrecionales',
      impactEstimate: `+${Math.abs(Math.round(netSavings))}/mes`,
      actionText: 'Congelar partidas no esenciales temporalmente',
      explanation: `Tus gastos mensuales superan tus ingresos en $${Math.abs(Math.round(netSavings))}. Aplica una pausa táctica de compras discrecionales para evitar erosionar tu reserva líquida.`,
    });
  } else if (savingsRatePct >= 25) {
    keyStrengths.push(`Tasa de ahorro sobresaliente del ${savingsRatePct}%, muy por encima del estándar recomendado.`);
  }

  // Rule 2: Emergency Fund Sizing
  if (emergencyMonths < 3) {
    const requiredCushion = Math.round((3 - emergencyMonths) * monthlyBurn);
    actionableAdvice.push({
      id: 'ADV-EMERGENCY-02',
      priority: emergencyMonths < 1 ? ADVICE_PRIORITIES.HIGH : ADVICE_PRIORITIES.MEDIUM,
      category: 'Seguridad Financiera',
      title: 'Fondo de Emergencia por debajo del umbral de 3 meses',
      impactEstimate: `Meta de reserva: +$${requiredCushion}`,
      actionText: 'Automatizar transferencia de ahorro mensual',
      explanation: `Tu reserva actual cubre ${emergencyMonths} meses de gastos fijos. Acumular al menos $${requiredCushion} adicionales te protegerá ante cualquier pérdida inesperada de ingresos o avería mayor.`,
    });
  } else if (emergencyMonths >= 6) {
    keyStrengths.push(`Fondo de emergencia blindado (${emergencyMonths} meses de cobertura total).`);
  }

  // Rule 3: Excess Liquidity / Opportunity for Wealth Growth
  if (emergencyMonths >= 6 && netSavings > 200) {
    const surplusInvestable = Math.round(netSavings * 0.6);
    topOpportunities.push({
      id: 'OPP-INVEST-01',
      title: 'Acelerar Interés Compuesto con Aportaciones Periódicas',
      potentialGain: `+$${Math.round(surplusInvestable * 12 * 1.07)} en 1 año (al 7%)`,
      explanation: `Con tu fondo de emergencia completo y un superávit mensual de $${Math.round(netSavings)}, destinar $${surplusInvestable}/mes a instrumentos de inversión diversificados maximizará tu patrimonio a largo plazo.`,
    });
  }

  // Rule 4: High Fixed Commitments Rigidity
  if (fixedRatioPct > 55) {
    actionableAdvice.push({
      id: 'ADV-FIXED-03',
      priority: ADVICE_PRIORITIES.MEDIUM,
      category: 'Estructura de Gastos',
      title: 'Alta rigidez en gastos fijos (>50% de ingresos)',
      impactEstimate: `Optimización del ${fixedRatioPct - 50}% de ingresos`,
      actionText: 'Renegociar contratos de servicios y pólizas',
      explanation: `El ${fixedRatioPct}% de tus ingresos está comprometido en partidas fijas, reduciendo tu flexibilidad ante imprevistos. Comparar tarifas de telefonía, seguros y suministros puede liberar flujo inmediato.`,
    });
  }

  // Rule 5: Subscription Optimization
  if (subscriptions.length >= 4 || subscriptionMonthlyCost > 80) {
    const annualPotential = Math.round(subscriptionMonthlyCost * 12 * 0.2); // ~20% savings via annual plans
    topOpportunities.push({
      id: 'OPP-SUBS-02',
      title: 'Optimización de Suscripciones y Planes Anuales',
      potentialGain: `Ahorro estimado de ~$${annualPotential}/año`,
      explanation: `Actualmente pagas $${Math.round(subscriptionMonthlyCost)}/mes en ${subscriptions.length} suscripciones. Migrar las herramientas esenciales a pagos anuales con descuento puede reducir este coste un 15-20%.`,
    });
  }

  // Fallback advice if everything is in great shape
  if (actionableAdvice.length === 0) {
    actionableAdvice.push({
      id: 'ADV-EXCELLENT-00',
      priority: ADVICE_PRIORITIES.INFO,
      category: 'Optimización Avanzada',
      title: 'Estructura Financiera en Óptimo Equilibrio',
      impactEstimate: 'Mantener consistencia',
      actionText: 'Revisar metas de mediano y largo plazo',
      explanation: 'Tus ratios de ahorro, reservas de emergencia y control de gastos cumplen con los estándares de excelencia de AuraFinance.',
    });
  }

  return {
    healthScore,
    healthTier: healthScore >= 80 ? 'EXCELENTE' : healthScore >= 60 ? 'SALUDABLE' : healthScore >= 40 ? 'ATENCIÓN' : 'CRÍTICO',
    metrics: {
      liquidBalance: Math.round(liquid * 100) / 100,
      monthlyIncome: Math.round(income * 100) / 100,
      monthlyExpenses: Math.round(expense * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      savingsRatePct,
      emergencyMonths,
      fixedRatioPct,
      subscriptionMonthlyCost: Math.round(subscriptionMonthlyCost * 100) / 100,
      subscriptionBurdenPct,
    },
    pillars,
    actionableAdvice,
    keyStrengths,
    topOpportunities,
  };
}
