/**
 * Motor de Métricas del Dashboard (Dashboard KPI Engine)
 * Calcula ingresos, gastos, flujo neto de caja, tasa de ahorro y runway financiero.
 */

export function calculateDashboardMetrics({
  accounts = [],
  balances = {},
  transactions = [],
  period = 'THIS_MONTH', // 'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL'
}) {
  const now = new Date();
  const currentMonthPrefix = now.toISOString().slice(0, 7); // 'YYYY-MM'
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  // 1. Filtrar transacciones según el periodo
  const periodTxs = transactions.filter((tx) => {
    if (period === 'THIS_MONTH') {
      return tx.date && tx.date.startsWith(currentMonthPrefix);
    }
    if (period === 'LAST_30_DAYS') {
      return tx.date && tx.date >= thirtyDaysAgoStr;
    }
    return true; // 'ALL'
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeTxCount = 0;
  let expenseTxCount = 0;

  for (const tx of periodTxs) {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'INCOME') {
      totalIncome += amt;
      incomeTxCount++;
    } else if (tx.type === 'EXPENSE') {
      totalExpenses += amt;
      expenseTxCount++;
    }
  }

  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const netCashFlow = Math.round((totalIncome - totalExpenses) * 100) / 100;

  // 2. Tasa de Ahorro reactiva (% Savings Rate)
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10;
  } else if (totalExpenses > 0) {
    savingsRate = -100;
  }

  let savingsTier = 'HEALTHY';
  if (savingsRate >= 30) {
    savingsTier = 'EXCELLENT';
  } else if (savingsRate >= 15) {
    savingsTier = 'HEALTHY';
  } else if (savingsRate >= 0) {
    savingsTier = 'TIGHT';
  } else {
    savingsTier = 'DEFICIT';
  }

  // 3. Liquidez inmediata total disponible
  const liquidCash = accounts
    .filter((a) => a.category === 'BANK' || a.category === 'CASH')
    .reduce((sum, acc) => sum + (balances[acc.id] !== undefined ? Math.max(0, balances[acc.id]) : 0), 0);

  // 4. Estimación de meses de runway
  const daysInPeriod = period === 'THIS_MONTH' ? Math.max(now.getDate(), 1) : 30;
  const dailyBurn = totalExpenses > 0 ? totalExpenses / daysInPeriod : 0;
  const monthlyProjectedExpense = dailyBurn * 30;
  const runwayMonths =
    monthlyProjectedExpense > 0
      ? Math.round((liquidCash / monthlyProjectedExpense) * 10) / 10
      : (liquidCash > 0 ? 12 : 0);

  return {
    period,
    totalIncome,
    totalExpenses,
    incomeTxCount,
    expenseTxCount,
    netCashFlow,
    savingsRate,
    savingsTier,
    liquidCash: Math.round(liquidCash * 100) / 100,
    dailyBurn: Math.round(dailyBurn * 100) / 100,
    runwayMonths,
    periodTxCount: periodTxs.length,
    recentTransactions: transactions.slice(0, 5),
  };
}
