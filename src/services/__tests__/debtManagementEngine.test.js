import { describe, it, expect } from 'vitest';
import {
  evaluateDebtItem,
  calculateTotalDebtSummary,
  DEBT_TYPES,
} from '../debtManagementEngine';

describe('debtManagementEngine', () => {
  const sampleDebts = [
    {
      id: 'd-1',
      name: 'Tarjeta Visa Oro',
      type: 'CREDIT_CARD',
      principalBalance: 3000,
      originalAmount: 3000,
      interestRate: 0.28, // 28%
      minimumMonthlyPayment: 100,
      creditLimit: 5000,
    },
    {
      id: 'd-2',
      name: 'Préstamo Auto',
      type: 'AUTO_LOAN',
      principalBalance: 12000,
      originalAmount: 18000,
      interestRate: 0.08, // 8%
      minimumMonthlyPayment: 380,
    },
    {
      id: 'd-3',
      name: 'Tarjeta Mastercard',
      type: 'CREDIT_CARD',
      principalBalance: 1500,
      originalAmount: 2000,
      interestRate: 0.22, // 22%
      minimumMonthlyPayment: 60,
      creditLimit: 3000,
    },
    {
      id: 'd-paid',
      name: 'Préstamo Personal Amigo',
      type: 'PERSONAL_LOAN',
      principalBalance: 0, // paid off
      originalAmount: 1000,
      interestRate: 0.0,
      minimumMonthlyPayment: 0,
    },
  ];

  describe('evaluateDebtItem', () => {
    it('evaluates interest costs, revolving utilization and generates warnings', () => {
      const result = evaluateDebtItem(sampleDebts[0]);

      expect(result.principalBalance).toBe(3000);
      expect(result.utilizationRate).toBe(60); // 3000 / 5000 = 60%
      expect(result.monthlyInterestCost).toBe(70); // 3000 * 0.28 / 12 = 70
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.id === 'high-interest')).toBe(true);
      expect(result.warnings.some((w) => w.id === 'high-utilization')).toBe(true);
    });

    it('identifies paid off debt', () => {
      const result = evaluateDebtItem(sampleDebts[3]);
      expect(result.isPaidOff).toBe(true);
      expect(result.monthlyInterestCost).toBe(0);
    });
  });

  describe('calculateTotalDebtSummary', () => {
    it('calculates portfolio totals, weighted interest rate (WACC), and DTI ratio', () => {
      const summary = calculateTotalDebtSummary(sampleDebts, {
        monthlyNetIncome: 3500,
      });

      expect(summary.totalDebtsCount).toBe(4);
      expect(summary.activeDebtsCount).toBe(3);
      expect(summary.paidOffDebtsCount).toBe(1);
      expect(summary.totalOutstanding).toBe(16500); // 3000 + 12000 + 1500
      expect(summary.totalMonthlyMinimum).toBe(540); // 100 + 380 + 60
      expect(summary.debtToIncomeRatio).toBeCloseTo(15.4, 1); // 540 / 3500 * 100

      // WACC: (3000*0.28 + 12000*0.08 + 1500*0.22) / 16500 = (840 + 960 + 330) / 16500 = 2130 / 16500 ≈ 0.1291 (12.91%)
      expect(summary.weightedAverageRatePct).toBeCloseTo(12.9, 1);

      // Revolving utilization: (3000 + 1500) / (5000 + 3000) = 4500 / 8000 = 56.3%
      expect(summary.totalRevolvingUtilization).toBeCloseTo(56.3, 1);

      expect(summary.highestRateDebt.id).toBe('d-1');
      expect(summary.lowestBalanceDebt.id).toBe('d-3');
      expect(summary.breakdownByType.length).toBe(2); // CREDIT_CARD, AUTO_LOAN
    });

    it('handles empty debt portfolio gracefully', () => {
      const summary = calculateTotalDebtSummary([]);
      expect(summary.totalOutstanding).toBe(0);
      expect(summary.weightedAverageRate).toBe(0);
      expect(summary.totalRevolvingUtilization).toBeNull();
      expect(summary.highestRateDebt).toBeNull();
    });
  });
});
