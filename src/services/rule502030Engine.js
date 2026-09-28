import { normalizeMoney } from '../utils';

export const PILLAR_TYPES = {
  NEEDS: 'NEEDS',     // 50% Necesidades básicas
  WANTS: 'WANTS',     // 30% Deseos y estilo de vida
  SAVINGS: 'SAVINGS', // 20% Ahorro, inversión y amortización
};

export const DEFAULT_PILLAR_MAPPING = {
  // Necesidades (50%)
  'vivienda & servicios': PILLAR_TYPES.NEEDS,
  'vivienda': PILLAR_TYPES.NEEDS,
  'alimentación': PILLAR_TYPES.NEEDS,
  'supermercado': PILLAR_TYPES.NEEDS,
  'transporte & movilidad': PILLAR_TYPES.NEEDS,
  'transporte': PILLAR_TYPES.NEEDS,
  'salud & bienestar': PILLAR_TYPES.NEEDS,
  'salud': PILLAR_TYPES.NEEDS,
  'servicios básicos': PILLAR_TYPES.NEEDS,
  'electricidad & gas': PILLAR_TYPES.NEEDS,

  // Deseos (30%)
  'ocio & cultura': PILLAR_TYPES.WANTS,
  'ocio': PILLAR_TYPES.WANTS,
  'restaurantes & cenas': PILLAR_TYPES.WANTS,
  'restaurantes': PILLAR_TYPES.WANTS,
  'viajes & hoteles': PILLAR_TYPES.WANTS,
  'viajes': PILLAR_TYPES.WANTS,
  'streaming & entretenimiento': PILLAR_TYPES.WANTS,
  'software & cloud': PILLAR_TYPES.WANTS,
  'ropa & estilo': PILLAR_TYPES.WANTS,
  'compras': PILLAR_TYPES.WANTS,

  // Ahorro e Inversión (20%)
  'inversión & ahorro': PILLAR_TYPES.SAVINGS,
  'inversión': PILLAR_TYPES.SAVINGS,
  'ahorro': PILLAR_TYPES.SAVINGS,
  'fondo de emergencia': PILLAR_TYPES.SAVINGS,
  'fondos indexados': PILLAR_TYPES.SAVINGS,
  'amortización de deuda': PILLAR_TYPES.SAVINGS,
};

/**
 * Obtiene el pilar (NEEDS, WANTS, SAVINGS) correspondiente a una categoría
 */
export function getCategoryPillar(categoryName, customMapping = {}) {
  if (!categoryName) return PILLAR_TYPES.WANTS;
  const key = categoryName.trim().toLowerCase();
  if (customMapping[key]) return customMapping[key];
  if (DEFAULT_PILLAR_MAPPING[key]) return DEFAULT_PILLAR_MAPPING[key];

  // Reglas heurísticas de fallback
  if (key.includes('salud') || key.includes('casa') || key.includes('vivienda') || key.includes('super') || key.includes('comida')) {
    return PILLAR_TYPES.NEEDS;
  }
  if (key.includes('inver') || key.includes('ahorro') || key.includes('fondo') || key.includes('deuda')) {
    return PILLAR_TYPES.SAVINGS;
  }
  return PILLAR_TYPES.WANTS;
}

/**
 * Analiza el desglose 50/30/20 a partir de las transacciones del periodo
 * @param {Array} transactions - Lista de transacciones
 * @param {number} [monthlyIncome] - Ingreso mensual base o deducido de transacciones
 * @param {Object} [customMapping] - Mapeo personalizado categoría -> pilar
 * @returns {Object} Diagnóstico integral de la regla 50/30/20
 */
export function calculateRule502030(transactions = [], monthlyIncome = null, customMapping = {}) {
  // Transacciones activas
  const activeTx = transactions.filter((tx) => !tx.deleted);

  // Calcular ingresos del periodo si no fueron suministrados
  let computedIncome = Number(monthlyIncome) || 0;
  if (!monthlyIncome) {
    computedIncome = activeTx
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }

  let needsSpent = 0;
  let wantsSpent = 0;
  let savingsAllocated = 0;

  activeTx.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'EXPENSE') {
      const pillar = getCategoryPillar(tx.category, customMapping);
      if (pillar === PILLAR_TYPES.NEEDS) needsSpent += amount;
      else if (pillar === PILLAR_TYPES.WANTS) wantsSpent += amount;
      else if (pillar === PILLAR_TYPES.SAVINGS) savingsAllocated += amount;
    } else if (tx.type === 'TRANSFER' && tx.category && tx.category.toLowerCase().includes('invers')) {
      savingsAllocated += amount;
    }
  });

  const totalExpenditure = normalizeMoney(needsSpent + wantsSpent + savingsAllocated);
  const baseForPercentage = computedIncome > 0 ? computedIncome : (totalExpenditure > 0 ? totalExpenditure : 1);

  const needsPct = normalizeMoney((needsSpent / baseForPercentage) * 100);
  const wantsPct = normalizeMoney((wantsSpent / baseForPercentage) * 100);
  const savingsPct = normalizeMoney((savingsAllocated / baseForPercentage) * 100);

  // Metas ideales en base a los ingresos
  const idealNeeds = normalizeMoney(computedIncome * 0.50);
  const idealWants = normalizeMoney(computedIncome * 0.30);
  const idealSavings = normalizeMoney(computedIncome * 0.20);

  // Diagnóstico
  const deviations = {
    needsDelta: normalizeMoney(needsSpent - idealNeeds),
    wantsDelta: normalizeMoney(wantsSpent - idealWants),
    savingsDelta: normalizeMoney(savingsAllocated - idealSavings),
  };

  let status = 'OPTIMAL';
  const recommendations = [];

  if (needsPct > 50) {
    status = 'NEEDS_EXCEEDED';
    recommendations.push(`Tus necesidades representan el ${needsPct}%, superando el 50% recomendado. Revisa suministros o gastos fijos.`);
  }
  if (wantsPct > 30) {
    status = 'WANTS_EXCEEDED';
    recommendations.push(`Tus deseos y ocio alcanzan el ${wantsPct}% (meta: máx 30%). Ajusta salidas y compras prescindibles.`);
  }
  if (savingsPct < 20) {
    recommendations.push(`Tu tasa de ahorro/inversión es del ${savingsPct}%. Incrementa aportes para alcanzar el 20% objetivo.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('¡Excelente distribución financiera! Cumples con los estándares de la regla 50/30/20.');
  }

  return {
    monthlyIncome: normalizeMoney(computedIncome),
    totalExpenditure,
    pillars: {
      needs: {
        spent: normalizeMoney(needsSpent),
        percentage: needsPct,
        idealAmount: idealNeeds,
        idealPercentage: 50,
        isCompliant: needsPct <= 50,
      },
      wants: {
        spent: normalizeMoney(wantsSpent),
        percentage: wantsPct,
        idealAmount: idealWants,
        idealPercentage: 30,
        isCompliant: wantsPct <= 30,
      },
      savings: {
        spent: normalizeMoney(savingsAllocated),
        percentage: savingsPct,
        idealAmount: idealSavings,
        idealPercentage: 20,
        isCompliant: savingsPct >= 20,
      },
    },
    deviations,
    status,
    recommendations,
  };
}
