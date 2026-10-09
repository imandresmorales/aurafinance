import { describe, it, expect } from 'vitest';
import { compareMonthlyHabits, summarizeMonthTransactions } from '../monthlyHabitsEngine';

describe('monthlyHabitsEngine', () => {
  const prevMonthTx = [
    { id: 'p1', amount: 3000, type: 'INCOME', category: 'SALARY' },
    { id: 'p2', amount: 1000, type: 'EXPENSE', category: 'HOUSING', isDiscretionary: false },
    { id: 'p3', amount: 500, type: 'EXPENSE', category: 'GROCERIES', isDiscretionary: false },
    { id: 'p4', amount: 400, type: 'EXPENSE', category: 'RESTAURANT', isDiscretionary: true },
    { id: 'p5', amount: 300, type: 'EXPENSE', category: 'SHOPPING', isDiscretionary: true },
  ]; // Total income: 3000, Total expense: 2200, Net savings: 800 (26.7%), Discretionary: 700 (31.8%)

  const currMonthTx = [
    { id: 'c1', amount: 3200, type: 'INCOME', category: 'SALARY' },
    { id: 'c2', amount: 1000, type: 'EXPENSE', category: 'HOUSING', isDiscretionary: false },
    { id: 'c3', amount: 480, type: 'EXPENSE', category: 'GROCERIES', isDiscretionary: false },
    { id: 'c4', amount: 250, type: 'EXPENSE', category: 'RESTAURANT', isDiscretionary: true }, // reduced!
    { id: 'c5', amount: 150, type: 'EXPENSE', category: 'SHOPPING', isDiscretionary: true }, // reduced!
  ]; // Total income: 3200, Total expense: 1880, Net savings: 1320 (41.3%), Discretionary: 400 (21.3%)

  describe('summarizeMonthTransactions', () => {
    it('summarizes income, expenses and discretionary splits accurately', () => {
      const summary = summarizeMonthTransactions(currMonthTx);
      expect(summary.totalIncome).toBe(3200);
      expect(summary.totalExpense).toBe(1880);
      expect(summary.netSavings).toBe(1320);
      expect(summary.savingsRate).toBe(41.3);
      expect(summary.discretionaryExpense).toBe(400);
      expect(summary.fixedExpense).toBe(1480);
    });

    it('handles empty transaction list gracefully', () => {
      const summary = summarizeMonthTransactions([]);
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.savingsRate).toBe(0);
    });
  });

  describe('compareMonthlyHabits', () => {
    it('computes month-over-month deltas, category shifts, and unlocks positive kudos', () => {
      const report = compareMonthlyHabits(currMonthTx, prevMonthTx);

      expect(report.grade).toBe('EXCELLENT');
      expect(report.deltas.expenseDelta).toBe(-320); // 1880 - 2200
      expect(report.deltas.expenseDeltaPercentage).toBeCloseTo(-14.5, 1);
      expect(report.deltas.savingsRateDelta).toBeGreaterThan(10);
      expect(report.kudos.length).toBeGreaterThanOrEqual(2);

      const restaurantShift = report.categoryShifts.find((c) => c.category === 'RESTAURANT');
      expect(restaurantShift).toBeDefined();
      expect(restaurantShift.diff).toBe(-150);
      expect(restaurantShift.isImprovement).toBe(true);
    });

    it('flags areas for improvement when spending increases in discretionary categories', () => {
      const worseMonthTx = [
        { id: 'w1', amount: 3000, type: 'INCOME', category: 'SALARY' },
        { id: 'w2', amount: 1000, type: 'EXPENSE', category: 'HOUSING', isDiscretionary: false },
        { id: 'w3', amount: 700, type: 'EXPENSE', category: 'RESTAURANT', isDiscretionary: true }, // +300
        { id: 'w4', amount: 900, type: 'EXPENSE', category: 'SHOPPING', isDiscretionary: true }, // +600
      ]; // Total expense: 2600

      const report = compareMonthlyHabits(worseMonthTx, prevMonthTx);
      expect(report.deltas.expenseDelta).toBeGreaterThan(0);
      expect(report.improvements.length).toBeGreaterThan(0);
      expect(report.improvements.some((i) => i.id.includes('SHOPPING'))).toBe(true);
    });
  });
});
