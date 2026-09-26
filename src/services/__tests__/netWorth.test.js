import { describe, it, expect } from 'vitest';
import { calculateNetWorthAnalytics } from '../netWorthEngine';
import { ACCOUNT_TYPES } from '../doubleEntryEngine';

describe('Net Worth Analytics Engine', () => {
  it('calculates net worth, asset classes, and solvency ratios accurately', () => {
    const accounts = [
      { id: 'acc-cash', name: 'Efectivo', type: ACCOUNT_TYPES.ASSET, category: 'CASH', initialBalance: 1000 },
      { id: 'acc-bank', name: 'Banco Nómina', type: ACCOUNT_TYPES.ASSET, category: 'BANK', initialBalance: 5000 },
      { id: 'acc-invest', name: 'Fondos Indexados', type: ACCOUNT_TYPES.INVESTMENT, category: 'INVESTMENT', initialBalance: 15000 },
      { id: 'acc-card', name: 'Tarjeta Crédito', type: ACCOUNT_TYPES.LIABILITY, category: 'CREDIT_CARD', initialBalance: 1000 },
    ];

    const balances = {
      'acc-cash': 1000,
      'acc-bank': 5000,
      'acc-invest': 15000,
      'acc-card': 1000, // Deuda de 1000
    };

    const analytics = calculateNetWorthAnalytics(accounts, balances);

    // Total Assets = 1000 + 5000 + 15000 = 21000
    // Total Liabilities = 1000
    // Net Worth = 20000
    expect(analytics.totalAssets).toBe(21000);
    expect(analytics.totalLiabilities).toBe(1000);
    expect(analytics.netWorth).toBe(20000);
    expect(analytics.liquidAssets).toBe(6000); // 1000 + 5000
    expect(analytics.investmentAssets).toBe(15000);
    expect(analytics.shortTermDebt).toBe(1000);

    // Debt ratio = (1000 / 21000) * 100 = 4.8%
    expect(analytics.debtRatio).toBe(4.8);
    expect(analytics.solvencyStatus).toBe('SOLID');
  });

  it('handles zero liabilities and gives EXCELLENT status', () => {
    const accounts = [
      { id: 'acc-bank', name: 'Banco', type: ACCOUNT_TYPES.ASSET, category: 'BANK', initialBalance: 10000 },
    ];
    const analytics = calculateNetWorthAnalytics(accounts, { 'acc-bank': 10000 });

    expect(analytics.netWorth).toBe(10000);
    expect(analytics.totalLiabilities).toBe(0);
    expect(analytics.debtRatio).toBe(0);
    expect(analytics.solvencyStatus).toBe('EXCELLENT');
  });
});
