import { describe, it, expect } from 'vitest';
import {
  calculateProgressiveTax,
  planTaxSavings,
  DEFAULT_TAX_BRACKETS,
} from '../taxSavingsPlannerEngine';

describe('taxSavingsPlannerEngine', () => {
  describe('calculateProgressiveTax', () => {
    it('calculates progressive tax correctly across standard brackets', () => {
      // Income = $50,000
      // Bracket 1: 11,600 * 10% = 1,160
      // Bracket 2: (47,150 - 11,600) * 12% = 35,550 * 12% = 4,266
      // Bracket 3: (50,000 - 47,150) * 22% = 2,850 * 22% = 627
      // Total = 1,160 + 4,266 + 627 = 6,053
      const result = calculateProgressiveTax(50000);

      expect(result.taxableIncome).toBe(50000);
      expect(result.totalTax).toBeCloseTo(6053, 0);
      expect(result.marginalRatePct).toBe(22);
      expect(result.effectiveRate).toBeCloseTo(12.11, 1);
      expect(result.breakdown).toHaveLength(3);
    });

    it('handles zero income gracefully', () => {
      const result = calculateProgressiveTax(0);
      expect(result.totalTax).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });
  });

  describe('planTaxSavings', () => {
    it('selects Standard Deduction when itemized expenses are lower', () => {
      const result = planTaxSavings({
        grossAnnualIncome: 60000,
        deductibleExpenses: 5000, // < 14,600 standard
      });

      expect(result.optimalStrategy).toBe('STANDARD');
      expect(result.optimalDeductionAmount).toBe(14600);
      expect(result.netTaxSavings).toBeGreaterThan(1500);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('selects Itemized Deductions when allowable itemized exceeds standard deduction', () => {
      const result = planTaxSavings({
        grossAnnualIncome: 120000,
        deductibleExpenses: 18000,
      }, {
        standardDeduction: 14600,
        maxDeductionCapPct: 0.20, // max 24,000
      });

      expect(result.optimalStrategy).toBe('ITEMIZED');
      expect(result.optimalDeductionAmount).toBe(18000);
      expect(result.netTaxSavings).toBeGreaterThan(3000);
      expect(result.effectiveRateAfter).toBeLessThan(result.effectiveRateBefore);
    });

    it('applies statutory deduction cap when deductions exceed threshold', () => {
      const result = planTaxSavings({
        grossAnnualIncome: 80000,
        deductibleExpenses: 25000,
      }, {
        maxDeductionCapPct: 0.15, // 15% of 80,000 = 12,000 max allowable
      });

      expect(result.maxAllowableItemized).toBe(12000);
      expect(result.applicableItemizedDeductions).toBe(12000);
      expect(result.isCapped).toBe(true);
    });
  });
});
