import { describe, it, expect } from 'vitest';
import {
  calculateBorrowingCapacity,
  calculateMaxLoanPrincipal,
  estimateBorrowingScenarios,
} from '../borrowingCapacityEngine';

describe('borrowingCapacityEngine', () => {
  describe('calculateBorrowingCapacity', () => {
    it('calculates DTI, safe payment thresholds, and available borrowing margin', () => {
      const result = calculateBorrowingCapacity({
        netMonthlyIncome: 4000,
        currentMonthlyDebtPayments: 600, // DTI = 15%
        monthlyLivingExpenses: 2200,
        maxSafeDTIPct: 30, // max safe = 1200
      });

      expect(result.netMonthlyIncome).toBe(4000);
      expect(result.currentDTI).toBe(15);
      expect(result.maxSafeMonthlyPayment).toBe(1200); // 4000 * 0.30
      expect(result.availableSafeMonthlyMargin).toBe(600); // 1200 - 600
      expect(result.isOverIndebted).toBe(false);
      expect(result.tier.key).toBe('OPTIMAL');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('flags over-indebtedness when DTI exceeds safety threshold', () => {
      const result = calculateBorrowingCapacity({
        netMonthlyIncome: 3000,
        currentMonthlyDebtPayments: 1350, // DTI = 45%
        monthlyLivingExpenses: 1800,
      });

      expect(result.currentDTI).toBe(45);
      expect(result.isOverIndebted).toBe(true);
      expect(result.availableSafeMonthlyMargin).toBe(0);
      expect(result.tier.key).toBe('DANGER');
      expect(result.recommendations[0]).toContain('Evita adquirir nuevos créditos');
    });
  });

  describe('calculateMaxLoanPrincipal', () => {
    it('calculates maximum loan principal supported by a monthly quota', () => {
      const result = calculateMaxLoanPrincipal({
        maxMonthlyPayment: 500,
        annualInterestRate: 0.08, // 8%
        termMonths: 36, // 3 years
      });

      expect(result.maxMonthlyPayment).toBe(500);
      expect(result.maxPrincipal).toBeGreaterThan(15000);
      expect(result.totalFinancingCost).toBe(18000); // 500 * 36
      expect(result.totalInterestPaid).toBeGreaterThan(1000);
    });
  });

  describe('estimateBorrowingScenarios', () => {
    it('provides multi-horizon financing scenarios (Personal, Auto, Mortgage)', () => {
      const scenarios = estimateBorrowingScenarios(400);

      expect(scenarios).toHaveLength(3);
      const personal = scenarios.find((s) => s.id === 'PERSONAL');
      const auto = scenarios.find((s) => s.id === 'AUTO');
      const mortgage = scenarios.find((s) => s.id === 'MORTGAGE');

      expect(personal.maxPrincipal).toBeGreaterThan(10000);
      expect(auto.maxPrincipal).toBeGreaterThan(18000);
      expect(mortgage.maxPrincipal).toBeGreaterThan(45000);
    });
  });
});
