import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics } from '../dashboardMetricsEngine';

describe('Dashboard Metrics Engine', () => {
  const accounts = [
    { id: 'acc-1', category: 'BANK', initialBalance: 5000 },
    { id: 'acc-2', category: 'CASH', initialBalance: 1000 },
  ];
  const balances = { 'acc-1': 5000, 'acc-2': 1000 };

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const transactions = [
    { id: 't1', type: 'INCOME', amount: 3000, date: `${currentMonthStr}-02` },
    { id: 't2', type: 'EXPENSE', amount: 1200, date: `${currentMonthStr}-05` },
    { id: 't3', type: 'EXPENSE', amount: 300, date: `${currentMonthStr}-10` },
  ];

  it('calculates total income, expenses, and savings rate correctly', () => {
    const metrics = calculateDashboardMetrics({
      accounts,
      balances,
      transactions,
      period: 'THIS_MONTH',
    });

    expect(metrics.totalIncome).toBe(3000);
    expect(metrics.totalExpenses).toBe(1500);
    expect(metrics.netCashFlow).toBe(1500);
    // Savings rate = (3000 - 1500) / 3000 = 50.0%
    expect(metrics.savingsRate).toBe(50);
    expect(metrics.savingsTier).toBe('EXCELLENT');
    expect(metrics.liquidCash).toBe(6000);
    expect(metrics.runwayMonths).toBeGreaterThan(0);
  });

  it('handles negative cashflow and assigns DEFICIT tier', () => {
    const deficitTxs = [
      { id: 't1', type: 'INCOME', amount: 500, date: `${currentMonthStr}-02` },
      { id: 't2', type: 'EXPENSE', amount: 1500, date: `${currentMonthStr}-05` },
    ];

    const metrics = calculateDashboardMetrics({
      accounts,
      balances,
      transactions: deficitTxs,
      period: 'THIS_MONTH',
    });

    expect(metrics.netCashFlow).toBe(-1000);
    expect(metrics.savingsRate).toBe(-200);
    expect(metrics.savingsTier).toBe('DEFICIT');
  });
});
