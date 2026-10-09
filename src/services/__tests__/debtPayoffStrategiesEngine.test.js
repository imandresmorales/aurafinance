import { describe, it, expect } from 'vitest';
import {
  simulatePayoffStrategy,
  compareDebtPayoffStrategies,
} from '../debtPayoffStrategiesEngine';

describe('debtPayoffStrategiesEngine', () => {
  const sampleDebts = [
    {
      id: 'd-card1',
      name: 'Tarjeta Alta Tasa',
      principalBalance: 2000,
      interestRate: 0.26, // 26%
      minimumMonthlyPayment: 60,
    },
    {
      id: 'd-card2',
      name: 'Tarjeta Baja Saldo',
      principalBalance: 500,
      interestRate: 0.18, // 18%
      minimumMonthlyPayment: 25,
    },
    {
      id: 'd-loan',
      name: 'Préstamo Auto',
      principalBalance: 6000,
      interestRate: 0.08, // 8%
      minimumMonthlyPayment: 150,
    },
  ];

  describe('simulatePayoffStrategy', () => {
    it('simulates AVALANCHE strategy prioritizing highest interest rate first', () => {
      const result = simulatePayoffStrategy(sampleDebts, 'AVALANCHE', 200);

      expect(result.monthsToDebtFree).toBeGreaterThan(0);
      expect(result.monthsToDebtFree).toBeLessThan(40);
      expect(result.totalInterestPaid).toBeGreaterThan(0);
      expect(result.payoffOrder.length).toBe(3);

      // In Avalanche, d-card1 (26%) is prioritized over d-loan (8%)
      const card1Index = result.payoffOrder.findIndex((p) => p.debtId === 'd-card1');
      const loanIndex = result.payoffOrder.findIndex((p) => p.debtId === 'd-loan');
      expect(card1Index).toBeLessThan(loanIndex);
    });

    it('simulates SNOWBALL strategy prioritizing lowest balance first', () => {
      const result = simulatePayoffStrategy(sampleDebts, 'SNOWBALL', 200);

      expect(result.payoffOrder.length).toBe(3);
      // In Snowball, d-card2 ($500 balance) MUST be paid off first!
      expect(result.payoffOrder[0].debtId).toBe('d-card2');
    });

    it('handles empty debt list gracefully', () => {
      const result = simulatePayoffStrategy([], 'AVALANCHE', 100);
      expect(result.monthsToDebtFree).toBe(0);
      expect(result.totalPaid).toBe(0);
    });
  });

  describe('compareDebtPayoffStrategies', () => {
    it('compares Avalanche vs Snowball vs Minimum and proves Avalanche mathematical optimality', () => {
      const comparison = compareDebtPayoffStrategies(sampleDebts, 250);

      const { avalanche, snowball, minimumOnly } = comparison.strategies;

      // Avalanche must pay less or equal interest than Snowball
      expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid);
      // Both must pay significantly less interest than paying only minimums
      expect(avalanche.totalInterestPaid).toBeLessThan(minimumOnly.totalInterestPaid);

      expect(comparison.savings.avalancheVsMinimumInterestSaved).toBeGreaterThan(500);
      expect(comparison.savings.avalancheMonthsSaved).toBeGreaterThan(10);
      expect(comparison.insights.mathematicalWinner).toBe('AVALANCHE');
    });
  });
});
