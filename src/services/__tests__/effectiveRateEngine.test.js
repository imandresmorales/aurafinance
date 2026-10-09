import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveAPR,
  rankDebtsByTrueCost,
} from '../effectiveRateEngine';

describe('effectiveRateEngine', () => {
  describe('calculateEffectiveAPR', () => {
    it('calculates pure nominal APR without fees', () => {
      const result = calculateEffectiveAPR({
        principal: 10000,
        nominalAnnualRate: 0.12, // 12%
        termMonths: 12,
      });

      expect(result.principal).toBe(10000);
      expect(result.nominalAnnualRatePct).toBe(12);
      expect(result.effectiveAPRPct).toBeCloseTo(12.7, 1); // (1 + 0.12/12)^12 - 1 = 12.68%
      expect(result.hiddenFeeMarkupPct).toBeLessThan(1);
    });

    it('uncovers massive effective APR markup when origination and insurance fees are loaded', () => {
      const result = calculateEffectiveAPR({
        principal: 10000,
        nominalAnnualRate: 0.16, // nominal 16%
        termMonths: 24,
        originationFeePct: 0.03, // 3% upfront fee ($300)
        monthlyMaintenanceFee: 15, // $15/mo
        monthlyInsuranceFee: 10,   // $10/mo
      });

      // True effective APR should exceed 24% because of $300 upfront + $25/mo fees
      expect(result.effectiveAPRPct).toBeGreaterThan(24);
      expect(result.hiddenFeeMarkupPct).toBeGreaterThan(8);
      expect(result.feesBreakdown.totalFeesPaid).toBe(300 + 25 * 24); // 900
      expect(result.bleeding.monthly).toBeGreaterThan(100);
      expect(result.severity).toMatch(/HIGH|CRITICAL/);
    });
  });

  describe('rankDebtsByTrueCost', () => {
    it('ranks debts by CAT/APR descending exposing most toxic credit first', () => {
      const debts = [
        { id: '1', name: 'Microcrédito Nómina', interestRate: 0.35, originationFeePct: 0.05, termMonths: 12 },
        { id: '2', name: 'Hipoteca', interestRate: 0.08, originationFeePct: 0.01, termMonths: 240 },
        { id: '3', name: 'Tarjeta Tienda', interestRate: 0.28, annualCardFee: 80, termMonths: 12 },
      ];

      const ranked = rankDebtsByTrueCost(debts);

      expect(ranked[0].debtId).toBe('1'); // highest CAT
      expect(ranked[ranked.length - 1].debtId).toBe('2'); // lowest CAT (Hipoteca)
    });
  });
});
