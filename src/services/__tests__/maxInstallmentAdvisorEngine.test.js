import { describe, it, expect } from 'vitest';
import {
  DTI_THRESHOLDS,
  calculateMaxSafeInstallment,
  simulateBorrowingCapacity,
  stressTestInstallment
} from '../maxInstallmentAdvisorEngine.js';

describe('maxInstallmentAdvisorEngine', () => {
  describe('calculateMaxSafeInstallment', () => {
    it('returns zeroes and critical status for zero income', () => {
      const res = calculateMaxSafeInstallment({ monthlyIncome: 0 });
      expect(res.status).toBe('CRITICAL_OVERBURDENED');
      expect(res.recommendedMaxInstallment).toBe(0);
      expect(res.tiers.moderate).toBe(0);
    });

    it('calculates safe max installment with moderate DTI and disposable cash flow', () => {
      // Income: 5000, current debt: 500 (10% DTI), fixed expenses: 2000
      // Disposable = 5000 - 500 - 2000 = 2500
      // Buffer = 20% of 2500 = 500 -> CashFlow Max = 2000
      // Moderate DTI ceiling = 5000 * 0.35 - 500 = 1750 - 500 = 1250
      // Recommended = min(1250, 2000) = 1250
      const res = calculateMaxSafeInstallment({
        monthlyIncome: 5000,
        existingDebtPayments: 500,
        fixedExpenses: 2000,
        dtiTier: 'MODERATE'
      });

      expect(res.currentDtiPercent).toBe(10);
      expect(res.maxInstallmentDti).toBe(1250);
      expect(res.maxInstallmentCashFlow).toBe(2000);
      expect(res.recommendedMaxInstallment).toBe(1250);
      expect(res.status).toBe('EXCELLENT_CAPACITY');
      expect(res.tiers.conservative).toBe(900); // 5000 * 0.28 - 500 = 900
    });

    it('caps installment when fixed expenses are very high and limit cash flow', () => {
      // Income 4000, debt 0, fixed expenses 3500
      // Disposable = 500. Buffer = 100. Cash flow max = 400.
      // DTI 35% of 4000 = 1400.
      // Recommended should be capped by cash flow at 400.
      const res = calculateMaxSafeInstallment({
        monthlyIncome: 4000,
        existingDebtPayments: 0,
        fixedExpenses: 3500
      });

      expect(res.maxInstallmentCashFlow).toBe(400);
      expect(res.recommendedMaxInstallment).toBe(400);
      expect(res.recommendations.some(r => r.includes('restringen tu flujo'))).toBe(true);
    });

    it('identifies critical overburdened state when DTI exceeds 40%', () => {
      const res = calculateMaxSafeInstallment({
        monthlyIncome: 3000,
        existingDebtPayments: 1500, // 50% DTI
        fixedExpenses: 1200
      });

      expect(res.status).toBe('CRITICAL_OVERBURDENED');
      expect(res.recommendedMaxInstallment).toBe(0);
    });
  });

  describe('simulateBorrowingCapacity', () => {
    it('returns empty array if installment is zero or negative', () => {
      expect(simulateBorrowingCapacity({ monthlyInstallment: 0 })).toEqual([]);
    });

    it('computes loan principal and interest correctly across terms', () => {
      // 500/mo at 12% APR for 12 months (monthly rate = 0.01)
      // PV = 500 * (1 - (1.01)^-12) / 0.01 = 500 * 11.255077 = ~5627.54
      const res = simulateBorrowingCapacity({
        monthlyInstallment: 500,
        annualInterestRate: 12,
        termsInMonths: [12, 36]
      });

      expect(res).toHaveLength(2);
      expect(res[0].termMonths).toBe(12);
      expect(res[0].maxPrincipal).toBeCloseTo(5627.54, 1);
      expect(res[0].totalPaid).toBe(6000);
      expect(res[0].totalInterest).toBeCloseTo(372.46, 1);

      // 36 months should allow higher principal but higher total interest
      expect(res[1].maxPrincipal).toBeGreaterThan(res[0].maxPrincipal);
      expect(res[1].totalInterest).toBeGreaterThan(res[0].totalInterest);
    });

    it('handles 0% interest rate gracefully', () => {
      const res = simulateBorrowingCapacity({
        monthlyInstallment: 200,
        annualInterestRate: 0,
        termsInMonths: [10]
      });

      expect(res[0].maxPrincipal).toBe(2000);
      expect(res[0].totalInterest).toBe(0);
    });
  });

  describe('stressTestInstallment', () => {
    it('evaluates safe margin in resilient scenario', () => {
      const test = stressTestInstallment({
        monthlyIncome: 6000,
        existingDebtPayments: 300,
        fixedExpenses: 2000,
        proposedInstallment: 400
      });

      expect(test.verdict).toBe('RESISTENTE');
      expect(test.resilienceScore).toBe(100);
      expect(test.scenarios.incomeDrop15Percent.isDeficit).toBe(false);
      expect(test.scenarios.inflationSurge10Percent.isDeficit).toBe(false);
    });

    it('flags high risk when debt commitment leads to deficit under shocks', () => {
      const test = stressTestInstallment({
        monthlyIncome: 2000,
        existingDebtPayments: 600,
        fixedExpenses: 1200,
        proposedInstallment: 300
      });

      // Income 2000 - debt 900 - expenses 1200 = -100 (base deficit)
      expect(test.baseMargin).toBe(-100);
      expect(test.verdict).toBe('ALTO_RIESGO');
      expect(test.scenarios.incomeDrop15Percent.isDeficit).toBe(true);
    });
  });
});
