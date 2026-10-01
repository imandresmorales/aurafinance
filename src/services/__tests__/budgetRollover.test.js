import { describe, it, expect } from 'vitest';
import {
  ROLLOVER_ACTIONS,
  calculatePeriodEndAnalysis,
  applyPeriodRollover,
} from '../budgetRolloverEngine';

describe('Smart Budget Roll-over & Period-End Adjustment Engine', () => {
  const closedPeriod = '2026-08';
  const nextPeriod = '2026-09';

  const mockBudgets = [
    { id: 'b1', name: 'Alimentación', category: 'Alimentación', limit: 500, allocated: 500 },
    { id: 'b2', name: 'Transporte', category: 'Transporte', limit: 200, allocated: 200 },
    { id: 'b3', name: 'Ocio', category: 'Ocio', limit: 150, allocated: 150 },
  ];

  const mockTransactions = [
    { id: 't1', type: 'expense', category: 'Alimentación', amount: 350, date: '2026-08-10' }, // Surplus: +150
    { id: 't2', type: 'expense', category: 'Transporte', amount: 200, date: '2026-08-15' },   // Surplus: 0
    { id: 't3', type: 'expense', category: 'Ocio', amount: 180, date: '2026-08-20' },         // Deficit: -30
  ];

  it('accurately calculates period-end variances and surpluses per envelope', () => {
    const analysis = calculatePeriodEndAnalysis(mockBudgets, mockTransactions, closedPeriod, nextPeriod);

    expect(analysis.closedPeriod).toBe(closedPeriod);
    expect(analysis.nextPeriod).toBe(nextPeriod);
    expect(analysis.totalPreviousBudget).toBe(850);
    expect(analysis.totalPreviousSpent).toBe(730);
    expect(analysis.totalNetSurplus).toBe(120); // 850 - 730
    expect(analysis.totalPositiveSurplus).toBe(150); // Alimentación surplus

    const food = analysis.envelopes.find(e => e.category === 'Alimentación');
    expect(food.baseAllocated).toBe(500);
    expect(food.actualSpent).toBe(350);
    expect(food.surplus).toBe(150);
    expect(food.percentSpent).toBe(70);
  });

  it('correctly applies ROLLOVER_BALANCE policy (carries surplus into next month)', () => {
    const analysis = calculatePeriodEndAnalysis(mockBudgets, mockTransactions, closedPeriod, nextPeriod);

    // Set Alimentación to carry over its 150 surplus
    const customReviews = analysis.envelopes.map(e => {
      if (e.id === 'b1') return { ...e, selectedAction: ROLLOVER_ACTIONS.ROLLOVER_BALANCE };
      return e;
    });

    const result = applyPeriodRollover(mockBudgets, customReviews, nextPeriod);

    const updatedFood = result.updatedBudgets.find(b => b.id === 'b1');
    expect(updatedFood.allocated).toBe(650); // 500 + 150 surplus
    expect(updatedFood.period).toBe(nextPeriod);
  });

  it('correctly applies SWEEP_TO_SAVINGS policy (sweeps surplus and maintains base allocation)', () => {
    const analysis = calculatePeriodEndAnalysis(mockBudgets, mockTransactions, closedPeriod, nextPeriod);

    const customReviews = analysis.envelopes.map(e => {
      if (e.id === 'b1') return { ...e, selectedAction: ROLLOVER_ACTIONS.SWEEP_TO_SAVINGS };
      return e;
    });

    const result = applyPeriodRollover(mockBudgets, customReviews, nextPeriod);

    expect(result.totalSweptToSavings).toBe(150);
    const updatedFood = result.updatedBudgets.find(b => b.id === 'b1');
    expect(updatedFood.allocated).toBe(500); // Reset to base
  });

  it('correctly applies ADAPTIVE_SMART policy based on recent spending', () => {
    const analysis = calculatePeriodEndAnalysis(mockBudgets, mockTransactions, closedPeriod, nextPeriod);

    // Actual spent was 350, 105% buffer is 367.5 -> rounded to nearest 5 is 370
    const customReviews = analysis.envelopes.map(e => {
      if (e.id === 'b1') return { ...e, selectedAction: ROLLOVER_ACTIONS.ADAPTIVE_SMART };
      return e;
    });

    const result = applyPeriodRollover(mockBudgets, customReviews, nextPeriod);
    const updatedFood = result.updatedBudgets.find(b => b.id === 'b1');
    expect(updatedFood.allocated).toBe(370);
  });
});
