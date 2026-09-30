import { normalizeMoney } from '../utils';

export const BUDGET_TIERS = {
  TIER_1_SURVIVAL: 'SURVIVAL', // Necesidades innegociables
  TIER_2_COMFORT: 'COMFORT',   // Estilo de vida estándar
  TIER_3_GROWTH: 'GROWTH',     // Inversión, amortiguador y proyectos
};

export const DEFAULT_TIER_CONFIG = {
  survivalEnvelopes: [
    { id: 't1-housing', name: 'Vivienda & Servicios Básicos', category: 'Vivienda & Servicios', requiredAmount: 1200, icon: '🏠' },
    { id: 't1-food', name: 'Alimentación Esencial', category: 'Alimentación', requiredAmount: 450, icon: '🥑' },
    { id: 't1-transport', name: 'Transporte Mínimo', category: 'Transporte & Movilidad', requiredAmount: 150, icon: '🚗' },
  ],
  comfortEnvelopes: [
    { id: 't2-health', name: 'Salud & Gimnasio', category: 'Salud & Bienestar', requiredAmount: 200, icon: '🩺' },
    { id: 't2-software', name: 'Herramientas de Trabajo & Software', category: 'Software & Cloud', requiredAmount: 150, icon: '💻' },
    { id: 't2-leisure', name: 'Ocio & Restaurantes', category: 'Ocio & Cultura', requiredAmount: 300, icon: '🎭' },
  ],
  growthEnvelopes: [
    { id: 't3-buffer', name: 'Cojín de Ingresos Irregulares (Holding Buffer)', category: 'Inversión & Ahorro', targetPercentage: 40, icon: '🛡️' },
    { id: 't3-invest', name: 'Inversión Indexada & FIRE', category: 'Inversión & Ahorro', targetPercentage: 40, icon: '📈' },
    { id: 't3-projects', name: 'Fondo de Proyectos & Viajes', category: 'Ocio & Cultura', targetPercentage: 20, icon: '✈️' },
  ],
};

/**
 * Calcula la distribución dinámica en cascada para ingresos variables
 * @param {number} actualIncome - Ingreso realizado en el periodo actual
 * @param {Object} [tierConfig] - Configuración de sobres por niveles
 * @returns {Object} Desglose por niveles, sobre asignado y diagnóstico
 */
export function calculateDynamicVariableBudget(actualIncome = 0, tierConfig = DEFAULT_TIER_CONFIG) {
  const normIncome = normalizeMoney(actualIncome);

  const survivalEnvelopes = tierConfig.survivalEnvelopes || DEFAULT_TIER_CONFIG.survivalEnvelopes;
  const comfortEnvelopes = tierConfig.comfortEnvelopes || DEFAULT_TIER_CONFIG.comfortEnvelopes;
  const growthEnvelopes = tierConfig.growthEnvelopes || DEFAULT_TIER_CONFIG.growthEnvelopes;

  const survivalRequired = normalizeMoney(survivalEnvelopes.reduce((s, e) => s + (e.requiredAmount || 0), 0));
  const comfortRequired = normalizeMoney(comfortEnvelopes.reduce((s, e) => s + (e.requiredAmount || 0), 0));

  let remaining = normIncome;
  let activeTier = BUDGET_TIERS.TIER_1_SURVIVAL;

  // 1. Nivel 1: Supervivencia (Cascada prioritaria)
  const tier1Allocated = [];
  const survivalFundingRatio = survivalRequired > 0 ? Math.min(1, remaining / survivalRequired) : 1;

  survivalEnvelopes.forEach((env) => {
    const allocated = normalizeMoney(env.requiredAmount * survivalFundingRatio);
    tier1Allocated.push({
      ...env,
      allocated,
      isFullyFunded: allocated >= env.requiredAmount,
      tier: BUDGET_TIERS.TIER_1_SURVIVAL,
    });
  });

  const totalTier1Allocated = normalizeMoney(tier1Allocated.reduce((s, e) => s + e.allocated, 0));
  remaining = normalizeMoney(Math.max(0, remaining - totalTier1Allocated));

  // 2. Nivel 2: Confort & Estabilidad
  const tier2Allocated = [];
  let totalTier2Allocated = 0;

  if (totalTier1Allocated >= survivalRequired && remaining > 0) {
    activeTier = BUDGET_TIERS.TIER_2_COMFORT;
    const comfortFundingRatio = comfortRequired > 0 ? Math.min(1, remaining / comfortRequired) : 1;

    comfortEnvelopes.forEach((env) => {
      const allocated = normalizeMoney(env.requiredAmount * comfortFundingRatio);
      tier2Allocated.push({
        ...env,
        allocated,
        isFullyFunded: allocated >= env.requiredAmount,
        tier: BUDGET_TIERS.TIER_2_COMFORT,
      });
      totalTier2Allocated += allocated;
    });

    totalTier2Allocated = normalizeMoney(totalTier2Allocated);
    remaining = normalizeMoney(Math.max(0, remaining - totalTier2Allocated));
  } else {
    comfortEnvelopes.forEach((env) => {
      tier2Allocated.push({
        ...env,
        allocated: 0,
        isFullyFunded: false,
        tier: BUDGET_TIERS.TIER_2_COMFORT,
      });
    });
  }

  // 3. Nivel 3: Crecimiento, Buffer e Inversión (Excedentes de meses extraordinarios)
  const tier3Allocated = [];
  let totalTier3Allocated = 0;

  if (totalTier1Allocated >= survivalRequired && totalTier2Allocated >= comfortRequired && remaining > 0) {
    activeTier = BUDGET_TIERS.TIER_3_GROWTH;

    growthEnvelopes.forEach((env) => {
      const pct = (env.targetPercentage || 33.33) / 100;
      const allocated = normalizeMoney(remaining * pct);
      tier3Allocated.push({
        ...env,
        allocated,
        tier: BUDGET_TIERS.TIER_3_GROWTH,
      });
      totalTier3Allocated += allocated;
    });

    totalTier3Allocated = normalizeMoney(totalTier3Allocated);
    remaining = normalizeMoney(Math.max(0, remaining - totalTier3Allocated));
  } else {
    growthEnvelopes.forEach((env) => {
      tier3Allocated.push({
        ...env,
        allocated: 0,
        tier: BUDGET_TIERS.TIER_3_GROWTH,
      });
    });
  }

  const allAllocatedEnvelopes = [...tier1Allocated, ...tier2Allocated, ...tier3Allocated];
  const totalAllocated = normalizeMoney(totalTier1Allocated + totalTier2Allocated + totalTier3Allocated);

  let statusSummary = '';
  if (activeTier === BUDGET_TIERS.TIER_1_SURVIVAL) {
    statusSummary = `Mes de ingresos reducidos ($${normIncome.toFixed(2)}). Priorizando gastos innegociables de supervivencia (${(survivalFundingRatio * 100).toFixed(0)}% cubierto).`;
  } else if (activeTier === BUDGET_TIERS.TIER_2_COMFORT) {
    statusSummary = `Mes estándar equilibrado ($${normIncome.toFixed(2)}). Supervivencia 100% cubierta y nivel de confort en desarrollo.`;
  } else {
    statusSummary = `¡Mes de altos ingresos / Windfall ($${normIncome.toFixed(2)})! Niveles 1 y 2 completamente fondeados; destinando $${totalTier3Allocated.toFixed(2)} a amortiguador e inversiones.`;
  }

  return {
    actualIncome: normIncome,
    totalAllocated,
    unassignedSurplus: remaining,
    activeTier,
    thresholds: {
      survivalRequired,
      comfortRequired,
      fullComfortTarget: normalizeMoney(survivalRequired + comfortRequired),
    },
    tierBreakdown: {
      tier1: { envelopes: tier1Allocated, total: totalTier1Allocated, isFullyFunded: totalTier1Allocated >= survivalRequired },
      tier2: { envelopes: tier2Allocated, total: totalTier2Allocated, isFullyFunded: totalTier2Allocated >= comfortRequired },
      tier3: { envelopes: tier3Allocated, total: totalTier3Allocated },
    },
    allEnvelopes: allAllocatedEnvelopes,
    statusSummary,
  };
}

/**
 * Calcula el tamaño óptimo recomendado para el Cojín de Retención de Ingresos Irregulares
 */
export function calculateIncomeSmoothingBuffer(incomeHistory = [], baselineMonthlyExpense = 1800) {
  if (incomeHistory.length < 2) {
    return {
      recommendedBuffer: normalizeMoney(baselineMonthlyExpense * 3),
      volatilityIndex: 'MODERATE',
      monthlyAverage: normalizeMoney(baselineMonthlyExpense),
    };
  }

  const validIncomes = incomeHistory.map(Number).filter((n) => !isNaN(n) && n > 0);
  const avgIncome = validIncomes.reduce((s, n) => s + n, 0) / validIncomes.length;

  const variance = validIncomes.reduce((s, n) => s + Math.pow(n - avgIncome, 2), 0) / validIncomes.length;
  const standardDev = Math.sqrt(variance);
  const coefficientOfVariation = avgIncome > 0 ? (standardDev / avgIncome) : 0;

  let multiplier = 3;
  let volatilityIndex = 'LOW';

  if (coefficientOfVariation > 0.4) {
    multiplier = 6;
    volatilityIndex = 'HIGH';
  } else if (coefficientOfVariation > 0.2) {
    multiplier = 4.5;
    volatilityIndex = 'MODERATE';
  }

  const recommendedBuffer = normalizeMoney(baselineMonthlyExpense * multiplier);

  return {
    recommendedBuffer,
    volatilityIndex,
    monthlyAverage: normalizeMoney(avgIncome),
    coefficientOfVariation: normalizeMoney(coefficientOfVariation * 100),
    recommendedMonths: multiplier,
  };
}
