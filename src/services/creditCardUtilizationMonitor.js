/**
 * creditCardUtilizationMonitor.js
 * Credit Card Utilization & Credit Score Shield Monitor for AuraFinance.
 * Tracks individual and aggregate revolving credit usage against 30% and 10% safety thresholds.
 * Computes exact repayment targets to maximize credit score rating and prevent credit bureau penalties.
 * Zero-Knowledge local processing.
 */

export const UTILIZATION_TIERS = {
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excelente / Óptimo',
    maxPct: 10,
    color: '#10b981',
    scoreImpact: 'Impacto altamente positivo en puntuación crediticia (+FICO Score).',
  },
  GOOD: {
    key: 'GOOD',
    label: 'Bueno / Saludable',
    maxPct: 30,
    color: '#3b82f6',
    scoreImpact: 'Nivel seguro. Sin penalizaciones en buró de crédito.',
  },
  HIGH_UTILIZATION: {
    key: 'HIGH_UTILIZATION',
    label: 'Uso Elevado / Precaución',
    maxPct: 50,
    color: '#f59e0b',
    scoreImpact: 'Puede reducir tu calificación crediticia entre 10 y 30 puntos.',
  },
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Riesgo Crítico / Saturación',
    maxPct: 100,
    color: '#ef4444',
    scoreImpact: 'Alerta de sobreendeudamiento: Penalización severa en scoring crediticio (>40 puntos).',
  },
};

/**
 * Evaluates utilization metrics and required paydown targets for a single card.
 * @param {Object} card - { id, name, balance, limit, apr }
 * @returns {Object} Enriched card report
 */
export function evaluateCardUtilization(card = {}) {
  const balance = Math.max(0, Number(card.balance || card.principalBalance) || 0);
  const limit = Math.max(1, Number(card.limit || card.creditLimit) || 1);

  const utilizationPct = Math.min(100, Math.round((balance / limit) * 1000) / 10);
  const availableCredit = Math.max(0, Math.round((limit - balance) * 100) / 100);

  // Paydown required to reach 30% and 10%
  const target30Balance = limit * 0.30;
  const paydownTo30 = Math.max(0, Math.round((balance - target30Balance) * 100) / 100);

  const target10Balance = limit * 0.10;
  const paydownTo10 = Math.max(0, Math.round((balance - target10Balance) * 100) / 100);

  let tier = UTILIZATION_TIERS.CRITICAL;
  if (utilizationPct <= UTILIZATION_TIERS.EXCELLENT.maxPct) {
    tier = UTILIZATION_TIERS.EXCELLENT;
  } else if (utilizationPct <= UTILIZATION_TIERS.GOOD.maxPct) {
    tier = UTILIZATION_TIERS.GOOD;
  } else if (utilizationPct <= UTILIZATION_TIERS.HIGH_UTILIZATION.maxPct) {
    tier = UTILIZATION_TIERS.HIGH_UTILIZATION;
  }

  return {
    id: card.id,
    name: card.name || 'Tarjeta de Crédito',
    balance,
    limit,
    availableCredit,
    utilizationPct,
    paydownTo30,
    paydownTo10,
    tier,
    isOver30: utilizationPct > 30,
    isOver50: utilizationPct > 50,
  };
}

/**
 * Evaluates the entire credit card portfolio utilization and creates an optimal paydown plan.
 * @param {Array<Object>} cards
 * @returns {Object} Aggregate revolving credit utilization report
 */
export function monitorCreditCardUtilization(cards = []) {
  const evaluatedCards = (cards || []).map((c) => evaluateCardUtilization(c));

  if (evaluatedCards.length === 0) {
    return {
      cardsCount: 0,
      totalBalance: 0,
      totalLimit: 0,
      totalAvailableCredit: 0,
      overallUtilizationPct: 0,
      overallTier: UTILIZATION_TIERS.EXCELLENT,
      totalPaydownTo30: 0,
      totalPaydownTo10: 0,
      cardsOver30Count: 0,
      cardsOver50Count: 0,
      actionPlan: [],
      cards: [],
    };
  }

  let totalBalance = 0;
  let totalLimit = 0;
  let totalPaydownTo30 = 0;
  let totalPaydownTo10 = 0;
  let cardsOver30Count = 0;
  let cardsOver50Count = 0;

  evaluatedCards.forEach((c) => {
    totalBalance += c.balance;
    totalLimit += c.limit;
    totalPaydownTo30 += c.paydownTo30;
    totalPaydownTo10 += c.paydownTo10;
    if (c.isOver30) cardsOver30Count++;
    if (c.isOver50) cardsOver50Count++;
  });

  const overallUtilizationPct = totalLimit > 0
    ? Math.min(100, Math.round((totalBalance / totalLimit) * 1000) / 10)
    : 0;
  const totalAvailableCredit = Math.max(0, Math.round((totalLimit - totalBalance) * 100) / 100);

  let overallTier = UTILIZATION_TIERS.CRITICAL;
  if (overallUtilizationPct <= UTILIZATION_TIERS.EXCELLENT.maxPct) {
    overallTier = UTILIZATION_TIERS.EXCELLENT;
  } else if (overallUtilizationPct <= UTILIZATION_TIERS.GOOD.maxPct) {
    overallTier = UTILIZATION_TIERS.GOOD;
  } else if (overallUtilizationPct <= UTILIZATION_TIERS.HIGH_UTILIZATION.maxPct) {
    overallTier = UTILIZATION_TIERS.HIGH_UTILIZATION;
  }

  // Generate prioritized action plan
  const actionPlan = [];
  const saturatedCards = [...evaluatedCards]
    .filter((c) => c.paydownTo30 > 0)
    .sort((a, b) => b.utilizationPct - a.utilizationPct);

  saturatedCards.forEach((c) => {
    actionPlan.push({
      cardId: c.id,
      cardName: c.name,
      currentUtilization: `${c.utilizationPct}%`,
      recommendedPaydown: c.paydownTo30,
      targetUtilization: '30%',
      instruction: `Abona $${c.paydownTo30.toFixed(2)} en ${c.name} para reducir su uso del ${c.utilizationPct}% al límite seguro del 30%.`,
    });
  });

  return {
    cardsCount: evaluatedCards.length,
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalLimit: Math.round(totalLimit * 100) / 100,
    totalAvailableCredit,
    overallUtilizationPct,
    overallTier,
    totalPaydownTo30: Math.round(totalPaydownTo30 * 100) / 100,
    totalPaydownTo10: Math.round(totalPaydownTo10 * 100) / 100,
    cardsOver30Count,
    cardsOver50Count,
    actionPlan,
    cards: evaluatedCards,
  };
}
