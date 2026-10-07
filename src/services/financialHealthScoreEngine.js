/**
 * financialHealthScoreEngine.js
 * 5-Pillar Financial Health Score Engine (0 - 100 Scale) for AuraFinance.
 * Computes deterministic diagnostic score across Liquidity, Savings Rate, Fixed Cost Overhead, Debt Burden & Flow Stability.
 * Zero-Knowledge local processing.
 */

export const HEALTH_TIERS = {
  AAA_FORTRESS: {
    key: 'AAA_FORTRESS',
    label: 'Fortaleza Financiera AAA',
    minScore: 90,
    color: '#10b981',
    badgeClass: 'tier-fortress',
    description: 'Excelente solvencia, reservas completas y alta capacidad de acumulación patrimonial.',
  },
  AA_HEALTHY: {
    key: 'AA_HEALTHY',
    label: 'Saludable & Solvente',
    minScore: 75,
    color: '#34d399',
    badgeClass: 'tier-healthy',
    description: 'Estructura financiera sólida con colchón de seguridad y ahorro constante.',
  },
  A_STABLE: {
    key: 'A_STABLE',
    label: 'Estable con Oportunidades',
    minScore: 60,
    color: '#38bdf8',
    badgeClass: 'tier-stable',
    description: 'Equilibrio operativo alcanzado, pero con margen de mejora en reservas o costes fijos.',
  },
  B_VULNERABLE: {
    key: 'B_VULNERABLE',
    label: 'Vulnerable ante Shocks',
    minScore: 40,
    color: '#f59e0b',
    badgeClass: 'tier-vulnerable',
    description: 'Margen de maniobra ajustado; riesgo ante retrasos de ingresos o gastos imprevistos.',
  },
  C_CRITICAL: {
    key: 'C_CRITICAL',
    label: 'Riesgo Financiero Crítico',
    minScore: 0,
    color: '#ef4444',
    badgeClass: 'tier-critical',
    description: 'Déficit mensual o ausencia de liquidez de emergencia. Se requiere plan de saneamiento urgente.',
  },
};

/**
 * Evaluates the 5 pillars of personal financial health.
 * @param {Object} params
 * @param {number} params.liquidBalance - Total available cash in liquid checking/wallets
 * @param {number} params.monthlyIncome - Monthly net income
 * @param {number} params.monthlyExpenses - Total monthly expenses
 * @param {number} [params.monthlyFixedExpenses] - Essential fixed expenses (rent, bills, food)
 * @param {number} [params.monthlyDebtServicing=0] - Monthly loan/credit card/mortgage debt payments
 * @param {number} [params.incomeVolatilityPct=0] - Monthly income variance/volatility percentage (0-100)
 * @param {number} [params.previousScore] - Optional previous score to compute delta
 * @returns {Object} Comprehensive 5-pillar health score report
 */
export function calculateFinancialHealthScore({
  liquidBalance = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  monthlyFixedExpenses = null,
  monthlyDebtServicing = 0,
  incomeVolatilityPct = 10,
  previousScore = null,
} = {}) {
  const liquid = Math.max(0, Number(liquidBalance) || 0);
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const expense = Math.max(0, Number(monthlyExpenses) || 0);
  const debt = Math.max(0, Number(monthlyDebtServicing) || 0);

  // If fixed expenses not provided, estimate 55% of expenses
  const fixed = monthlyFixedExpenses !== null && monthlyFixedExpenses !== undefined
    ? Math.max(0, Number(monthlyFixedExpenses))
    : Math.max(0, expense * 0.55);

  const monthlyBurn = fixed > 0 ? fixed : (expense > 0 ? expense : 1000);
  const netSavings = income - expense;

  // -------------------------------------------------------------
  // PILLAR 1: Solvencia & Liquidez (Emergency Runway) - Max 20 pts
  // -------------------------------------------------------------
  const runwayMonths = monthlyBurn > 0 ? liquid / monthlyBurn : (liquid > 0 ? 12 : 0);
  let p1Score = 0;
  if (runwayMonths >= 6) {
    p1Score = 20;
  } else if (runwayMonths >= 3) {
    p1Score = 14 + ((runwayMonths - 3) / 3) * 6; // 14 to 20
  } else if (runwayMonths >= 1) {
    p1Score = 6 + ((runwayMonths - 1) / 2) * 8; // 6 to 14
  } else {
    p1Score = Math.max(0, runwayMonths * 6); // 0 to 6
  }

  // -------------------------------------------------------------
  // PILLAR 2: Tasa de Ahorro & Capacidad de Retención - Max 20 pts
  // -------------------------------------------------------------
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;
  let p2Score = 0;
  if (savingsRate >= 25) {
    p2Score = 20;
  } else if (savingsRate >= 15) {
    p2Score = 15 + ((savingsRate - 15) / 10) * 5; // 15 to 20
  } else if (savingsRate >= 5) {
    p2Score = 8 + ((savingsRate - 5) / 10) * 7; // 8 to 15
  } else if (savingsRate >= 0) {
    p2Score = 4 + (savingsRate / 5) * 4; // 4 to 8
  } else {
    // Deficit
    p2Score = Math.max(0, 4 + savingsRate * 0.2); // drops towards 0
  }

  // -------------------------------------------------------------
  // PILLAR 3: Rigidez de Gastos Fijos (Fixed Cost Ratio) - Max 20 pts
  // -------------------------------------------------------------
  const fixedRatio = income > 0 ? (fixed / income) * 100 : 100;
  let p3Score = 0;
  if (fixedRatio <= 40) {
    p3Score = 20;
  } else if (fixedRatio <= 50) {
    p3Score = 16 + ((50 - fixedRatio) / 10) * 4; // 16 to 20
  } else if (fixedRatio <= 65) {
    p3Score = 8 + ((65 - fixedRatio) / 15) * 8; // 8 to 16
  } else if (fixedRatio <= 85) {
    p3Score = 2 + ((85 - fixedRatio) / 20) * 6; // 2 to 8
  } else {
    p3Score = Math.max(0, (100 - fixedRatio) * 0.1);
  }

  // -------------------------------------------------------------
  // PILLAR 4: Carga y Servicio de Deuda (Debt-to-Income) - Max 20 pts
  // -------------------------------------------------------------
  const debtRatio = income > 0 ? (debt / income) * 100 : 0;
  let p4Score = 0;
  if (debtRatio === 0) {
    p4Score = 20;
  } else if (debtRatio <= 15) {
    p4Score = 16 + ((15 - debtRatio) / 15) * 4; // 16 to 20
  } else if (debtRatio <= 30) {
    p4Score = 9 + ((30 - debtRatio) / 15) * 7; // 9 to 16
  } else if (debtRatio <= 45) {
    p4Score = 3 + ((45 - debtRatio) / 15) * 6; // 3 to 9
  } else {
    p4Score = Math.max(0, (60 - debtRatio) * 0.2);
  }

  // -------------------------------------------------------------
  // PILLAR 5: Estabilidad y Predictibilidad de Flujo - Max 20 pts
  // -------------------------------------------------------------
  const volatility = Math.min(100, Math.max(0, Number(incomeVolatilityPct) || 10));
  let p5Score = 0;
  if (volatility <= 5 && netSavings > 0) {
    p5Score = 20;
  } else if (volatility <= 15) {
    p5Score = 15 + ((15 - volatility) / 10) * 5;
  } else if (volatility <= 30) {
    p5Score = 9 + ((30 - volatility) / 15) * 6;
  } else {
    p5Score = Math.max(2, 9 - ((volatility - 30) / 70) * 7);
  }

  // Round Pillar Scores (0 to 20 each)
  const roundPillar = (num) => Math.round(Math.min(20, Math.max(0, num)) * 10) / 10;
  const pillar1 = roundPillar(p1Score);
  const pillar2 = roundPillar(p2Score);
  const pillar3 = roundPillar(p3Score);
  const pillar4 = roundPillar(p4Score);
  const pillar5 = roundPillar(p5Score);

  const totalScore = Math.round(pillar1 + pillar2 + pillar3 + pillar4 + pillar5);

  // Determine Health Tier
  let tier = HEALTH_TIERS.C_CRITICAL;
  if (totalScore >= HEALTH_TIERS.AAA_FORTRESS.minScore) {
    tier = HEALTH_TIERS.AAA_FORTRESS;
  } else if (totalScore >= HEALTH_TIERS.AA_HEALTHY.minScore) {
    tier = HEALTH_TIERS.AA_HEALTHY;
  } else if (totalScore >= HEALTH_TIERS.A_STABLE.minScore) {
    tier = HEALTH_TIERS.A_STABLE;
  } else if (totalScore >= HEALTH_TIERS.B_VULNERABLE.minScore) {
    tier = HEALTH_TIERS.B_VULNERABLE;
  }

  // Pillars Details Object
  const pillars = {
    liquidity: {
      name: 'Solvencia & Liquidez',
      score: pillar1,
      maxScore: 20,
      percentage: Math.round((pillar1 / 20) * 100),
      currentValue: `${Math.round(runwayMonths * 10) / 10} meses`,
      benchmark: '≥ 6 meses',
      status: pillar1 >= 16 ? 'EXCELLENT' : pillar1 >= 12 ? 'GOOD' : pillar1 >= 7 ? 'WARNING' : 'CRITICAL',
      recommendation: runwayMonths < 3 ? 'Aumentar colchón de seguridad líquido prioritariamente.' : 'Liquidez en nivel adecuado.',
    },
    savingsRate: {
      name: 'Tasa de Ahorro',
      score: pillar2,
      maxScore: 20,
      percentage: Math.round((pillar2 / 20) * 100),
      currentValue: `${Math.round(savingsRate * 10) / 10}%`,
      benchmark: '≥ 20%',
      status: pillar2 >= 16 ? 'EXCELLENT' : pillar2 >= 12 ? 'GOOD' : pillar2 >= 6 ? 'WARNING' : 'CRITICAL',
      recommendation: savingsRate < 10 ? 'Optimizar gastos discrecionales para retener al menos el 15% del ingreso.' : 'Tasa de retención sólida.',
    },
    fixedCosts: {
      name: 'Rigidez de Gastos Fijos',
      score: pillar3,
      maxScore: 20,
      percentage: Math.round((pillar3 / 20) * 100),
      currentValue: `${Math.round(fixedRatio * 10) / 10}%`,
      benchmark: '≤ 50%',
      status: pillar3 >= 16 ? 'EXCELLENT' : pillar3 >= 12 ? 'GOOD' : pillar3 >= 6 ? 'WARNING' : 'CRITICAL',
      recommendation: fixedRatio > 55 ? 'Renegociar contratos fijos para ganar flexibilidad operativa.' : 'Estructura fija bajo control.',
    },
    debtBurden: {
      name: 'Servicio de Deuda',
      score: pillar4,
      maxScore: 20,
      percentage: Math.round((pillar4 / 20) * 100),
      currentValue: `${Math.round(debtRatio * 10) / 10}%`,
      benchmark: '≤ 15%',
      status: pillar4 >= 16 ? 'EXCELLENT' : pillar4 >= 12 ? 'GOOD' : pillar4 >= 6 ? 'WARNING' : 'CRITICAL',
      recommendation: debtRatio > 30 ? 'Priorizar amortización acelerada mediante método avalancha.' : 'Nivel de apalancamiento saludable.',
    },
    flowStability: {
      name: 'Estabilidad de Flujos',
      score: pillar5,
      maxScore: 20,
      percentage: Math.round((pillar5 / 20) * 100),
      currentValue: `${Math.round(volatility)}% var`,
      benchmark: '≤ 15% var',
      status: pillar5 >= 16 ? 'EXCELLENT' : pillar5 >= 12 ? 'GOOD' : pillar5 >= 6 ? 'WARNING' : 'CRITICAL',
      recommendation: volatility > 25 ? 'Crear amortiguador de ingresos variables para suavizar estacionalidad.' : 'Flujo con alta predictibilidad.',
    },
  };

  const delta = previousScore !== null && previousScore !== undefined
    ? totalScore - Number(previousScore)
    : 0;

  return {
    totalScore,
    maxPossibleScore: 100,
    tierKey: tier.key,
    tierLabel: tier.label,
    tierColor: tier.color,
    tierDescription: tier.description,
    badgeClass: tier.badgeClass,
    delta,
    pillars,
    radarDistribution: [
      { pillar: 'Liquidez', score: pillar1, max: 20 },
      { pillar: 'Ahorro', score: pillar2, max: 20 },
      { pillar: 'Gastos Fijos', score: pillar3, max: 20 },
      { pillar: 'Deuda', score: pillar4, max: 20 },
      { pillar: 'Estabilidad', score: pillar5, max: 20 },
    ],
  };
}
