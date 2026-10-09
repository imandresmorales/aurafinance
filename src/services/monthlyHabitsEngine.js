/**
 * monthlyHabitsEngine.js
 * Month-over-Month Financial Habits Comparator & Behavioral Insights Engine for AuraFinance.
 * Computes comparative spending shifts, savings rate improvements, personalized kudos,
 * and constructive areas of improvement.
 * Zero-Knowledge local processing.
 */

/**
 * Compares two monthly transaction datasets and generates structured behavioral insights.
 * @param {Array<Object>} currentMonthTx - Current month's transactions
 * @param {Array<Object>} previousMonthTx - Previous month's baseline transactions
 * @param {Object} [options]
 * @param {number} [options.savingsTargetRate=0.20]
 * @returns {Object} Comprehensive habits comparison report
 */
export function compareMonthlyHabits(currentMonthTx = [], previousMonthTx = [], options = {}) {
  const currentSummary = summarizeMonthTransactions(currentMonthTx);
  const previousSummary = summarizeMonthTransactions(previousMonthTx);

  // Overall Financial Deltas
  const expenseDelta = currentSummary.totalExpense - previousSummary.totalExpense;
  const expenseDeltaPercentage = previousSummary.totalExpense > 0
    ? Math.round(((currentSummary.totalExpense - previousSummary.totalExpense) / previousSummary.totalExpense) * 1000) / 10
    : 0;

  const incomeDelta = currentSummary.totalIncome - previousSummary.totalIncome;
  const savingsRateDelta = Math.round((currentSummary.savingsRate - previousSummary.savingsRate) * 10) / 10;
  const netSavingsDelta = currentSummary.netSavings - previousSummary.netSavings;

  // Category Shifts
  const allCategoryKeys = Array.from(
    new Set([...Object.keys(currentSummary.categoryTotals), ...Object.keys(previousSummary.categoryTotals)])
  );

  const categoryShifts = allCategoryKeys.map((category) => {
    const currentAmount = currentSummary.categoryTotals[category] || 0;
    const previousAmount = previousSummary.categoryTotals[category] || 0;
    const diff = currentAmount - previousAmount;
    let percentChange = 0;

    if (previousAmount > 0) {
      percentChange = Math.round(((currentAmount - previousAmount) / previousAmount) * 1000) / 10;
    } else if (currentAmount > 0) {
      percentChange = 100;
    }

    let shiftType = 'STABLE';
    if (previousAmount === 0 && currentAmount > 0) {
      shiftType = 'NEW_EXPENSE';
    } else if (previousAmount > 0 && currentAmount === 0) {
      shiftType = 'ELIMINATED';
    } else if (diff < -5) {
      shiftType = 'REDUCED';
    } else if (diff > 5) {
      shiftType = 'INCREASED';
    }

    return {
      category,
      currentAmount: Math.round(currentAmount * 100) / 100,
      previousAmount: Math.round(previousAmount * 100) / 100,
      diff: Math.round(diff * 100) / 100,
      percentChange,
      shiftType,
      isImprovement: diff < 0,
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Discretionary vs Fixed Shift
  const currentDiscretionaryRatio = currentSummary.totalExpense > 0
    ? Math.round((currentSummary.discretionaryExpense / currentSummary.totalExpense) * 1000) / 10
    : 0;
  const previousDiscretionaryRatio = previousSummary.totalExpense > 0
    ? Math.round((previousSummary.discretionaryExpense / previousSummary.totalExpense) * 1000) / 10
    : 0;
  const discretionaryShift = Math.round((currentDiscretionaryRatio - previousDiscretionaryRatio) * 10) / 10;

  // Generate Kudos (Felicitaciones)
  const kudos = [];
  if (expenseDelta < 0 && previousSummary.totalExpense > 0) {
    kudos.push({
      id: 'kudo-spending-down',
      icon: '🎉',
      title: '¡Menor Gasto Consolidado!',
      text: `Redujiste tu gasto total en un ${Math.abs(expenseDeltaPercentage)}% ($${Math.abs(expenseDelta).toFixed(2)} menos que el mes anterior).`,
    });
  }

  if (savingsRateDelta > 0) {
    kudos.push({
      id: 'kudo-savings-rate-up',
      icon: '🚀',
      title: 'Aumento en Tasa de Ahorro',
      text: `Tu tasa de ahorro subió del ${previousSummary.savingsRate}% al ${currentSummary.savingsRate}% (+${savingsRateDelta}%).`,
    });
  }

  // Top category reductions
  const topReductions = categoryShifts
    .filter((c) => c.shiftType === 'REDUCED' || c.shiftType === 'ELIMINATED')
    .slice(0, 2);

  topReductions.forEach((r) => {
    kudos.push({
      id: `kudo-cat-${r.category}`,
      icon: '🌟',
      title: `Optimización en ${r.category}`,
      text: `Ahorraste $${Math.abs(r.diff).toFixed(2)} (${Math.abs(r.percentChange)}% menos) en ${r.category}.`,
    });
  });

  if (discretionaryShift < -3) {
    kudos.push({
      id: 'kudo-discretionary-control',
      icon: '🛡️',
      title: 'Mayor Disciplina Discrecional',
      text: `Tu proporción de gastos discrecionales bajó del ${previousDiscretionaryRatio}% al ${currentDiscretionaryRatio}%.`,
    });
  }

  // Generate Areas of Improvement (Puntos de Mejora)
  const improvements = [];
  const topIncreases = categoryShifts
    .filter((c) => c.shiftType === 'INCREASED' || c.shiftType === 'NEW_EXPENSE')
    .slice(0, 2);

  topIncreases.forEach((inc) => {
    improvements.push({
      id: `imp-cat-${inc.category}`,
      icon: '⚠️',
      title: `Aumento de Consumo en ${inc.category}`,
      text: `El gasto subió $${inc.diff.toFixed(2)} (+${inc.percentChange}%) en ${inc.category}.`,
      severity: inc.diff > 200 ? 'warning' : 'info',
    });
  });

  if (currentSummary.savingsRate < 10 && currentSummary.totalIncome > 0) {
    improvements.push({
      id: 'imp-low-savings',
      icon: '💡',
      title: 'Oportunidad de Fortalecer Ahorro',
      text: `Tu tasa de ahorro se situó en ${currentSummary.savingsRate}%. Intenta automatizar aportes antes de gastos discrecionales.`,
      severity: 'warning',
    });
  }

  if (discretionaryShift > 5) {
    improvements.push({
      id: 'imp-discretionary-creep',
      icon: '🎯',
      title: 'Crecimiento de Gastos de Ocio/Deseos',
      text: `Los gastos discrecionales crecieron un +${discretionaryShift}% respecto al mes anterior.`,
      severity: 'info',
    });
  }

  // Habits Grade
  let grade = 'GOOD';
  let gradeLabel = 'Buen Control y Equilibrio';
  let gradeColor = '#3b82f6';

  if (expenseDeltaPercentage <= -5 || savingsRateDelta >= 5) {
    grade = 'EXCELLENT';
    gradeLabel = '¡Mes Sobresaliente!';
    gradeColor = '#10b981';
  } else if (expenseDeltaPercentage >= 15 || currentSummary.netSavings < 0) {
    grade = 'NEEDS_ATTENTION';
    gradeLabel = 'Atención a Desvíos';
    gradeColor = '#f59e0b';
  }

  return {
    grade,
    gradeLabel,
    gradeColor,
    currentSummary,
    previousSummary,
    deltas: {
      expenseDelta: Math.round(expenseDelta * 100) / 100,
      expenseDeltaPercentage,
      incomeDelta: Math.round(incomeDelta * 100) / 100,
      savingsRateDelta,
      netSavingsDelta: Math.round(netSavingsDelta * 100) / 100,
      discretionaryShift,
    },
    categoryShifts,
    kudos,
    improvements,
  };
}

/**
 * Summarizes a single month's transactions into income, expenses, categories, and discretionary buckets.
 * @param {Array<Object>} transactions
 * @returns {Object}
 */
export function summarizeMonthTransactions(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  let fixedExpense = 0;
  let discretionaryExpense = 0;
  const categoryTotals = {};

  (transactions || []).forEach((t) => {
    const amount = Math.abs(Number(t.amount) || 0);
    const type = t.type || (Number(t.amount) >= 0 ? 'INCOME' : 'EXPENSE');
    const category = t.category || 'OTHER';

    if (type === 'INCOME') {
      totalIncome += amount;
    } else if (type === 'EXPENSE') {
      totalExpense += amount;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;

      if (t.isDiscretionary === true || (t.isDiscretionary === undefined && ['RESTAURANT', 'SHOPPING', 'ENTERTAINMENT', 'LEISURE'].includes(category))) {
        discretionaryExpense += amount;
      } else {
        fixedExpense += amount;
      }
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.min(100, Math.round((netSavings / totalIncome) * 1000) / 10))
    : 0;

  return {
    transactionCount: transactions.length,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    fixedExpense: Math.round(fixedExpense * 100) / 100,
    discretionaryExpense: Math.round(discretionaryExpense * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRate,
    categoryTotals,
  };
}
