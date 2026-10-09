import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  compareAmortizationSystems,
  AMORTIZATION_SYSTEMS,
} from '../amortizationEngine';

describe('amortizationEngine', () => {
  describe('generateAmortizationSchedule', () => {
    it('generates French amortization schedule with fixed monthly payments and ending balance zero', () => {
      const result = generateAmortizationSchedule({
        principal: 12000,
        annualRate: 0.12, // 12%
        termMonths: 12,
        system: 'FRENCH',
      });

      expect(result.system).toBe('FRENCH');
      expect(result.schedule).toHaveLength(12);

      // Monthly payment for 12,000 @ 1%/mo for 12m ≈ 1066.19
      expect(result.monthlyPaymentAmount).toBeCloseTo(1066.19, 1);
      expect(result.schedule[0].beginningBalance).toBe(12000);
      expect(result.schedule[0].interestPayment).toBe(120); // 12000 * 0.01

      // Ending balance of final period must be 0
      expect(result.schedule[11].endingBalance).toBe(0);
      expect(result.totalPaid).toBeGreaterThan(12000);
    });

    it('generates German amortization schedule with fixed principal amortizations and decreasing payments', () => {
      const result = generateAmortizationSchedule({
        principal: 12000,
        annualRate: 0.12,
        termMonths: 12,
        system: 'GERMAN',
      });

      expect(result.system).toBe('GERMAN');
      expect(result.schedule).toHaveLength(12);

      // Constant principal portion = 12000 / 12 = 1000
      expect(result.schedule[0].principalPayment).toBe(1000);
      expect(result.schedule[5].principalPayment).toBe(1000);

      // Payment decreases: period 1 total payment (1000 + 120 = 1120) > period 12 total payment (1000 + 10 = 1010)
      expect(result.firstPaymentAmount).toBeGreaterThan(result.lastPaymentAmount);
      expect(result.schedule[11].endingBalance).toBe(0);
    });

    it('generates American amortization schedule with interest-only payments and balloon final payment', () => {
      const result = generateAmortizationSchedule({
        principal: 10000,
        annualRate: 0.10, // 10%
        termMonths: 6,
        system: 'AMERICAN',
      });

      expect(result.system).toBe('AMERICAN');
      expect(result.schedule).toHaveLength(6);

      // Period 1 to 5 pays only interest: 10000 * 0.10 / 12 ≈ 83.33
      expect(result.schedule[0].principalPayment).toBe(0);
      expect(result.schedule[0].totalPayment).toBeCloseTo(83.33, 1);

      // Period 6 pays full 10,000 principal + interest
      expect(result.schedule[5].principalPayment).toBe(10000);
      expect(result.schedule[5].totalPayment).toBeCloseTo(10083.33, 1);
      expect(result.schedule[5].endingBalance).toBe(0);
    });
  });

  describe('compareAmortizationSystems', () => {
    it('compares the 3 systems proving German has lowest total interest and American highest', () => {
      const comparison = compareAmortizationSystems(20000, 0.09, 24);

      const { french, german, american } = comparison.systems;

      // German total interest < French total interest < American total interest
      expect(german.totalInterest).toBeLessThan(french.totalInterest);
      expect(french.totalInterest).toBeLessThan(american.totalInterest);

      expect(comparison.cheapestSystem).toBe('GERMAN');
      expect(comparison.mostPredictableSystem).toBe('FRENCH');
    });
  });
});
