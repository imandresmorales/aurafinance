import { describe, it, expect } from 'vitest';
import {
  evaluateOpportunityCost,
  compareOpportunityVsAlternative,
  scanTransactionOpportunityCosts,
  DEFAULT_OPPORTUNITY_CONFIG,
} from '../opportunityCostEngine';

describe('opportunityCostEngine', () => {
  describe('evaluateOpportunityCost', () => {
    it('evaluates one-off purchase opportunity cost across multiple horizons', () => {
      const result = evaluateOpportunityCost({
        amount: 1000,
        name: 'Smartphone Pro',
        frequency: 'ONE_OFF',
        category: 'TECH',
      }, {
        annualReturnRate: 0.08,
        inflationRate: 0.025,
        hourlyWage: 25,
      });

      expect(result.amount).toBe(1000);
      expect(result.annualizedCost).toBe(1000);
      expect(result.workHoursRequired).toBe(40); // 1000 / 25
      expect(result.projections).toHaveLength(5); // 1, 5, 10, 20, 30 years

      // At 10 years @ 8%: 1000 * 1.08^10 ≈ 2158.92
      const p10 = result.summary10Years;
      expect(p10.nominalFutureValue).toBeCloseTo(2158.92, 0);
      expect(p10.multiplier).toBeCloseTo(2.16, 1);
      expect(p10.compoundGainsNominal).toBeGreaterThan(1150);

      // At 30 years @ 8%: 1000 * 1.08^30 ≈ 10062.66
      const p30 = result.summary30Years;
      expect(p30.nominalFutureValue).toBeCloseTo(10062.66, 0);
      expect(p30.multiplier).toBeCloseTo(10.06, 1);
      expect(p30.monthlyPassiveIncome).toBeGreaterThan(30); // 10062.66 * 0.04 / 12 ≈ 33.54

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('Regla de las 72 Horas');
    });

    it('evaluates recurring monthly subscription opportunity cost', () => {
      const result = evaluateOpportunityCost({
        amount: 50,
        name: 'Gimnasio Premium',
        frequency: 'MONTHLY',
        category: 'FITNESS',
      }, {
        annualReturnRate: 0.08,
      });

      expect(result.annualizedCost).toBe(600); // 50 * 12

      // In 10 years (120 months) of $50/mo @ 8%/yr:
      // FV = 50 * ((1 + 0.08/12)^120 - 1) / (0.08/12) ≈ 9,147
      const p10 = result.summary10Years;
      expect(p10.totalInvestedPrincipal).toBe(6000);
      expect(p10.nominalFutureValue).toBeGreaterThan(9000);
    });

    it('evaluates recurring annual expense opportunity cost', () => {
      const result = evaluateOpportunityCost({
        amount: 1200,
        name: 'Seguro Privado Opcional',
        frequency: 'ANNUAL',
      }, {
        annualReturnRate: 0.08,
      });

      expect(result.annualizedCost).toBe(1200);
      const p10 = result.summary10Years;
      expect(p10.totalInvestedPrincipal).toBe(12000);
      expect(p10.nominalFutureValue).toBeGreaterThan(17000);
    });

    it('assigns high impact rating and badges for large purchases', () => {
      const result = evaluateOpportunityCost({
        amount: 3000,
        name: 'Viaje Lujo',
        frequency: 'ONE_OFF',
      });

      expect(result.impactRating).toBe('HIGH');
      expect(result.badgeColor).toBe('#ef4444');
      expect(result.badgeLabel).toBe('Alto Impacto Patrimonial');
    });

    it('handles zero or invalid amount gracefully', () => {
      const result = evaluateOpportunityCost({ amount: 0 });
      expect(result.amount).toBe(0);
      expect(result.summary10Years.nominalFutureValue).toBe(0);
      expect(result.impactRating).toBe('LOW');
    });
  });

  describe('compareOpportunityVsAlternative', () => {
    it('provides multi-strategy comparison for an amount', () => {
      const comparison = compareOpportunityVsAlternative(2000);

      expect(comparison.amount).toBe(2000);
      expect(comparison.strategies).toHaveLength(4);

      const expense = comparison.strategies.find((s) => s.id === 'EXPENSE');
      const indexFund = comparison.strategies.find((s) => s.id === 'INDEX_FUND');
      const debtPayoff = comparison.strategies.find((s) => s.id === 'DEBT_PAYOFF');

      expect(expense.fv10Years).toBe(0);
      expect(indexFund.fv10Years).toBeGreaterThan(4000);
      expect(debtPayoff.fv10Years).toBeGreaterThan(10000);
      expect(comparison.topRecommendedAlternative.id).toBe('INDEX_FUND');
      expect(comparison.bestGuaranteedAlternative.id).toBe('DEBT_PAYOFF');
    });
  });

  describe('scanTransactionOpportunityCosts', () => {
    it('aggregates discretionary transactions into opportunity report', () => {
      const sampleTxs = [
        { id: '1', amount: 150, type: 'EXPENSE', isDiscretionary: true, category: 'RESTAURANT' },
        { id: '2', amount: 350, type: 'EXPENSE', isDiscretionary: true, category: 'SHOPPING' },
        { id: '3', amount: 800, type: 'EXPENSE', isDiscretionary: false, category: 'RENT' }, // fixed
        { id: '4', amount: 3000, type: 'INCOME', category: 'SALARY' }, // income
      ];

      const result = scanTransactionOpportunityCosts(sampleTxs);

      expect(result.transactionCount).toBe(2);
      expect(result.totalSpent).toBe(500); // 150 + 350
      expect(result.opportunityReport.amount).toBe(500);
      expect(result.opportunityReport.summary10Years.nominalFutureValue).toBeGreaterThan(1000);
    });

    it('handles empty transactions list gracefully', () => {
      const result = scanTransactionOpportunityCosts([]);
      expect(result.transactionCount).toBe(0);
      expect(result.totalSpent).toBe(0);
      expect(result.opportunityReport.amount).toBe(0);
    });
  });
});
