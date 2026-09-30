/**
 * fixedVsDiscretionaryEngine.js
 * Analytical categorization and Fixed Cost Ratio (FCR) evaluation.
 * Classifies spending into Fixed (obligatory) vs Discretionary (flexible) costs.
 * Adheres strictly to Zero-Knowledge and pure functional architecture.
 */

export const FIXED_CATEGORIES = [
  'vivienda', 'vivienda & servicios', 'alquiler / hipoteca', 'electricidad & gas',
  'agua', 'internet & fibra', 'seguros', 'seguro de salud', 'educación', 'software & cloud'
];

export const DISCRETIONARY_CATEGORIES = [
  'ocio & cultura', 'restaurantes & cenas', 'cafeterías', 'delivery & comida rápida',
  'streaming & entretenimiento', 'cine & eventos', 'ropa & estilo', 'viajes & hoteles'
];

/**
 * Classifies an expense transaction as 'FIXED' or 'DISCRETIONARY'.
 * @param {Object} tx - Transaction object
 * @returns {'FIXED'|'DISCRETIONARY'}
 */
export function classifyExpense(tx) {
  if (!tx) return 'DISCRETIONARY';

  const tags = Array.isArray(tx.tags) ? tx.tags.map(t => String(t).toLowerCase()) : [];
  if (tags.some(t => t.includes('fijo') || t.includes('fixed') || t.includes('necesidad'))) {
    return 'FIXED';
  }
  if (tags.some(t => t.includes('discrecional') || t.includes('deseo') || t.includes('variable') || t.includes('ocio'))) {
    return 'DISCRETIONARY';
  }

  const cat = String(tx.category || '').toLowerCase().trim();
  const subCat = String(tx.subCategory || '').toLowerCase().trim();

  const isFixedCat = FIXED_CATEGORIES.some(fc => cat.includes(fc) || subCat.includes(fc));
  if (isFixedCat) return 'FIXED';

  const isDiscretionaryCat = DISCRETIONARY_CATEGORIES.some(dc => cat.includes(dc) || subCat.includes(dc));
  if (isDiscretionaryCat) return 'DISCRETIONARY';

  // Default fallback: Alimentación Supermercado is Fixed, Dining is Discretionary
  if (cat.includes('alimentación') || cat.includes('alimentacion')) {
    if (subCat.includes('supermercado')) return 'FIXED';
    return 'DISCRETIONARY';
  }

  return 'DISCRETIONARY';
}

/**
 * Calculates complete Fixed vs. Discretionary financial breakdown and Fixed Cost Ratio (FCR).
 * @param {Array} transactions - Active transactions list
 * @param {string} [monthKey] - Optional YYYY-MM filter. Defaults to current month.
 * @returns {Object} Comprehensive analysis and metrics
 */
export function calculateFixedVsDiscretionary(transactions = [], monthKey = null) {
  const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

  const monthTx = (transactions || []).filter(t => {
    if (!t || t.deleted || t.isDeleted) return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === targetMonth;
  });

  let totalIncome = 0;
  let fixedTotal = 0;
  let discretionaryTotal = 0;

  const fixedItems = [];
  const discretionaryItems = [];

  monthTx.forEach(t => {
    const amt = Math.abs(Number(t.amount)) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'expense') {
      const classification = classifyExpense(t);
      if (classification === 'FIXED') {
        fixedTotal += amt;
        fixedItems.push({ ...t, amount: amt });
      } else {
        discretionaryTotal += amt;
        discretionaryItems.push({ ...t, amount: amt });
      }
    }
  });

  const totalExpenses = fixedTotal + discretionaryTotal;

  // Fixed Cost Ratio (Benchmark: <= 50% ideal, 50-60% moderate, >60% high risk)
  const fixedCostRatio = totalIncome > 0
    ? Math.round((fixedTotal / totalIncome) * 1000) / 10
    : totalExpenses > 0 ? Math.round((fixedTotal / totalExpenses) * 1000) / 10 : 0;

  const discretionaryRatio = totalIncome > 0
    ? Math.round((discretionaryTotal / totalIncome) * 1000) / 10
    : totalExpenses > 0 ? Math.round((discretionaryTotal / totalExpenses) * 1000) / 10 : 0;

  const fixedExpensePercent = totalExpenses > 0 ? Math.round((fixedTotal / totalExpenses) * 100) : 0;
  const discretionaryExpensePercent = totalExpenses > 0 ? Math.round((discretionaryTotal / totalExpenses) * 100) : 0;

  let healthStatus = 'optimal'; // 'optimal' | 'moderate' | 'critical'
  let recommendation = 'Tus costos fijos representan menos del 50% de tus ingresos, lo que otorga gran resiliencia y capacidad de adaptación.';

  if (fixedCostRatio > 60) {
    healthStatus = 'critical';
    recommendation = 'Alerta: Tus costos fijos superan el 60% de tus ingresos. Reducir compromisos recurrentes aumentará tu margen de seguridad.';
  } else if (fixedCostRatio > 50) {
    healthStatus = 'moderate';
    recommendation = 'Tus costos fijos están en el rango moderado (50-60%). Mantén vigilancia sobre nuevas suscripciones o contratos fijos.';
  }

  return {
    month: targetMonth,
    totalIncome,
    totalExpenses,
    fixedTotal,
    discretionaryTotal,
    fixedCostRatio,
    discretionaryRatio,
    fixedExpensePercent,
    discretionaryExpensePercent,
    healthStatus,
    recommendation,
    fixedItemsCount: fixedItems.length,
    discretionaryItemsCount: discretionaryItems.length,
    topFixed: fixedItems.sort((a, b) => b.amount - a.amount).slice(0, 5),
    topDiscretionary: discretionaryItems.sort((a, b) => b.amount - a.amount).slice(0, 5),
  };
}
