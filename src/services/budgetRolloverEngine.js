/**
 * budgetRolloverEngine.js
 * Smart Monthly Budget Roll-over and Period-End Adjustment Assistant for Zero-Based Envelopes.
 * Adheres strictly to Zero-Knowledge pure functional architecture.
 */

export const ROLLOVER_ACTIONS = {
  ROLLOVER_BALANCE: 'ROLLOVER_BALANCE',   // Carry over unspent funds into the next month's envelope
  RESET_ZERO: 'RESET_ZERO',               // Fresh restart at the standard base allocation
  SWEEP_TO_SAVINGS: 'SWEEP_TO_SAVINGS',   // Sweep surplus into emergency fund / investment vault
  ADAPTIVE_SMART: 'ADAPTIVE_SMART',       // Adjust envelope to 105% of actual recent spending
};

/**
 * Calculates end-of-period envelope balances and computes recommended rollover adjustments.
 * @param {Array} budgets - Current envelope budgets
 * @param {Array} transactions - Transactions history
 * @param {string} closedPeriodKey - YYYY-MM of the period being closed (e.g. '2026-08')
 * @param {string} nextPeriodKey - YYYY-MM of the new period (e.g. '2026-09')
 * @returns {Object} Analytical review of closed period with suggestions
 */
export function calculatePeriodEndAnalysis(
  budgets = [],
  transactions = [],
  closedPeriodKey = null,
  nextPeriodKey = null
) {
  const closedPeriod = closedPeriodKey || new Date().toISOString().slice(0, 7);
  
  // Calculate default next period (add 1 month)
  let nextPeriod = nextPeriodKey;
  if (!nextPeriod) {
    const [y, m] = closedPeriod.split('-').map(Number);
    const nextDate = new Date(y, m, 1); // m is 1-indexed in split, so month index 'm' is the next month
    nextPeriod = nextDate.toISOString().slice(0, 7);
  }

  // Filter closed period expenses
  const closedExpenses = (transactions || []).filter(t => {
    if (!t || t.deleted || t.isDeleted || t.type !== 'expense') return false;
    const tDate = t.date ? String(t.date).slice(0, 7) : '';
    return tDate === closedPeriod;
  });

  // Calculate actual spending per category
  const actualByCategory = {};
  closedExpenses.forEach(t => {
    const cat = t.category || 'General';
    const amt = Math.abs(Number(t.amount)) || 0;
    actualByCategory[cat] = (actualByCategory[cat] || 0) + amt;
  });

  const activeBudgets = (budgets || []).filter(b => !b.isDeleted && b.isActive !== false);

  const envelopeReviews = activeBudgets.map(b => {
    const allocated = Number(b.allocated || b.limit || b.amount) || 0;
    const category = b.category || b.name || 'General';
    const actualSpent = actualByCategory[category] || 0;
    const surplus = allocated - actualSpent; // Positive = savings, Negative = deficit
    const percentSpent = allocated > 0 ? Math.round((actualSpent / allocated) * 100) : 0;

    // Smart Adaptive Recommendation: actual spent + 5% buffer (rounded to nearest 5)
    const smartProposed = Math.max(20, Math.ceil((actualSpent * 1.05) / 5) * 5);

    // Default action: if surplus > 0, default to SWEEP_TO_SAVINGS, otherwise RESET_ZERO
    const defaultAction = surplus > 0 ? ROLLOVER_ACTIONS.SWEEP_TO_SAVINGS : ROLLOVER_ACTIONS.RESET_ZERO;

    return {
      id: b.id,
      name: b.name || category,
      category,
      color: b.color || '#10b981',
      icon: b.icon || '🏷️',
      baseAllocated: allocated,
      actualSpent,
      surplus,
      percentSpent,
      smartProposed,
      selectedAction: defaultAction,
    };
  });

  const totalPreviousBudget = envelopeReviews.reduce((acc, r) => acc + r.baseAllocated, 0);
  const totalPreviousSpent = envelopeReviews.reduce((acc, r) => acc + r.actualSpent, 0);
  const totalNetSurplus = totalPreviousBudget - totalPreviousSpent;
  const totalPositiveSurplus = envelopeReviews
    .filter(r => r.surplus > 0)
    .reduce((acc, r) => acc + r.surplus, 0);

  return {
    closedPeriod,
    nextPeriod,
    totalPreviousBudget,
    totalPreviousSpent,
    totalNetSurplus,
    totalPositiveSurplus,
    envelopes: envelopeReviews,
  };
}

/**
 * Executes rollover policies across all envelopes to produce the updated budget plan for next period.
 * @param {Array} baseBudgets - Existing budget objects
 * @param {Array} envelopeReviews - Envelope review objects with selectedAction and custom allocations
 * @param {string} nextPeriodKey - Target period YYYY-MM
 * @returns {Object} { updatedBudgets: Array, totalSweptToSavings: number, totalAllocatedNextMonth: number }
 */
export function applyPeriodRollover(baseBudgets = [], envelopeReviews = [], nextPeriodKey) {
  let totalSweptToSavings = 0;
  let totalAllocatedNextMonth = 0;

  const reviewMap = new Map();
  envelopeReviews.forEach(r => reviewMap.set(r.id, r));

  const updatedBudgets = baseBudgets.map(b => {
    const review = reviewMap.get(b.id);
    if (!review) return b;

    let newAllocated = review.baseAllocated;

    switch (review.selectedAction) {
      case ROLLOVER_ACTIONS.ROLLOVER_BALANCE:
        // Carry over the surplus into next month's allocation
        newAllocated = Math.max(0, review.baseAllocated + Math.max(0, review.surplus));
        break;

      case ROLLOVER_ACTIONS.SWEEP_TO_SAVINGS:
        // Keep base allocation and sweep unspent surplus
        if (review.surplus > 0) {
          totalSweptToSavings += review.surplus;
        }
        newAllocated = review.baseAllocated;
        break;

      case ROLLOVER_ACTIONS.ADAPTIVE_SMART:
        // Set allocation to recommended smart estimate
        newAllocated = review.smartProposed;
        break;

      case ROLLOVER_ACTIONS.RESET_ZERO:
      default:
        newAllocated = review.baseAllocated;
        break;
    }

    totalAllocatedNextMonth += newAllocated;

    return {
      ...b,
      allocated: Math.round(newAllocated * 100) / 100,
      period: nextPeriodKey,
      updatedAt: Date.now(),
    };
  });

  return {
    updatedBudgets,
    totalSweptToSavings: Math.round(totalSweptToSavings * 100) / 100,
    totalAllocatedNextMonth: Math.round(totalAllocatedNextMonth * 100) / 100,
  };
}
