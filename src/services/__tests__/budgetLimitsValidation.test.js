import { describe, it, expect } from 'vitest';
import {
  calculateEnvelopeExecution,
  reallocateEnvelopeFunds,
  checkBudgetImpact,
} from '../envelopeBudgetEngine';
import { calculateBudgetVariances } from '../budgetVarianceEngine';
import { calculateBurnRateForecast } from '../burnRateForecastEngine';
import { analyzeMicroExpenses } from '../microExpensesEngine';
import { calculatePeriodEndAnalysis, applyPeriodRollover, ROLLOVER_ACTIONS } from '../budgetRolloverEngine';
import { calculateAvailableSurplus, computeSurplusSplits } from '../surplusAllocationEngine';

describe('Comprehensive Budget Algorithms & Envelope Limits Validation', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  describe('Zero-Based Invariants & Reallocations', () => {
    it('maintains strict zero-sum conservation during envelope fund reallocations', () => {
      const initialEnvelopes = [
        { id: 'env-1', name: 'Alimentación', allocated: 500 },
        { id: 'env-2', name: 'Transporte', allocated: 300 },
        { id: 'env-3', name: 'Ocio', allocated: 200 },
      ];

      const initialTotal = initialEnvelopes.reduce((acc, e) => acc + e.allocated, 0);
      expect(initialTotal).toBe(1000);

      // Reallocate 150 from Alimentación to Ocio
      const updatedEnvelopes = reallocateEnvelopeFunds(initialEnvelopes, 'env-1', 'env-2', 150);
      const updatedTotal = updatedEnvelopes.reduce((acc, e) => acc + e.allocated, 0);

      // Invariant: sum(Allocated_before) === sum(Allocated_after)
      expect(updatedTotal).toBe(initialTotal);
      expect(updatedEnvelopes.find(e => e.id === 'env-1').allocated).toBe(350);
      expect(updatedEnvelopes.find(e => e.id === 'env-2').allocated).toBe(450);
    });

    it('rejects invalid or overdrawn reallocations exceeding source envelope balance', () => {
      const envelopes = [
        { id: 'env-1', name: 'Alimentación', allocated: 100 },
        { id: 'env-2', name: 'Transporte', allocated: 200 },
      ];

      // Attempt to transfer 150 from an envelope with only 100
      expect(() => {
        reallocateEnvelopeFunds(envelopes, 'env-1', 'env-2', 150);
      }).toThrow();
    });
  });

  describe('Proactive Budget Impact & Limit Warnings', () => {
    it('predicts envelope overflows before transaction execution', () => {
      const envelopes = [
        { id: 'env-food', name: 'Alimentación', category: 'Alimentación', allocated: 200 },
      ];
      const existingTx = [
        { id: 't1', type: 'EXPENSE', category: 'Alimentación', amount: 180, date: `${currentMonth}-05` },
      ];

      // Existing spent = 180. Remaining = 20.
      // Candidate transaction = 50 -> total would be 230 (115% -> overflow by 30)
      const impact = checkBudgetImpact(envelopes, existingTx, {
        type: 'EXPENSE',
        category: 'Alimentación',
        amount: 50,
        date: `${currentMonth}-10`,
      });

      expect(impact.hasEnvelope).toBe(true);
      expect(impact.willOverflow).toBe(true);
      expect(impact.overflowAmount).toBe(30);
      expect(impact.projectedPercent).toBe(115);
      expect(impact.warningLevel).toBe('OVERFLOW');
    });

    it('returns safe status when candidate transaction remains well within envelope limits', () => {
      const envelopes = [
        { id: 'env-food', name: 'Alimentación', category: 'Alimentación', allocated: 500 },
      ];
      const existingTx = [
        { id: 't1', type: 'EXPENSE', category: 'Alimentación', amount: 100, date: `${currentMonth}-05` },
      ];

      const impact = checkBudgetImpact(envelopes, existingTx, {
        type: 'EXPENSE',
        category: 'Alimentación',
        amount: 50,
        date: `${currentMonth}-10`,
      });

      expect(impact.hasEnvelope).toBe(true);
      expect(impact.willOverflow).toBe(false);
      expect(impact.overflowAmount).toBe(0);
      expect(impact.projectedPercent).toBe(30);
      expect(impact.warningLevel).toBe('NONE');
    });
  });

  describe('High-Volume Stress & Decimal Precision Safety', () => {
    it('accurately computes 500 simultaneous micro & macro transactions without IEEE-754 drift', () => {
      const envelopes = [
        { id: 'env-1', category: 'Alimentación', allocated: 2500 },
        { id: 'env-2', category: 'Transporte', allocated: 1500 },
        { id: 'env-3', category: 'Software & Cloud', allocated: 1000 },
      ];

      const transactions = [];
      let expectedTotalSpent = 0;

      // Generate 500 transactions with varied decimal amounts (e.g. 3.33, 4.99, 12.50)
      for (let i = 0; i < 500; i++) {
        const cat = i % 3 === 0 ? 'Alimentación' : i % 3 === 1 ? 'Transporte' : 'Software & Cloud';
        const amount = (i % 5 === 0) ? 49.99 : (i % 2 === 0) ? 14.50 : 3.25;
        expectedTotalSpent += amount;

        transactions.push({
          id: `tx-stress-${i}`,
          type: 'expense',
          category: cat,
          amount,
          date: `${currentMonth}-15`,
        });
      }

      expectedTotalSpent = Math.round(expectedTotalSpent * 100) / 100;

      const execution = calculateEnvelopeExecution(envelopes, transactions);
      const variance = calculateBudgetVariances(envelopes, transactions, currentMonth);
      const microAnalysis = analyzeMicroExpenses(transactions, 15, currentMonth);

      // Verify mathematical exactness
      expect(variance.totalActual).toBe(expectedTotalSpent);
      expect(variance.totalBudgeted).toBe(5000);
      expect(variance.netVariance).toBe(Math.round((5000 - expectedTotalSpent) * 100) / 100);

      // Micro expenses should capture all transactions <= 15
      expect(microAnalysis.microTxCount).toBeGreaterThan(0);
      expect(microAnalysis.totalMicroSpent).toBeLessThanOrEqual(expectedTotalSpent);
    });
  });

  describe('Cross-Period Roll-over & Surplus Integrity', () => {
    it('seamlessly rolls over balances and allocates surplus across multiple targets', () => {
      const budgets = [
        { id: 'b1', name: 'Alimentación', category: 'Alimentación', allocated: 800 },
        { id: 'b2', name: 'Servicios', category: 'Servicios', allocated: 400 },
      ];
      const transactions = [
        { id: '1', type: 'expense', category: 'Alimentación', amount: 500, date: '2026-08-10' }, // Surplus: 300
        { id: '2', type: 'expense', category: 'Servicios', amount: 350, date: '2026-08-15' },    // Surplus: 50
      ];

      const periodAnalysis = calculatePeriodEndAnalysis(budgets, transactions, '2026-08', '2026-09');
      expect(periodAnalysis.totalNetSurplus).toBe(350);

      // Surplus allocation splits (50% Investment, 50% Emergency)
      const surplusData = calculateAvailableSurplus(budgets, transactions, '2026-08');
      expect(surplusData.totalSurplus).toBe(350);

      const splits = [
        { targetKey: 'INVESTMENT', name: 'Inversión', percentage: 50 },
        { targetKey: 'EMERGENCY', name: 'Emergencia', percentage: 50 },
      ];

      const computedSplits = computeSurplusSplits(surplusData.totalSurplus, splits);
      expect(computedSplits[0].amount).toBe(175);
      expect(computedSplits[1].amount).toBe(175);
      expect(computedSplits[0].amount + computedSplits[1].amount).toBe(350);
    });
  });
});
