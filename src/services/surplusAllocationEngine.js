/**
 * surplusAllocationEngine.js
 * Interactive surplus allocator that directs unspent envelope funds into investment and emergency targets.
 * Adheres strictly to Zero-Knowledge and pure functional architecture.
 */

export const SURPLUS_PRESETS = {
  FIRE_GROWTH: {
    id: 'FIRE_GROWTH',
    name: 'Crecimiento FIRE Acelerado',
    icon: '🔥',
    description: '60% Bóveda Inversión Indexada, 30% Fondo de Emergencia, 10% Fondo Libre.',
    splits: [
      { targetKey: 'INVESTMENT', name: 'Inversión Indexada (S&P 500 / Global)', percentage: 60 },
      { targetKey: 'EMERGENCY', name: 'Fondo de Emergencia / Liquidez', percentage: 30 },
      { targetKey: 'LEISURE', name: 'Fondo Recompensa / Libre', percentage: 10 },
    ],
  },
  SAFETY_FIRST: {
    id: 'SAFETY_FIRST',
    name: 'Blindaje y Seguridad',
    icon: '🛡️',
    description: '70% Fondo de Emergencia, 20% Inversión Conservadora, 10% Reserva.',
    splits: [
      { targetKey: 'EMERGENCY', name: 'Fondo de Emergencia / Liquidez', percentage: 70 },
      { targetKey: 'INVESTMENT', name: 'Inversión Conservadora', percentage: 20 },
      { targetKey: 'LEISURE', name: 'Reserva de Corto Plazo', percentage: 10 },
    ],
  },
  BALANCED_WEALTH: {
    id: 'BALANCED_WEALTH',
    name: 'Equilibrio Patrimonial',
    icon: '⚖️',
    description: '45% Inversión, 40% Fondo de Emergencia, 15% Metas Personales.',
    splits: [
      { targetKey: 'INVESTMENT', name: 'Bóveda de Inversión', percentage: 45 },
      { targetKey: 'EMERGENCY', name: 'Fondo de Emergencia', percentage: 40 },
      { targetKey: 'LEISURE', name: 'Metas & Proyectos Personales', percentage: 15 },
    ],
  },
};

/**
 * Calculates total surplus available across all active envelopes in a given month.
 * @param {Array} budgets - List of envelope budgets
 * @param {Array} transactions - List of transactions
 * @param {string} [monthKey] - YYYY-MM
 * @returns {Object} { totalSurplus, totalAllocated, totalSpent, surplusEnvelopes }
 */
export function calculateAvailableSurplus(budgets = [], transactions = [], monthKey = null) {
  const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

  const monthExpenses = (transactions || []).filter(t => {
    if (!t || t.deleted || t.isDeleted || t.type !== 'expense') return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === targetMonth;
  });

  const actualByCategory = {};
  monthExpenses.forEach(t => {
    const cat = t.category || 'General';
    const amt = Math.abs(Number(t.amount)) || 0;
    actualByCategory[cat] = (actualByCategory[cat] || 0) + amt;
  });

  const activeBudgets = (budgets || []).filter(b => !b.isDeleted && b.isActive !== false);

  let totalAllocated = 0;
  let totalSpent = 0;
  let totalSurplus = 0;
  const surplusEnvelopes = [];

  activeBudgets.forEach(b => {
    const allocated = Number(b.allocated || b.limit || b.amount) || 0;
    const category = b.category || b.name || 'General';
    const actual = actualByCategory[category] || 0;
    const surplus = allocated - actual;

    totalAllocated += allocated;
    totalSpent += actual;

    if (surplus > 0) {
      totalSurplus += surplus;
      surplusEnvelopes.push({
        id: b.id,
        name: b.name || category,
        category,
        allocated,
        actual,
        surplus: Math.round(surplus * 100) / 100,
      });
    }
  });

  return {
    month: targetMonth,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalSurplus: Math.round(totalSurplus * 100) / 100,
    surplusEnvelopes,
  };
}

/**
 * Computes exact monetary amounts allocated to each target split based on percentages.
 * @param {number} totalSurplus - Total surplus amount to allocate
 * @param {Array} splits - Array of { targetKey, name, percentage }
 * @returns {Array} Array of { targetKey, name, percentage, amount }
 */
export function computeSurplusSplits(totalSurplus, splits = []) {
  if (!totalSurplus || totalSurplus <= 0 || !Array.isArray(splits)) return [];

  const totalPercentage = splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
  if (totalPercentage === 0) return [];

  let allocatedSum = 0;
  const computed = splits.map((s, idx) => {
    const isLast = idx === splits.length - 1;
    let amount = Math.round(((totalSurplus * s.percentage) / 100) * 100) / 100;

    // Adjust any cent rounding discrepancies on the last item
    if (isLast) {
      amount = Math.round((totalSurplus - allocatedSum) * 100) / 100;
    } else {
      allocatedSum += amount;
    }

    return {
      ...s,
      amount: Math.max(0, amount),
    };
  });

  return computed;
}

/**
 * Generates double-entry transfer transaction objects for saving the allocated surplus to ledger.
 * @param {Array} computedSplits - Output from computeSurplusSplits
 * @param {string} fromAccountId - Source account (e.g. Cuenta Nómina Principal)
 * @param {Object} targetAccountMap - Map of targetKey to accountId
 * @returns {Array} Transaction payloads ready for addTransaction
 */
export function generateSurplusTransferPayloads(computedSplits = [], fromAccountId, targetAccountMap = {}) {
  const payloads = [];
  const dateStr = new Date().toISOString().slice(0, 10);

  computedSplits.forEach(split => {
    if (split.amount <= 0) return;
    const toAccountId = targetAccountMap[split.targetKey] || targetAccountMap['DEFAULT'] || fromAccountId;

    payloads.push({
      type: 'transfer',
      concept: `Excedente Presupuestario: ${split.name}`,
      description: `Asignación automática de superávit mensual hacia ${split.name}`,
      amount: split.amount,
      date: dateStr,
      fromAccountId,
      toAccountId,
      category: 'Inversión & Ahorro',
      tags: ['#Excedente', '#Ahorro', `#${split.targetKey}`],
    });
  });

  return payloads;
}
